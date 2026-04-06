// ============================================================
// Route Handler — Single Product (get + update + delete)
// ============================================================
// BFF Pattern: Proxies requests to NestJS backend.
//
// NestJS backend: http://localhost:3001 (or BACKEND_URL env)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.BACKEND_URL || 'http://localhost:3001';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    const res = await fetch(`${BACKEND_URL}/products/${id}`, {
      headers: { 'Content-Type': 'application/json' },
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

  try {
    const body = await request.json();

    const res = await fetch(`${BACKEND_URL}/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
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

  try {
    const res = await fetch(`${BACKEND_URL}/products/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
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
