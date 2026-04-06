// ============================================================
// Route Handler — Distributors (list only for dropdowns)
// ============================================================
// BFF Pattern: Proxies requests to NestJS backend.
// ============================================================

import { NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/distributors`, {
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
      distributors: data,
    });
  } catch (error) {
    console.error('[Distributors API] GET /distributors error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch distributors', distributors: [] },
      { status: 500 }
    );
  }
}
