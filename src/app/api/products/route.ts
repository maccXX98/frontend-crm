// ============================================================
// Route Handler — Products (list + create)
// ============================================================
// BFF Pattern: Proxies requests to NestJS backend.
//
// NEXT_PUBLIC_BACKEND_URL = http://localhost:3000/api (includes /api prefix)
// Route handler path: /api/products → proxies to NestJS /api/products
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/api';

async function getAccessTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  const accessTokenCookie = cookieStore.get('access_token');
  return accessTokenCookie?.value || null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const page = Number(searchParams.get('page') ?? 1);
  const limit = Number(searchParams.get('limit') ?? 10);
  const categories = searchParams.get('categories') ?? undefined;
  const search = searchParams.get('search') ?? undefined;
  const sort = searchParams.get('sort') ?? undefined;

  const params = new URLSearchParams();
  if (page) params.set('page', String(page));
  if (limit) params.set('limit', String(limit));
  if (categories) params.set('categories', categories);
  if (search) params.set('search', search);
  if (sort) params.set('sort', sort);

  const query = params.toString();

  const accessToken = await getAccessTokenFromCookies();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
    const res = await fetch(`${BACKEND_URL}/products${query ? `?${query}` : ''}`, {
      method: 'GET',
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
      time: new Date().toISOString(),
      message: 'Products fetched successfully',
      total_products: Array.isArray(data) ? data.length : 0,
      offset: (page - 1) * limit,
      limit,
      products: Array.isArray(data) ? data : [],
    });
  } catch (error) {
    console.error('[Products API] GET /products error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const accessToken = await getAccessTokenFromCookies();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
    const res = await fetch(`${BACKEND_URL}/products`, {
      method: 'POST',
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

    return NextResponse.json(
      {
        success: true,
        time: new Date().toISOString(),
        message: 'Product created successfully',
        product: data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Products API] POST /products error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create product' },
      { status: 500 }
    );
  }
}
