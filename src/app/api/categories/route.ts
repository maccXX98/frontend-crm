// ============================================================
// Route Handler — Categories (list only for dropdowns)
// ============================================================
// BFF Pattern: Proxies requests to NestJS backend.
//
// NEXT_PUBLIC_BACKEND_URL = http://localhost:3000/api (includes /api prefix)
// ============================================================

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/api';

async function getAccessTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  const accessTokenCookie = cookieStore.get('access_token');
  return accessTokenCookie?.value || null;
}

export async function GET() {
  const accessToken = await getAccessTokenFromCookies();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
    const res = await fetch(`${BACKEND_URL}/categories`, {
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
