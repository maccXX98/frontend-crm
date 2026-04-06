import { useAuthStore } from '@/stores/auth-store';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface ApiClientOptions extends RequestInit {
  skipAuth?: boolean;
}

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

async function refreshToken(): Promise<string | null> {
  if (isRefreshing) {
    return new Promise((resolve) => {
      subscribeTokenRefresh(resolve);
    });
  }

  isRefreshing = true;

  try {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (!refreshToken) {
      throw new Error('No refresh token');
    }

    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    if (!res.ok) {
      throw new Error('Refresh failed');
    }

    const data = await res.json();
    useAuthStore.getState().setToken(data.access_token, data.refresh_token);
    onRefreshed(data.access_token);
    return data.access_token;
  } catch {
    useAuthStore.getState().logout();
    return null;
  } finally {
    isRefreshing = false;
  }
}

export async function apiClient<T>(endpoint: string, options: ApiClientOptions = {}): Promise<T> {
  const { skipAuth = false, ...fetchOptions } = options;

  const headers = new Headers(fetchOptions.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (!skipAuth) {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
  }

  const makeRequest = async (token?: string): Promise<T> => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...fetchOptions,
      headers: token ? new Headers(headers).set('Authorization', `Bearer ${token}`) : headers
    });

    if (res.status === 401 && !skipAuth) {
      const newToken = await refreshToken();
      if (newToken) {
        return makeRequest(newToken);
      }
      throw new Error('Unauthorized');
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: `API error: ${res.status}` }));
      throw new Error(error.message || `API error: ${res.status}`);
    }

    return res.json() as Promise<T>;
  };

  return makeRequest();
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return useAuthStore.getState().accessToken;
}

export function getUser(): { firstname: string; role: string; photo?: string } | null {
  if (typeof window === 'undefined') return null;
  return useAuthStore.getState().user;
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return useAuthStore.getState().isAuthenticated;
}
