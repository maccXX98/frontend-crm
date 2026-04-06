// ============================================================
// Route Handler — Single Product (get + update + delete)
// ============================================================
// BFF Pattern: Proxies requests to NestJS backend.
//
// NEXT_PUBLIC_BACKEND_URL = http://localhost:3000/api (includes /api prefix)
// Route handler path: /api/products/[id] → proxies to NestJS /api/products/:id
// ============================================================

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

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;

  const accessToken = await getAccessTokenFromCookies();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
    const res = await fetch(`${BACKEND_URL}/products/${id}`, {
      headers,
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, message: `Backend error: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    return NextResponse.json({
      success: true,
      time: new Date().toISOString(),
      message: 'Product fetched successfully',
      product: data,
    });
  } catch (error) {
    console.error(`[Products API] GET /products/${id} error:`, error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();

  const accessToken = await getAccessTokenFromCookies();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
    const res = await fetch(`${BACKEND_URL}/products/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, message: `Backend error: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    return NextResponse.json({
      success: true,
      time: new Date().toISOString(),
      message: 'Product updated successfully',
      product: data,
    });
  } catch (error) {
    console.error(`[Products API] PATCH /products/${id} error:`, error);
    return NextResponse.json(
      { success: false, message: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;

  const accessToken = await getAccessTokenFromCookies();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
    const res = await fetch(`${BACKEND_URL}/products/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, message: `Backend error: ${res.status}` },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      time: new Date().toISOString(),
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error(`[Products API] DELETE /products/${id} error:`, error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
