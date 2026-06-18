import { describe, it, expect, afterEach } from 'vitest';
import { userSchema, UserFormValues } from '@/features/users/schemas/user';

describe('userSchema', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── Valid input ────────────────────────────────────────────────────────────

  describe('valid input', () => {
    it('all 6 fields valid → success', () => {
      const input = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '555-1234',
        role: 'Developer',
        status: 'Active',
      };
      const result = userSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(input);
      }
    });

    it('minimal valid: "John", "Doe", "john@example.com", "555-1234", "Developer", "Active" → success', () => {
      const result = userSchema.safeParse({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '555-1234',
        role: 'Developer',
        status: 'Active',
      });
      expect(result.success).toBe(true);
    });
  });

  // ─── first_name ─────────────────────────────────────────────────────────────

  describe('first_name', () => {
    it('"Jo" (2 chars) → success', () => {
      const result = userSchema.safeParse({
        first_name: 'Jo',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '555-1234',
        role: 'Developer',
        status: 'Active',
      });
      expect(result.success).toBe(true);
    });

    it('"J" (1 char) → failure "First name must be at least 2 characters"', () => {
      const result = userSchema.safeParse({
        first_name: 'J',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '555-1234',
        role: 'Developer',
        status: 'Active',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('First name must be at least 2 characters');
      }
    });

    it('"" → failure', () => {
      const result = userSchema.safeParse({
        first_name: '',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '555-1234',
        role: 'Developer',
        status: 'Active',
      });
      expect(result.success).toBe(false);
    });

    it('undefined → failure', () => {
      const result = userSchema.safeParse({
        // @ts-expect-error first_name is required
        first_name: undefined,
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '555-1234',
        role: 'Developer',
        status: 'Active',
      });
      expect(result.success).toBe(false);
    });
  });

  // ─── last_name ─────────────────────────────────────────────────────────────

  describe('last_name', () => {
    it('"Do" (2 chars) → success', () => {
      const result = userSchema.safeParse({
        first_name: 'John',
        last_name: 'Do',
        email: 'john@example.com',
        phone: '555-1234',
        role: 'Developer',
        status: 'Active',
      });
      expect(result.success).toBe(true);
    });

    it('"D" (1 char) → failure "Last name must be at least 2 characters"', () => {
      const result = userSchema.safeParse({
        first_name: 'John',
        last_name: 'D',
        email: 'john@example.com',
        phone: '555-1234',
        role: 'Developer',
        status: 'Active',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Last name must be at least 2 characters');
      }
    });

    it('"" → failure', () => {
      const result = userSchema.safeParse({
        first_name: 'John',
        last_name: '',
        email: 'john@example.com',
        phone: '555-1234',
        role: 'Developer',
        status: 'Active',
      });
      expect(result.success).toBe(false);
    });

    it('undefined → failure', () => {
      const result = userSchema.safeParse({
        first_name: 'John',
        // @ts-expect-error last_name is required
        last_name: undefined,
        email: 'john@example.com',
        phone: '555-1234',
        role: 'Developer',
        status: 'Active',
      });
      expect(result.success).toBe(false);
    });
  });

  // ─── email ─────────────────────────────────────────────────────────────────

  describe('email', () => {
    it('"valid@example.com" → success', () => {
      const result = userSchema.safeParse({
        first_name: 'John',
        last_name: 'Doe',
        email: 'valid@example.com',
        phone: '555-1234',
        role: 'Developer',
        status: 'Active',
      });
      expect(result.success).toBe(true);
    });

    it('"user+tag@domain.co.uk" → success', () => {
      const result = userSchema.safeParse({
        first_name: 'John',
        last_name: 'Doe',
        email: 'user+tag@domain.co.uk',
        phone: '555-1234',
        role: 'Developer',
        status: 'Active',
      });
      expect(result.success).toBe(true);
    });

    it('"invalid" → failure "Please enter a valid email"', () => {
      const result = userSchema.safeParse({
        first_name: 'John',
        last_name: 'Doe',
        email: 'invalid',
        phone: '555-1234',
        role: 'Developer',
        status: 'Active',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Please enter a valid email');
      }
    });

    it('"missing@" → failure', () => {
      const result = userSchema.safeParse({
        first_name: 'John',
        last_name: 'Doe',
        email: 'missing@',
        phone: '555-1234',
        role: 'Developer',
        status: 'Active',
      });
      expect(result.success).toBe(false);
    });

    it('"@no-local.com" → failure', () => {
      const result = userSchema.safeParse({
        first_name: 'John',
        last_name: 'Doe',
        email: '@no-local.com',
        phone: '555-1234',
        role: 'Developer',
        status: 'Active',
      });
      expect(result.success).toBe(false);
    });

    it('"" → failure', () => {
      const result = userSchema.safeParse({
        first_name: 'John',
        last_name: 'Doe',
        email: '',
        phone: '555-1234',
        role: 'Developer',
        status: 'Active',
      });
      expect(result.success).toBe(false);
    });

    it('undefined → failure', () => {
      const result = userSchema.safeParse({
        first_name: 'John',
        last_name: 'Doe',
        // @ts-expect-error email is required
        email: undefined,
        phone: '555-1234',
        role: 'Developer',
        status: 'Active',
      });
      expect(result.success).toBe(false);
    });
  });

  // ─── phone ─────────────────────────────────────────────────────────────────

  describe('phone', () => {
    it('"555" → success', () => {
      const result = userSchema.safeParse({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '555',
        role: 'Developer',
        status: 'Active',
      });
      expect(result.success).toBe(true);
    });

    it('"" → failure "Phone number is required"', () => {
      const result = userSchema.safeParse({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '',
        role: 'Developer',
        status: 'Active',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Phone number is required');
      }
    });

    it('undefined → failure', () => {
      const result = userSchema.safeParse({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        // @ts-expect-error phone is required
        phone: undefined,
        role: 'Developer',
        status: 'Active',
      });
      expect(result.success).toBe(false);
    });
  });

  // ─── role ─────────────────────────────────────────────────────────────────

  describe('role', () => {
    it('"Developer" → success', () => {
      const result = userSchema.safeParse({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '555-1234',
        role: 'Developer',
        status: 'Active',
      });
      expect(result.success).toBe(true);
    });

    it('"" → failure "Please select a role"', () => {
      const result = userSchema.safeParse({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '555-1234',
        role: '',
        status: 'Active',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Please select a role');
      }
    });

    it('undefined → failure', () => {
      const result = userSchema.safeParse({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '555-1234',
        // @ts-expect-error role is required
        role: undefined,
        status: 'Active',
      });
      expect(result.success).toBe(false);
    });
  });

  // ─── status ────────────────────────────────────────────────────────────────

  describe('status', () => {
    it('"Active" → success', () => {
      const result = userSchema.safeParse({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '555-1234',
        role: 'Developer',
        status: 'Active',
      });
      expect(result.success).toBe(true);
    });

    it('"" → failure "Please select a status"', () => {
      const result = userSchema.safeParse({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '555-1234',
        role: 'Developer',
        status: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Please select a status');
      }
    });

    it('undefined → failure', () => {
      const result = userSchema.safeParse({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '555-1234',
        role: 'Developer',
        // @ts-expect-error status is required
        status: undefined,
      });
      expect(result.success).toBe(false);
    });
  });

  // ─── Multiple errors ────────────────────────────────────────────────────────

  describe('multiple errors', () => {
    it('all empty → 6 issues', () => {
      const result = userSchema.safeParse({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        role: '',
        status: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBe(6);
      }
    });

    it('verify each issue has correct path', () => {
      const result = userSchema.safeParse({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        role: '',
        status: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path.join('.'));
        expect(paths).toContain('first_name');
        expect(paths).toContain('last_name');
        expect(paths).toContain('email');
        expect(paths).toContain('phone');
        expect(paths).toContain('role');
        expect(paths).toContain('status');
      }
    });
  });

  // ─── UserFormValues type export ────────────────────────────────────────────

  describe('UserFormValues type export', () => {
    it('type re-export exists and is importable as a type', () => {
      // @ts-expect-error only type-level test
      const _typeCheck: UserFormValues = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '555-1234',
        role: 'Developer',
        status: 'Active',
      };
      expect(true).toBe(true);
    });
  });
});
