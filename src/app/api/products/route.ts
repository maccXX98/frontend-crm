// ============================================================
// Route Handler — Products (list + create)
// ============================================================
// BFF Pattern: Proxies requests to NestJS backend.
//
// NestJS backend: http://localhost:3001 (or BACKEND_URL env)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.BACKEND_URL || 'http://localhost:3001';

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

  try {
    const res = await fetch(`${BACKEND_URL}/products${query ? `?${query}` : ''}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, message: `Backend error: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Transform backend response to frontend contract
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
  try {
    const body = await request.json();

    const res = await fetch(`${BACKEND_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
