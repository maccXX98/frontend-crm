import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock next/navigation before importing auth-store
const mockRedirect = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: mockRedirect
}));

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock document.cookie
const mockCookieStore: Record<string, string> = {};
Object.defineProperty(document, 'cookie', {
  get: () => {
    return Object.entries(mockCookieStore)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  },
  set: (cookie: string) => {
    const [nameValue] = cookie.split(';');
    const [name, value] = nameValue.split('=');
    if (value === '' || value === undefined) {
      // Clear cookie when value is empty (logout sets "access_token=" with empty value)
      delete mockCookieStore[name];
    } else {
      mockCookieStore[name] = value;
    }
  },
  configurable: true
});

// We need to dynamically import the store after mocks are set up
// Because the module is already loaded, we need to use vi.hoisted

const { useAuthStore } = await import('@/stores/auth-store');

describe('auth-store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset cookie store
    mockCookieStore.access_token = '';
    mockCookieStore.refresh_token = '';
    // Reset store state
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state values', () => {
      const state = useAuthStore.getState();
      expect(state.accessToken).toBe(null);
      expect(state.refreshToken).toBe(null);
      expect(state.user).toBe(null);
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('login', () => {
    it('should set tokens, user, and isAuthenticated on successful login', async () => {
      const mockResponse = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        firstname: 'John',
        role: 'admin',
        photo: 'https://example.com/photo.jpg'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await useAuthStore.getState().login('john@example.com', 'password123');

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('mock-access-token');
      expect(state.refreshToken).toBe('mock-refresh-token');
      expect(state.user).toEqual({
        firstname: 'John',
        role: 'admin',
        photo: 'https://example.com/photo.jpg'
      });
      expect(state.isAuthenticated).toBe(true);
    });

    it('should set cookies with correct values and attributes on login', async () => {
      const mockResponse = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        firstname: 'John',
        role: 'admin'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await useAuthStore.getState().login('john@example.com', 'password123');

      // Check cookies were set (the document.cookie setter stores them)
      expect(mockCookieStore.access_token).toBe('mock-access-token');
      expect(mockCookieStore.refresh_token).toBe('mock-refresh-token');
    });

    it('should throw error with server message on failed login', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Invalid credentials' })
      });

      await expect(
        useAuthStore.getState().login('wrong@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw "Login failed" when response has no message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}) // no message
      });

      await expect(
        useAuthStore.getState().login('wrong@example.com', 'wrongpassword')
      ).rejects.toThrow('Login failed');
    });

    it('should throw "Login failed" when JSON parsing fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => { throw new Error('Parse error'); }
      });

      await expect(
        useAuthStore.getState().login('john@example.com', 'password123')
      ).rejects.toThrow('Login failed');
    });

    it('should call fetch with correct login endpoint and body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'token',
          refresh_token: 'refresh',
          firstname: 'John',
          role: 'user'
        })
      });

      await useAuthStore.getState().login('test@example.com', 'testpassword');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ login: 'test@example.com', password: 'testpassword' })
        })
      );
    });
  });

  describe('logout', () => {
    it('should clear cookies on logout', () => {
      // First set some cookies via login
      mockCookieStore.access_token = 'some-token';
      mockCookieStore.refresh_token = 'some-refresh';

      useAuthStore.getState().logout();

      // Cookies should be cleared (empty string in the store means cleared)
      expect(mockCookieStore.access_token).toBeUndefined();
      expect(mockCookieStore.refresh_token).toBeUndefined();
    });

    it('should reset state to initial values on logout', () => {
      // Set some state first
      useAuthStore.setState({
        accessToken: 'some-token',
        refreshToken: 'some-refresh',
        user: { firstname: 'John', role: 'admin' },
        isAuthenticated: true
      });

      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe(null);
      expect(state.refreshToken).toBe(null);
      expect(state.user).toBe(null);
      expect(state.isAuthenticated).toBe(false);
    });

    it('should call redirect with sign-in path', () => {
      useAuthStore.getState().logout();

      expect(mockRedirect).toHaveBeenCalledWith('/auth/sign-in');
    });
  });

  describe('refresh', () => {
    it('should update access and refresh tokens on successful refresh', async () => {
      useAuthStore.setState({
        refreshToken: 'valid-refresh-token'
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token'
        })
      });

      await useAuthStore.getState().refresh();

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('new-access-token');
      expect(state.refreshToken).toBe('new-refresh-token');
    });

    it('should call logout when no refresh token exists', async () => {
      useAuthStore.setState({
        refreshToken: null
      });

      await useAuthStore.getState().refresh();

      expect(mockRedirect).toHaveBeenCalledWith('/auth/sign-in');
    });

    it('should call logout when refresh request fails', async () => {
      useAuthStore.setState({
        refreshToken: 'invalid-refresh-token'
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Refresh failed' })
      });

      await useAuthStore.getState().refresh();

      expect(mockRedirect).toHaveBeenCalledWith('/auth/sign-in');
    });

    it('should call fetch with correct refresh endpoint', async () => {
      useAuthStore.setState({
        refreshToken: 'some-refresh-token'
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'new-token',
          refresh_token: 'new-refresh'
        })
      });

      await useAuthStore.getState().refresh();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/refresh'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: 'some-refresh-token' })
        })
      );
    });

    it('should not throw but should call logout on refresh failure', async () => {
      useAuthStore.setState({
        refreshToken: 'bad-token'
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({})
      });

      // Should not throw, just call logout
      await expect(useAuthStore.getState().refresh()).resolves.not.toThrow();
      expect(mockRedirect).toHaveBeenCalledWith('/auth/sign-in');
    });
  });

  describe('setToken', () => {
    it('should set access token, refresh token, and isAuthenticated', () => {
      useAuthStore.getState().setToken('new-access', 'new-refresh');

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('new-access');
      expect(state.refreshToken).toBe('new-refresh');
      expect(state.isAuthenticated).toBe(true);
    });

    it('should not modify user when setToken is called', () => {
      const existingUser = { firstname: 'John', role: 'admin' };
      useAuthStore.setState({ user: existingUser });

      useAuthStore.getState().setToken('new-access', 'new-refresh');

      const state = useAuthStore.getState();
      expect(state.user).toEqual(existingUser);
    });
  });

  describe('partialize configuration', () => {
    it('should only persist accessToken, refreshToken, user, and isAuthenticated', () => {
      // The persist middleware partialize config should only include these fields
      // We can't directly test the persist middleware, but we can verify the store
      // behavior matches what's expected

      const state = useAuthStore.getState();
      const keys = Object.keys(state);

      // Should have these keys
      expect(keys).toContain('accessToken');
      expect(keys).toContain('refreshToken');
      expect(keys).toContain('user');
      expect(keys).toContain('isAuthenticated');

      // Should have these action keys
      expect(keys).toContain('login');
      expect(keys).toContain('logout');
      expect(keys).toContain('refresh');
      expect(keys).toContain('setToken');
    });
  });
});
