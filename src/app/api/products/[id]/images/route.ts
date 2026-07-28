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

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const accessToken = await getAccessTokenFromCookies();

  try {
    const formData = await request.formData();

    const headers: Record<string, string> = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const res = await fetch(`${BACKEND_URL}/products/${id}/images`, {
      method: 'POST',
      headers,
      body: formData,
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
      message: 'Image uploaded successfully',
      data,
    });
  } catch (error) {
    console.error(`[Products API] POST /products/${id}/images error:`, error);
    return NextResponse.json(
      { success: false, message: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
