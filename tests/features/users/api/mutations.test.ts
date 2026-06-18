import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createUserMutation,
  updateUserMutation,
  deleteUserMutation,
} from '@/features/users/api/mutations';
import { userKeys } from '@/features/users/api/queries';

// ============================================================
// Mock service layer
// ============================================================
const mocks = vi.hoisted(() => ({
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
}));

vi.mock('@/features/users/api/service', () => ({
  createUser: mocks.createUser,
  updateUser: mocks.updateUser,
  deleteUser: mocks.deleteUser,
}));

// ============================================================
// Mock query-client
// ============================================================
const mockInvalidateQueries = vi.fn();
const mockQueryClient = { invalidateQueries: mockInvalidateQueries };

vi.mock('@/lib/query-client', () => ({
  getQueryClient: () => mockQueryClient,
}));

describe('users api/mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================
  // createUserMutation
  // ============================================================
  describe('createUserMutation', () => {
    it('has mutationFn function', () => {
      expect(typeof createUserMutation.mutationFn).toBe('function');
    });

    it('mutationFn(data) calls createUser(data) and returns its result', async () => {
      const payload = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        role: 'admin',
        status: 'active',
      };
      const mockResponse = {
        success: true,
        time: '2024-01-01',
        message: 'User created',
        user: { id: 1, ...payload },
      };
      mocks.createUser.mockResolvedValueOnce(mockResponse);

      const result = await createUserMutation.mutationFn(payload);

      expect(mocks.createUser).toHaveBeenCalledWith(payload);
      expect(result).toEqual(mockResponse);
    });

    it('onSuccess invalidates ["users"]', async () => {
      await createUserMutation.onSuccess!(
        { success: true, time: '', message: 'ok', user: {} },
        { first_name: 'John' },
        undefined
      );

      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['users'] });
    });

    it('onSuccess receives 3 args: data, variables, context', async () => {
      const mockData = { success: true, time: '', message: 'ok', user: {} };
      const mockVariables = { first_name: 'John' };
      const mockContext = undefined;

      await createUserMutation.onSuccess!(mockData, mockVariables, mockContext);

      expect(mockInvalidateQueries).toHaveBeenCalled();
    });
  });

  // ============================================================
  // updateUserMutation
  // ============================================================
  describe('updateUserMutation', () => {
    it('has mutationFn function', () => {
      expect(typeof updateUserMutation.mutationFn).toBe('function');
    });

    it('mutationFn({ id, values }) calls updateUser(id, values) with correct destructured args', async () => {
      const mockResponse = {
        success: true,
        time: '2024-01-01',
        message: 'User updated',
        user: { id: 5, first_name: 'Updated' },
      };
      mocks.updateUser.mockResolvedValueOnce(mockResponse);

      const result = await updateUserMutation.mutationFn({
        id: 5,
        values: { first_name: 'Updated', last_name: 'Name' },
      });

      expect(mocks.updateUser).toHaveBeenCalledWith(5, {
        first_name: 'Updated',
        last_name: 'Name',
      });
      expect(result).toEqual(mockResponse);
    });

    it('onSuccess invalidates ["users"]', async () => {
      await updateUserMutation.onSuccess!(
        { success: true, time: '', message: 'ok', user: {} },
        { id: 1, values: {} },
        undefined
      );

      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['users'] });
    });
  });

  // ============================================================
  // deleteUserMutation
  // ============================================================
  describe('deleteUserMutation', () => {
    it('has mutationFn function', () => {
      expect(typeof deleteUserMutation.mutationFn).toBe('function');
    });

    it('mutationFn(id) calls deleteUser(id)', async () => {
      const mockResponse = { success: true, message: 'User deleted' };
      mocks.deleteUser.mockResolvedValueOnce(mockResponse);

      const result = await deleteUserMutation.mutationFn(5);

      expect(mocks.deleteUser).toHaveBeenCalledWith(5);
      expect(result).toEqual(mockResponse);
    });

    it('onSuccess invalidates ["users"]', async () => {
      await deleteUserMutation.onSuccess!(
        { success: true, message: 'Deleted' },
        5,
        undefined
      );

      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['users'] });
    });
  });

  // ============================================================
  // Cross-cutting
  // ============================================================
  describe('cross-cutting concerns', () => {
    it('all 3 mutations invalidate the SAME key (userKeys.all = ["users"])', async () => {
      await createUserMutation.onSuccess!({ success: true, time: '', message: 'ok', user: {} }, {}, undefined);
      await updateUserMutation.onSuccess!({ success: true, time: '', message: 'ok', user: {} }, { id: 1, values: {} }, undefined);
      await deleteUserMutation.onSuccess!({ success: true, message: 'ok' }, 1, undefined);

      const allCalls = mockInvalidateQueries.mock.calls.map((c) => c[0]);
      const uniqueKeys = [...new Set(allCalls.map((c) => JSON.stringify(c.queryKey)))];
      expect(uniqueKeys).toHaveLength(1);
      expect(uniqueKeys[0]).toBe(JSON.stringify(['users']));
    });

    it('calling onSuccess completes synchronously without throwing', () => {
      // onSuccess from mutationOptions returns void — verify it doesn't throw
      expect(() =>
        createUserMutation.onSuccess!(
          { success: true, time: '', message: 'ok', user: {} },
          {},
          undefined
        )
      ).not.toThrow();
    });

    it('invalidateQueries is called with EXACTLY { queryKey: ["users"] } — no extra args', async () => {
      await createUserMutation.onSuccess!(
        { success: true, time: '', message: 'ok', user: {} },
        {},
        undefined
      );

      expect(mockInvalidateQueries).toHaveBeenCalledTimes(1);
      const callArg = mockInvalidateQueries.mock.calls[0][0];
      expect(callArg).toEqual({ queryKey: ['users'] });
      expect(Object.keys(callArg)).toHaveLength(1);
    });
  });
});
