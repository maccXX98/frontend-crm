import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/api';

type Params = { params: Promise<{ id: string }> };

async function getAccessTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  const accessTokenCookie = cookieStore.get('access_token');
  return accessTokenCookie?.value || null;
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const accessToken = await getAccessTokenFromCookies();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
    const res = await fetch(`${BACKEND_URL}/product-images/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (!res.ok) {
      const errorBody = await res.text();
      return NextResponse.json(
        { success: false, message: `Backend error: ${res.status}`, detail: errorBody },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
      data,
    });
  } catch (error) {
    console.error(`[ProductImages API] DELETE /product-images/${id} error:`, error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete image' },
      { status: 500 }
    );
  }
}
