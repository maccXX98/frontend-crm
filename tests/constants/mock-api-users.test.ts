import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fakeUsers, delay, User } from '@/constants/mock-api-users';

describe('mock-api-users', () => {
  beforeEach(() => {
    // Reset and reinitialize the fake users data before each test
    fakeUsers.records = [];
    fakeUsers.initialize();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('delay', () => {
    it('should delay for the specified milliseconds', async () => {
      vi.useFakeTimers();

      const promise = delay(800);
      vi.advanceTimersByTime(800);
      await promise;

      expect(true).toBe(true); // If we get here without error, delay worked
    });
  });

  describe('fakeUsers.initialize()', () => {
    it('should generate 50 users', () => {
      expect(fakeUsers.records).toHaveLength(50);
    });

    it('should generate users with IDs 1-50', () => {
      const ids = fakeUsers.records.map((u) => u.id).sort((a, b) => a - b);
      expect(ids).toEqual(
        Array.from({ length: 50 }, (_, i) => i + 1)
      );
    });

    it('should generate users with all required fields', () => {
      const user = fakeUsers.records[0];

      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('first_name');
      expect(user).toHaveProperty('last_name');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('phone');
      expect(user).toHaveProperty('status');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('created_at');
      expect(user).toHaveProperty('updated_at');
    });

    it('should generate valid email format', () => {
      fakeUsers.records.forEach((user) => {
        expect(user.email).toMatch(/^[\w.-]+@[\w.-]+\.\w+$/);
      });
    });

    it('should generate valid phone format', () => {
      fakeUsers.records.forEach((user) => {
        expect(typeof user.phone).toBe('string');
        expect(user.phone.length).toBeGreaterThan(0);
      });
    });

    it('should generate status from allowed values', () => {
      const allowedStatuses = ['Active', 'Inactive', 'Invited'];
      fakeUsers.records.forEach((user) => {
        expect(allowedStatuses).toContain(user.status);
      });
    });

    it('should generate role from allowed values', () => {
      const allowedRoles = ['Developer', 'Designer', 'Manager', 'QA', 'DevOps', 'Product Owner'];
      fakeUsers.records.forEach((user) => {
        expect(allowedRoles).toContain(user.role);
      });
    });

    it('should generate first_name and last_name as non-empty strings', () => {
      fakeUsers.records.forEach((user) => {
        expect(user.first_name.length).toBeGreaterThan(0);
        expect(user.last_name.length).toBeGreaterThan(0);
      });
    });
  });

  describe('fakeUsers.getAll()', () => {
    it('should return all records when no filters provided', async () => {
      const result = await fakeUsers.getAll({});

      expect(result).toHaveLength(50);
    });

    it('should filter by role when roles array provided', async () => {
      const developerUsers = fakeUsers.records.filter((u) => u.role === 'Developer');

      if (developerUsers.length > 0) {
        const result = await fakeUsers.getAll({ roles: ['Developer'] });

        expect(result.length).toBe(developerUsers.length);
        result.forEach((user) => {
          expect(user.role).toBe('Developer');
        });
      }
    });

    it('should return all users when roles is empty array', async () => {
      const result = await fakeUsers.getAll({ roles: [] });

      expect(result).toHaveLength(50);
    });

    it('should filter by multiple roles', async () => {
      const developerAndDesigner = fakeUsers.records.filter(
        (u) => u.role === 'Developer' || u.role === 'Designer'
      );

      const result = await fakeUsers.getAll({
        roles: ['Developer', 'Designer']
      });

      expect(result.length).toBe(developerAndDesigner.length);
    });

    it('should search across first_name, last_name, and email', async () => {
      // Use the first user's first_name to search
      const firstUser = fakeUsers.records[0];
      const searchTerm = firstUser.first_name.split(' ')[0]; // Use first word

      const result = await fakeUsers.getAll({ search: searchTerm });

      // matchSorter should find users matching the term
      expect(result.length).toBeGreaterThan(0);
    });

    it('should search by last_name', async () => {
      const firstUser = fakeUsers.records[0];
      const searchTerm = firstUser.last_name;

      const result = await fakeUsers.getAll({ search: searchTerm });

      expect(result.length).toBeGreaterThan(0);
    });

    it('should search by email', async () => {
      const firstUser = fakeUsers.records[0];
      const searchTerm = firstUser.email.split('@')[0]; // Local part of email

      const result = await fakeUsers.getAll({ search: searchTerm });

      expect(result.length).toBeGreaterThan(0);
    });

    it('should return empty array for non-matching search', async () => {
      const result = await fakeUsers.getAll({ search: 'xyznonexistent123' });

      expect(result).toHaveLength(0);
    });

    it('should combine role filter with search', async () => {
      const developerUsers = fakeUsers.records.filter((u) => u.role === 'Developer');

      if (developerUsers.length > 0) {
        const searchTerm = developerUsers[0].first_name;

        const result = await fakeUsers.getAll({
          roles: ['Developer'],
          search: searchTerm
        });

        result.forEach((user) => {
          expect(user.role).toBe('Developer');
        });
      }
    });
  });

  describe('fakeUsers.getUsers()', () => {
    it('should return paginated response with metadata', async () => {
      vi.useFakeTimers();

      const promise = fakeUsers.getUsers({ page: 1, limit: 10 });
      vi.advanceTimersByTime(900); // delay(800) + buffer
      const result = await promise;

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('total_users');
      expect(result).toHaveProperty('offset', 0);
      expect(result).toHaveProperty('limit', 10);
      expect(result).toHaveProperty('users');
      expect(result).toHaveProperty('time');
      expect(result).toHaveProperty('message');
    });

    it('should return correct offset and limit for page 1', async () => {
      vi.useFakeTimers();

      const promise = fakeUsers.getUsers({ page: 1, limit: 10 });
      vi.advanceTimersByTime(900);
      const result = await promise;

      expect(result.offset).toBe(0);
      expect(result.limit).toBe(10);
      expect(result.users.length).toBe(10);
    });

    it('should return correct offset for page 2 with limit 5', async () => {
      vi.useFakeTimers();

      const promise = fakeUsers.getUsers({ page: 2, limit: 5 });
      vi.advanceTimersByTime(900);
      const result = await promise;

      expect(result.offset).toBe(5); // (2-1) * 5
      expect(result.limit).toBe(5);
      expect(result.users.length).toBe(5);
    });

    it('should return correct offset for page 3 with limit 15', async () => {
      vi.useFakeTimers();

      const promise = fakeUsers.getUsers({ page: 3, limit: 15 });
      vi.advanceTimersByTime(900);
      const result = await promise;

      expect(result.offset).toBe(30); // (3-1) * 15
      expect(result.limit).toBe(15);
      expect(result.users.length).toBe(15);
    });

    it('should handle string roles (comma-separated)', async () => {
      vi.useFakeTimers();

      const promise = fakeUsers.getUsers({
        page: 1,
        limit: 10,
        roles: 'Developer,Manager'
      });
      vi.advanceTimersByTime(900);
      const result = await promise;

      expect(result.total_users).toBeDefined();
      result.users.forEach((user) => {
        expect(['Developer', 'Manager']).toContain(user.role);
      });
    });

    it('should handle string roles (dot-separated)', async () => {
      vi.useFakeTimers();

      const promise = fakeUsers.getUsers({
        page: 1,
        limit: 10,
        roles: 'Developer.Manager'
      });
      vi.advanceTimersByTime(900);
      const result = await promise;

      expect(result.total_users).toBeDefined();
      result.users.forEach((user) => {
        expect(['Developer', 'Manager']).toContain(user.role);
      });
    });

    it('should parse valid sort JSON and sort alphabetically for string fields', async () => {
      vi.useFakeTimers();

      // Sort by first_name ascending
      const promise = fakeUsers.getUsers({
        page: 1,
        limit: 50,
        sort: JSON.stringify([{ id: 'first_name', desc: false }])
      });
      vi.advanceTimersByTime(900);
      const result = await promise;

      const firstNames = result.users.map((u) => u.first_name.toLowerCase());
      const sortedFirstNames = [...firstNames].sort();
      expect(firstNames).toEqual(sortedFirstNames);
    });

    it('should parse valid sort JSON and sort numerically for number fields', async () => {
      vi.useFakeTimers();

      // Sort by id descending
      const promise = fakeUsers.getUsers({
        page: 1,
        limit: 50,
        sort: JSON.stringify([{ id: 'id', desc: true }])
      });
      vi.advanceTimersByTime(900);
      const result = await promise;

      const ids = result.users.map((u) => u.id);
      expect(ids[0]).toBeGreaterThan(ids[ids.length - 1]);
    });

    it('should sort descending when desc is true', async () => {
      vi.useFakeTimers();

      // Sort by id descending
      const promise = fakeUsers.getUsers({
        page: 1,
        limit: 50,
        sort: JSON.stringify([{ id: 'id', desc: true }])
      });
      vi.advanceTimersByTime(900);
      const result = await promise;

      const ids = result.users.map((u) => u.id);
      for (let i = 0; i < ids.length - 1; i++) {
        expect(ids[i]).toBeGreaterThanOrEqual(ids[i + 1]);
      }
    });

    it('should sort ascending when desc is false', async () => {
      vi.useFakeTimers();

      // Sort by id ascending
      const promise = fakeUsers.getUsers({
        page: 1,
        limit: 50,
        sort: JSON.stringify([{ id: 'id', desc: false }])
      });
      vi.advanceTimersByTime(900);
      const result = await promise;

      const ids = result.users.map((u) => u.id);
      for (let i = 0; i < ids.length - 1; i++) {
        expect(ids[i]).toBeLessThanOrEqual(ids[i + 1]);
      }
    });

    it('should sort by computed full name when id is "name"', async () => {
      vi.useFakeTimers();

      const promise = fakeUsers.getUsers({
        page: 1,
        limit: 50,
        sort: JSON.stringify([{ id: 'name', desc: false }])
      });
      vi.advanceTimersByTime(900);
      const result = await promise;

      const fullNames = result.users.map((u) => `${u.first_name} ${u.last_name}`.toLowerCase());
      const sortedFullNames = [...fullNames].sort();
      expect(fullNames).toEqual(sortedFullNames);
    });

    it('should sort by computed full name descending', async () => {
      vi.useFakeTimers();

      const promise = fakeUsers.getUsers({
        page: 1,
        limit: 50,
        sort: JSON.stringify([{ id: 'name', desc: true }])
      });
      vi.advanceTimersByTime(900);
      const result = await promise;

      const fullNames = result.users.map((u) => `${u.first_name} ${u.last_name}`.toLowerCase());
      for (let i = 0; i < fullNames.length - 1; i++) {
        expect(fullNames[i].localeCompare(fullNames[i + 1])).toBeGreaterThanOrEqual(0);
      }
    });

    it('should ignore invalid sort JSON without throwing', async () => {
      vi.useFakeTimers();

      const promise = fakeUsers.getUsers({
        page: 1,
        limit: 10,
        sort: 'not-valid-json'
      });
      vi.advanceTimersByTime(900);
      const result = await promise;

      expect(result).toHaveProperty('success', true);
      expect(result.users).toBeDefined();
    });

    it('should ignore empty sort array', async () => {
      vi.useFakeTimers();

      const promise = fakeUsers.getUsers({
        page: 1,
        limit: 10,
        sort: JSON.stringify([])
      });
      vi.advanceTimersByTime(900);
      const result = await promise;

      expect(result.users.length).toBe(10);
    });

    it('should ignore sort with missing id field', async () => {
      vi.useFakeTimers();

      const promise = fakeUsers.getUsers({
        page: 1,
        limit: 10,
        sort: JSON.stringify([{ desc: true }])
      });
      vi.advanceTimersByTime(900);
      const result = await promise;

      // Should not crash, returns default order
      expect(result).toHaveProperty('success', true);
    });

    it('should ignore sort with missing desc field', async () => {
      vi.useFakeTimers();

      const promise = fakeUsers.getUsers({
        page: 1,
        limit: 10,
        sort: JSON.stringify([{ id: 'first_name' }])
      });
      vi.advanceTimersByTime(900);
      const result = await promise;

      expect(result).toHaveProperty('success', true);
    });
  });

  describe('fakeUsers.createUser()', () => {
    it('should add new user to records', async () => {
      vi.useFakeTimers();

      const initialCount = fakeUsers.records.length;
      const newUser = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
        status: 'Active',
        role: 'Developer'
      };

      const promise = fakeUsers.createUser(newUser);
      vi.advanceTimersByTime(900);
      await promise;

      expect(fakeUsers.records.length).toBe(initialCount + 1);
    });

    it('should generate new id for created user', async () => {
      vi.useFakeTimers();

      const newUser = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
        status: 'Active',
        role: 'Developer'
      };

      const promise = fakeUsers.createUser(newUser);
      vi.advanceTimersByTime(900);
      const result = await promise;

      expect(result.user.id).toBeGreaterThan(0);
    });

    it('should set created_at and updated_at timestamps', async () => {
      vi.useFakeTimers();

      const newUser = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
        status: 'Active',
        role: 'Developer'
      };

      const promise = fakeUsers.createUser(newUser);
      vi.advanceTimersByTime(900);
      const result = await promise;

      expect(result.user.created_at).toBeDefined();
      expect(result.user.updated_at).toBeDefined();
    });

    it('should return success response with created user', async () => {
      vi.useFakeTimers();

      const newUser = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
        status: 'Active',
        role: 'Developer'
      };

      const promise = fakeUsers.createUser(newUser);
      vi.advanceTimersByTime(900);
      const result = await promise;

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message', 'User created successfully');
      expect(result.user).toMatchObject(newUser);
    });

    it('should merge all fields in created user', async () => {
      vi.useFakeTimers();

      const newUser = {
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        phone: '9876543210',
        status: 'Inactive',
        role: 'Designer'
      };

      const promise = fakeUsers.createUser(newUser);
      vi.advanceTimersByTime(900);
      const result = await promise;

      expect(result.user.first_name).toBe('Jane');
      expect(result.user.last_name).toBe('Smith');
      expect(result.user.email).toBe('jane.smith@example.com');
      expect(result.user.phone).toBe('9876543210');
      expect(result.user.status).toBe('Inactive');
      expect(result.user.role).toBe('Designer');
      expect(result.user.id).toBeDefined();
      expect(result.user.created_at).toBeDefined();
      expect(result.user.updated_at).toBeDefined();
    });

    it('should assign correct id based on current records length', async () => {
      vi.useFakeTimers();

      const newUser = {
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        phone: '1234567890',
        status: 'Active',
        role: 'Developer'
      };

      const initialCount = fakeUsers.records.length;

      const promise = fakeUsers.createUser(newUser);
      vi.advanceTimersByTime(900);
      const result = await promise;

      expect(result.user.id).toBe(initialCount + 1);
    });
  });

  describe('fakeUsers.updateUser()', () => {
    it('should merge updated data into existing user', async () => {
      vi.useFakeTimers();

      const user = fakeUsers.records[0];
      const originalEmail = user.email;

      const promise = fakeUsers.updateUser(user.id, {
        email: 'updated@example.com'
      });
      vi.advanceTimersByTime(900);
      const result = await promise;

      expect(result.user.email).toBe('updated@example.com');
      expect(result.user.first_name).toBe(user.first_name); // unchanged
    });

    it('should update the updated_at timestamp', async () => {
      vi.useFakeTimers();

      const user = fakeUsers.records[0];
      const originalUpdatedAt = user.updated_at;

      // Advance time to ensure different timestamp
      vi.advanceTimersByTime(1000);

      const promise = fakeUsers.updateUser(user.id, {
        first_name: 'UpdatedName'
      });
      vi.advanceTimersByTime(900);
      const result = await promise;

      expect(result.user.updated_at).not.toBe(originalUpdatedAt);
    });

    it('should return success response with updated user', async () => {
      vi.useFakeTimers();

      const user = fakeUsers.records[0];

      const promise = fakeUsers.updateUser(user.id, {
        first_name: 'UpdatedName'
      });
      vi.advanceTimersByTime(900);
      const result = await promise;

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message', 'User updated successfully');
      expect(result.user.first_name).toBe('UpdatedName');
    });

    it('should return failure when user id not found', async () => {
      vi.useFakeTimers();

      const promise = fakeUsers.updateUser(99999, {
        first_name: 'UpdatedName'
      });
      vi.advanceTimersByTime(900);
      const result = await promise;

      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('message', 'User with ID 99999 not found');
    });

    it('should not modify records when user not found', async () => {
      vi.useFakeTimers();

      const initialRecords = [...fakeUsers.records];

      const promise = fakeUsers.updateUser(99999, { first_name: 'UpdatedName' });
      vi.advanceTimersByTime(900);
      await promise;

      expect(fakeUsers.records).toEqual(initialRecords);
    });

    it('should update multiple fields at once', async () => {
      vi.useFakeTimers();

      const user = fakeUsers.records[0];

      const promise = fakeUsers.updateUser(user.id, {
        first_name: 'NewFirst',
        last_name: 'NewLast',
        role: 'Manager'
      });
      vi.advanceTimersByTime(900);
      const result = await promise;

      expect(result.user.first_name).toBe('NewFirst');
      expect(result.user.last_name).toBe('NewLast');
      expect(result.user.role).toBe('Manager');
    });
  });

  describe('fakeUsers.deleteUser()', () => {
    it('should remove user from records', async () => {
      vi.useFakeTimers();

      const userToDelete = fakeUsers.records[0];
      const initialCount = fakeUsers.records.length;

      const promise = fakeUsers.deleteUser(userToDelete.id);
      vi.advanceTimersByTime(900);
      await promise;

      expect(fakeUsers.records.length).toBe(initialCount - 1);
      expect(fakeUsers.records.find((u) => u.id === userToDelete.id)).toBeUndefined();
    });

    it('should return success response', async () => {
      vi.useFakeTimers();

      const userToDelete = fakeUsers.records[0];

      const promise = fakeUsers.deleteUser(userToDelete.id);
      vi.advanceTimersByTime(900);
      const result = await promise;

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message', 'User deleted successfully');
    });

    it('should return failure when user not found', async () => {
      vi.useFakeTimers();

      const promise = fakeUsers.deleteUser(99999);
      vi.advanceTimersByTime(900);
      const result = await promise;

      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('message', 'User with ID 99999 not found');
    });

    it('should not modify records when user not found', async () => {
      vi.useFakeTimers();

      const initialRecords = [...fakeUsers.records];

      const promise = fakeUsers.deleteUser(99999);
      vi.advanceTimersByTime(900);
      await promise;

      expect(fakeUsers.records).toEqual(initialRecords);
    });

    it('should only delete the specified user', async () => {
      vi.useFakeTimers();

      const userToKeep = fakeUsers.records[1];
      const userToDelete = fakeUsers.records[0];

      const promise = fakeUsers.deleteUser(userToDelete.id);
      vi.advanceTimersByTime(900);
      await promise;

      expect(fakeUsers.records.find((u) => u.id === userToDelete.id)).toBeUndefined();
      expect(fakeUsers.records.find((u) => u.id === userToKeep.id)).toBeDefined();
    });
  });

  describe('User type', () => {
    it('should have all required fields matching User type', () => {
      const user: User = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
        status: 'Active',
        role: 'Developer',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      };

      expect(user.id).toBe(1);
      expect(user.first_name).toBe('John');
      expect(user.last_name).toBe('Doe');
      expect(user.email).toBe('john.doe@example.com');
      expect(user.phone).toBe('1234567890');
      expect(user.status).toBe('Active');
      expect(user.role).toBe('Developer');
      expect(user.created_at).toBe('2024-01-01T00:00:00.000Z');
      expect(user.updated_at).toBe('2024-01-01T00:00:00.000Z');
    });
  });

  describe('state isolation between tests', () => {
    it('should start with 50 records in each test (due to beforeEach reset)', () => {
      expect(fakeUsers.records).toHaveLength(50);
    });

    it('should still have 50 records if previous test added then deleted', async () => {
      vi.useFakeTimers();

      const promise1 = fakeUsers.createUser({
        first_name: 'Temp',
        last_name: 'User',
        email: 'temp@example.com',
        phone: '1234567890',
        status: 'Active',
        role: 'Developer'
      });
      vi.advanceTimersByTime(900);
      const result1 = await promise1;

      const promise2 = fakeUsers.deleteUser(result1.user.id);
      vi.advanceTimersByTime(900);
      await promise2;

      expect(fakeUsers.records.length).toBe(50);
    });

    it('should isolate state across multiple sequential operations', async () => {
      vi.useFakeTimers();

      // Create 3 users
      for (let i = 0; i < 3; i++) {
        const promise = fakeUsers.createUser({
          first_name: `User${i}`,
          last_name: 'Test',
          email: `user${i}@test.com`,
          phone: '1234567890',
          status: 'Active',
          role: 'Developer'
        });
        vi.advanceTimersByTime(900);
        await promise;
      }

      expect(fakeUsers.records.length).toBe(53);

      // Delete 2 users
      const idsToDelete = [fakeUsers.records[0].id, fakeUsers.records[1].id];
      for (const id of idsToDelete) {
        const promise = fakeUsers.deleteUser(id);
        vi.advanceTimersByTime(900);
        await promise;
      }

      expect(fakeUsers.records.length).toBe(51);
    });
  });
});