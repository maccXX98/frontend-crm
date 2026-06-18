import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  userKeys,
  usersQueryOptions,
} from '@/features/users/api/queries';

// ============================================================
// Mock service layer
// ============================================================
const mocks = vi.hoisted(() => ({
  getUsers: vi.fn(),
}));

vi.mock('@/features/users/api/service', () => ({
  getUsers: mocks.getUsers,
}));

describe('users api/queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================
  // userKeys
  // ============================================================
  describe('userKeys', () => {
    it('userKeys.all is ["users"]', () => {
      expect(userKeys.all).toEqual(['users']);
      expect(userKeys.all).toHaveLength(1);
      expect(userKeys.all[0]).toBe('users');
    });

    it('userKeys.list(filters) returns ["users", "list", filters]', () => {
      const filters = { page: 1, limit: 10, search: 'john' };
      const result = userKeys.list(filters);
      expect(result).toEqual(['users', 'list', filters]);
    });

    it('userKeys.list({}) returns ["users", "list", {}]', () => {
      expect(userKeys.list({})).toEqual(['users', 'list', {}]);
    });

    it('userKeys.detail(id) returns ["users", "detail", id]', () => {
      expect(userKeys.detail(5)).toEqual(['users', 'detail', 5]);
    });

    it('userKeys.detail(0) returns ["users", "detail", 0]', () => {
      expect(userKeys.detail(0)).toEqual(['users', 'detail', 0]);
    });

    it('Different filter objects produce different key arrays', () => {
      const key1 = userKeys.list({ page: 1, limit: 10 });
      const key2 = userKeys.list({ page: 2, limit: 10 });
      const key3 = userKeys.list({ search: 'alice' });
      const key4 = userKeys.list({ roles: 'admin' });

      expect(key1).not.toEqual(key2);
      expect(key1).not.toEqual(key3);
      expect(key2).not.toEqual(key3);
      expect(key3).not.toEqual(key4);
    });

    it('Two calls with same filters produce structurally equal but different-reference keys', () => {
      const keyA = userKeys.list({ page: 1, limit: 10 });
      const keyB = userKeys.list({ page: 1, limit: 10 });
      expect(keyA).toEqual(keyB);
      expect(keyA).not.toBe(keyB);
    });
  });

  // ============================================================
  // usersQueryOptions
  // ============================================================
  describe('usersQueryOptions', () => {
    it('returns object with queryKey and queryFn', () => {
      const options = usersQueryOptions({ page: 1, limit: 10 });
      expect(options).toHaveProperty('queryKey');
      expect(options).toHaveProperty('queryFn');
      expect(typeof options.queryFn).toBe('function');
    });

    it('queryKey equals userKeys.list(filters)', () => {
      const filters = { page: 1, limit: 10 };
      const options = usersQueryOptions(filters);
      expect(options.queryKey).toEqual(userKeys.list(filters));
    });

    it('queryFn is a function', () => {
      const options = usersQueryOptions({});
      expect(typeof options.queryFn).toBe('function');
    });

    it('queryFn calls mocked getUsers(filters)', async () => {
      const mockResponse = {
        success: true,
        time: '2024-01-01',
        message: 'ok',
        total_users: 0,
        offset: 0,
        limit: 10,
        users: [],
      };
      mocks.getUsers.mockResolvedValueOnce(mockResponse);

      const options = usersQueryOptions({ page: 1, limit: 10 });
      await options.queryFn();

      expect(mocks.getUsers).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });

    it('queryFn returns query result', async () => {
      const mockResponse = {
        success: true,
        time: '2024-01-01',
        message: 'ok',
        total_users: 0,
        offset: 0,
        limit: 10,
        users: [],
      };
      mocks.getUsers.mockResolvedValueOnce(mockResponse);

      const options = usersQueryOptions({ page: 1, limit: 10 });
      const result = await options.queryFn();

      expect(result).toEqual(mockResponse);
    });

    it('different filters → getUsers called with correct filters each time', async () => {
      mocks.getUsers.mockResolvedValue({
        success: true, time: '', message: 'ok', total_users: 0, offset: 0, limit: 10, users: [],
      });

      const options1 = usersQueryOptions({ page: 1, limit: 10 });
      const options2 = usersQueryOptions({ search: 'john' });
      const options3 = usersQueryOptions({ roles: 'admin', page: 2 });

      await options1.queryFn();
      await options2.queryFn();
      await options3.queryFn();

      expect(mocks.getUsers).toHaveBeenCalledWith({ page: 1, limit: 10 });
      expect(mocks.getUsers).toHaveBeenCalledWith({ search: 'john' });
      expect(mocks.getUsers).toHaveBeenCalledWith({ roles: 'admin', page: 2 });
    });
  });
});
