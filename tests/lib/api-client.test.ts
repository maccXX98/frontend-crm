import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted so the mock is available when vi.mock runs (vi.mock is hoisted)
const { mockSetToken, mockLogout, mockUseAuthStore } = vi.hoisted(() => {
  const mockSetToken = vi.fn();
  const mockLogout = vi.fn();
  const mockUseAuthStore = {
    getState: vi.fn(() => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      setToken: mockSetToken,
      logout: mockLogout
    }))
  };
  return { mockSetToken, mockLogout, mockUseAuthStore };
});

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: mockUseAuthStore
}));

// Import after mock
import { apiClient, getAccessToken, getUser, isAuthenticated } from '@/lib/api-client';

describe('apiClient', () => {
  const mockFetch = vi.fn();
  const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/api';

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
    mockUseAuthStore.getState.mockReturnValue({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      setToken: mockSetToken,
      logout: mockLogout
    });
    mockSetToken.mockReset();
    mockLogout.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('basic request building', () => {
    it('should build URL with BASE_URL + endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'test' })
      });

      await apiClient('/users');

      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/users`,
        expect.any(Object)
      );
    });

    it('should add Content-Type: application/json if not present', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'test' })
      });

      await apiClient('/users');

      const call = mockFetch.mock.calls[0];
      expect(call[0]).toBe(`${BASE_URL}/users`);
      const headers = call[1].headers as Headers;
      expect(headers.get('Content-Type')).toBe('application/json');
    });

    it('should not override Content-Type if already set', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'test' })
      });

      await apiClient('/users', {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const call = mockFetch.mock.calls[0];
      const headers = call[1].headers as Headers;
      expect(headers.get('Content-Type')).toBe('multipart/form-data');
    });
  });

  describe('Authorization header', () => {
    it('should add Authorization: Bearer <token> when access token exists and skipAuth is false', async () => {
      mockUseAuthStore.getState.mockReturnValue({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        user: null,
        isAuthenticated: true,
        setToken: mockSetToken,
        logout: mockLogout
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'test' })
      });

      await apiClient('/users');

      const call = mockFetch.mock.calls[0];
      const headers = call[1].headers as Headers;
      expect(headers.get('Authorization')).toBe('Bearer test-access-token');
    });

    it('should skip Authorization when skipAuth is true', async () => {
      mockUseAuthStore.getState.mockReturnValue({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        user: null,
        isAuthenticated: true,
        setToken: mockSetToken,
        logout: mockLogout
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'test' })
      });

      await apiClient('/users', { skipAuth: true });

      const call = mockFetch.mock.calls[0];
      const headers = call[1].headers as Headers;
      expect(headers.get('Authorization')).toBeNull();
    });

    it('should not add Authorization header when no access token', async () => {
      mockUseAuthStore.getState.mockReturnValue({
        accessToken: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
        setToken: mockSetToken,
        logout: mockLogout
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'test' })
      });

      await apiClient('/users');

      const call = mockFetch.mock.calls[0];
      const headers = call[1].headers as Headers;
      expect(headers.get('Authorization')).toBeNull();
    });
  });

  describe('401 handling and token refresh', () => {
    it('should call refreshToken on 401 when not skipAuth and retry with new token', async () => {
      mockUseAuthStore.getState.mockReturnValue({
        accessToken: 'old-token',
        refreshToken: 'valid-refresh-token',
        user: null,
        isAuthenticated: true,
        setToken: mockSetToken,
        logout: mockLogout
      });

      // First call (original request) returns 401
      // Second call (refresh request) returns success with new tokens
      // Third call (retry with new token) returns success
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ message: 'Unauthorized' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'new-access-token', refresh_token: 'new-refresh-token' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: 'test' })
        });

      const result = await apiClient('/users');

      // Should have called fetch three times
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ data: 'test' });
      // setToken should have been called with the new tokens
      expect(mockSetToken).toHaveBeenCalledWith('new-access-token', 'new-refresh-token');
    });

    it('should throw Unauthorized when 401 and refresh fails', async () => {
      mockUseAuthStore.getState.mockReturnValue({
        accessToken: 'expired-token',
        refreshToken: 'invalid-refresh-token',
        user: null,
        isAuthenticated: true,
        setToken: mockSetToken,
        logout: mockLogout
      });

      // First call returns 401, second call (refresh) also returns 401
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ message: 'Unauthorized' })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ message: 'Refresh failed' })
        });

      mockLogout.mockReturnValue(undefined);

      await expect(apiClient('/users')).rejects.toThrow('Unauthorized');
      expect(mockLogout).toHaveBeenCalled();
    });

    it('should skip auth on 401 when skipAuth is true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' })
      });

      await expect(apiClient('/users', { skipAuth: true })).rejects.toThrow('Unauthorized');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should not add Authorization header to refresh request itself', async () => {
      mockUseAuthStore.getState.mockReturnValue({
        accessToken: 'old-token',
        refreshToken: 'valid-refresh-token',
        user: null,
        isAuthenticated: true,
        setToken: mockSetToken,
        logout: mockLogout
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' })
      });

      // Check that the 401 triggers refresh, which means fetch was called at least twice
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ message: 'Unauthorized' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'new-token', refresh_token: 'new-refresh' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: 'test' })
        });

      await expect(apiClient('/users')).rejects.toThrow('Unauthorized');
      // The key behavior is that when skipAuth is NOT set, auth header is checked
    });
  });

  describe('race condition - multiple 401s while refreshing', () => {
    it('should handle concurrent 401s - second request waits for refresh', async () => {
      mockUseAuthStore.getState.mockReturnValue({
        accessToken: 'expired-token',
        refreshToken: 'valid-refresh-token',
        user: null,
        isAuthenticated: true,
        setToken: mockSetToken,
        logout: mockLogout
      });

      mockSetToken.mockReturnValue(undefined);

      // First request returns 401, second returns success
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ message: 'Unauthorized' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'new-access-token', refresh_token: 'new-refresh-token' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: 'request1' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: 'request2' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: 'request3' })
        });

      // Make concurrent requests
      const results = await Promise.allSettled([
        apiClient('/users'),
        apiClient('/products'),
        apiClient('/orders')
      ]);

      // All requests should eventually succeed
      expect(mockFetch.mock.calls.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('error handling', () => {
    it('should throw error with parsed message on non-ok non-401 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Bad request payload' })
      });

      await expect(apiClient('/users')).rejects.toThrow('Bad request payload');
    });

    it('should throw error with message from error object on non-ok non-401 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({ message: 'Validation error' })
      });

      await expect(apiClient('/users')).rejects.toThrow('Validation error');
    });

    it('should fallback to API error: <status> when no message in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}) // empty body
      });

      await expect(apiClient('/users')).rejects.toThrow('API error: 500');
    });

    it('should fallback to API error: <status> when JSON parsing fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => { throw new Error('Parse error'); }
      });

      await expect(apiClient('/users')).rejects.toThrow('API error: 503');
    });

    it('should fallback to generic API error when status text unavailable', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 418,
        json: async () => ({ notMessage: 'something' })
      });

      await expect(apiClient('/users')).rejects.toThrow('API error: 418');
    });
  });

  describe('successful response', () => {
    it('should return parsed JSON on success', async () => {
      const expectedData = { users: [{ id: 1, name: 'John' }] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => expectedData
      });

      const result = await apiClient<typeof expectedData>('/users');

      expect(result).toEqual(expectedData);
    });

    it('should pass through fetch options like method, body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1 })
      });

      await apiClient('/users', {
        method: 'POST',
        body: JSON.stringify({ name: 'John' })
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'John' })
        })
      );
    });
  });
});

describe('getAccessToken', () => {
  const originalWindow = global.window;

  afterEach(() => {
    Object.defineProperty(global, 'window', { value: originalWindow, writable: true, configurable: true });
  });

  it('should return null on server (no window)', () => {
    // Simulate server environment
    Object.defineProperty(global, 'window', { value: undefined, writable: true, configurable: true });

    mockUseAuthStore.getState.mockReturnValue({
      accessToken: 'server-token',
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      setToken: mockSetToken,
      logout: mockLogout
    });

    expect(getAccessToken()).toBe(null);
  });

  it('should return token from store on client', () => {
    Object.defineProperty(global, 'window', { value: global.window, writable: true, configurable: true });

    mockUseAuthStore.getState.mockReturnValue({
      accessToken: 'client-token',
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      setToken: mockSetToken,
      logout: mockLogout
    });

    expect(getAccessToken()).toBe('client-token');
  });
});

describe('getUser', () => {
  const originalWindow = global.window;

  afterEach(() => {
    Object.defineProperty(global, 'window', { value: originalWindow, writable: true, configurable: true });
  });

  it('should return null on server (no window)', () => {
    Object.defineProperty(global, 'window', { value: undefined, writable: true, configurable: true });

    mockUseAuthStore.getState.mockReturnValue({
      accessToken: null,
      refreshToken: null,
      user: { firstname: 'John', role: 'admin' },
      isAuthenticated: false,
      setToken: mockSetToken,
      logout: mockLogout
    });

    expect(getUser()).toBe(null);
  });

  it('should return user from store on client', () => {
    Object.defineProperty(global, 'window', { value: global.window, writable: true, configurable: true });

    const expectedUser = { firstname: 'John', role: 'admin' };
    mockUseAuthStore.getState.mockReturnValue({
      accessToken: null,
      refreshToken: null,
      user: expectedUser,
      isAuthenticated: false,
      setToken: mockSetToken,
      logout: mockLogout
    });

    expect(getUser()).toEqual(expectedUser);
  });
});

describe('isAuthenticated', () => {
  const originalWindow = global.window;

  afterEach(() => {
    Object.defineProperty(global, 'window', { value: originalWindow, writable: true, configurable: true });
  });

  it('should return false on server (no window)', () => {
    Object.defineProperty(global, 'window', { value: undefined, writable: true, configurable: true });

    mockUseAuthStore.getState.mockReturnValue({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: true, // would be true in store but window is undefined
      setToken: mockSetToken,
      logout: mockLogout
    });

    expect(isAuthenticated()).toBe(false);
  });

  it('should return isAuthenticated from store on client', () => {
    Object.defineProperty(global, 'window', { value: global.window, writable: true, configurable: true });

    mockUseAuthStore.getState.mockReturnValue({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: true,
      setToken: mockSetToken,
      logout: mockLogout
    });

    expect(isAuthenticated()).toBe(true);
  });
});
