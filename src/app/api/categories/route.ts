// ============================================================
// Route Handler — Categories (list only for dropdowns)
// ============================================================
// BFF Pattern: Proxies requests to NestJS backend.
// ============================================================

import { NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/categories`, {
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

    return NextResponse.json({
      success: true,
      categories: data,
    });
  } catch (error) {
    console.error('[Categories API] GET /categories error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch categories', categories: [] },
      { status: 500 }
    );
  }
}
