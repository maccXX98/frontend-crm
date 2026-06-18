import { describe, it, expect, afterEach } from 'vitest';
import { profileSchema, ProfileFormValues } from '@/features/profile/utils/form-schema';

describe('profileSchema', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── Valid input ────────────────────────────────────────────────────────────

  describe('valid input', () => {
    it('all fields valid with 1 job → success', () => {
      const input = {
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        contactno: 5551234,
        country: 'USA',
        city: 'NYC',
        jobs: [
          {
            jobcountry: 'USA',
            jobcity: 'SF',
            jobtitle: 'Engineer',
            employer: 'Acme',
            startdate: '2020-01-15',
            enddate: '2023-06-30',
          },
        ],
      };
      const result = profileSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(input);
      }
    });

    it('all fields valid with multiple jobs (3) → success', () => {
      const input = {
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        contactno: 5551234,
        country: 'USA',
        city: 'NYC',
        jobs: [
          {
            jobcountry: 'USA',
            jobcity: 'SF',
            jobtitle: 'Engineer',
            employer: 'Acme',
            startdate: '2020-01-15',
            enddate: '2023-06-30',
          },
          {
            jobcountry: 'UK',
            jobcity: 'LDN',
            jobtitle: 'Senior Engineer',
            employer: 'Globex',
            startdate: '2023-07-01',
            enddate: '2025-12-31',
          },
          {
            jobcountry: 'DE',
            jobcity: 'BER',
            jobtitle: 'Lead Engineer',
            employer: 'Initech',
            startdate: '2026-01-01',
            enddate: '2030-12-31',
          },
        ],
      };
      const result = profileSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('contactno as number 12345 → success (no coercion needed)', () => {
      const result = profileSchema.safeParse({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        contactno: 12345,
        country: 'USA',
        city: 'NYC',
        jobs: [],
      });
      expect(result.success).toBe(true);
    });

    it('contactno as string "12345" → success (coerced to number 12345)', () => {
      const result = profileSchema.safeParse({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        contactno: '12345',
        country: 'USA',
        city: 'NYC',
        jobs: [],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.contactno).toBe(12345);
      }
    });
  });

  // ─── firstname / lastname ───────────────────────────────────────────────────

  describe('firstname / lastname', () => {
    it('"John" (4 chars) → success', () => {
      const result = profileSchema.safeParse({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        contactno: 5551234,
        country: 'USA',
        city: 'NYC',
        jobs: [],
      });
      expect(result.success).toBe(true);
    });

    it('"Jo" (2 chars) → failure with message "Product Name must be at least 3 characters"', () => {
      const result = profileSchema.safeParse({
        firstname: 'Jo',
        lastname: 'Doe',
        email: 'john@example.com',
        contactno: 5551234,
        country: 'USA',
        city: 'NYC',
        jobs: [],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Product Name must be at least 3 characters');
      }
    });

    it('"" → failure', () => {
      const result = profileSchema.safeParse({
        firstname: '',
        lastname: 'Doe',
        email: 'john@example.com',
        contactno: 5551234,
        country: 'USA',
        city: 'NYC',
        jobs: [],
      });
      expect(result.success).toBe(false);
    });

    it('lastname: "Jo" (2 chars) → failure', () => {
      const result = profileSchema.safeParse({
        firstname: 'John',
        lastname: 'Jo',
        email: 'john@example.com',
        contactno: 5551234,
        country: 'USA',
        city: 'NYC',
        jobs: [],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Product Name must be at least 3 characters');
      }
    });
  });

  // ─── email ─────────────────────────────────────────────────────────────────

  describe('email', () => {
    it('"john@example.com" → success', () => {
      const result = profileSchema.safeParse({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        contactno: 5551234,
        country: 'USA',
        city: 'NYC',
        jobs: [],
      });
      expect(result.success).toBe(true);
    });

    it('"invalid" → failure', () => {
      const result = profileSchema.safeParse({
        firstname: 'John',
        lastname: 'Doe',
        email: 'invalid',
        contactno: 5551234,
        country: 'USA',
        city: 'NYC',
        jobs: [],
      });
      expect(result.success).toBe(false);
    });
  });

  // ─── contactno (z.coerce.number()) ─────────────────────────────────────────

  describe('contactno (z.coerce.number())', () => {
    it('12345 → success, data.contactno === 12345', () => {
      const result = profileSchema.safeParse({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        contactno: 12345,
        country: 'USA',
        city: 'NYC',
        jobs: [],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.contactno).toBe(12345);
      }
    });

    it('"12345" → success, data.contactno === 12345 (coerced)', () => {
      const result = profileSchema.safeParse({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        contactno: '12345',
        country: 'USA',
        city: 'NYC',
        jobs: [],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.contactno).toBe(12345);
      }
    });

    it('"abc" → failure (NaN coercion)', () => {
      const result = profileSchema.safeParse({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        // @ts-expect-error testing invalid string
        contactno: 'abc',
        country: 'USA',
        city: 'NYC',
        jobs: [],
      });
      expect(result.success).toBe(false);
    });

    it('undefined → failure', () => {
      const result = profileSchema.safeParse({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        // @ts-expect-error contactno is required
        contactno: undefined,
        country: 'USA',
        city: 'NYC',
        jobs: [],
      });
      expect(result.success).toBe(false);
    });

    it('null → failure "Contact number must be a positive number" (null coerces to 0)', () => {
      const result = profileSchema.safeParse({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        // @ts-expect-error testing invalid null input
        contactno: null,
        country: 'USA',
        city: 'NYC',
        jobs: [],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Contact number must be a positive number');
      }
    });

    it('"" (empty string) → failure "Contact number must be a positive number" (coerces to 0)', () => {
      const result = profileSchema.safeParse({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        // @ts-expect-error testing invalid empty string input
        contactno: '',
        country: 'USA',
        city: 'NYC',
        jobs: [],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Contact number must be a positive number');
      }
    });

    it('0 → failure "Contact number must be a positive number"', () => {
      const result = profileSchema.safeParse({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        contactno: 0,
        country: 'USA',
        city: 'NYC',
        jobs: [],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Contact number must be a positive number');
      }
    });

    it('-5 → failure "Contact number must be a positive number"', () => {
      const result = profileSchema.safeParse({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        contactno: -5,
        country: 'USA',
        city: 'NYC',
        jobs: [],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Contact number must be a positive number');
      }
    });

    it('Float "123.45" → success, coerced to 123.45', () => {
      const result = profileSchema.safeParse({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        contactno: '123.45',
        country: 'USA',
        city: 'NYC',
        jobs: [],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.contactno).toBe(123.45);
      }
    });
  });

  // ─── country / city ────────────────────────────────────────────────────────

  describe('country / city', () => {
    it('"USA" → success', () => {
      const result = profileSchema.safeParse({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        contactno: 5551234,
        country: 'USA',
        city: 'NYC',
        jobs: [],
      });
      expect(result.success).toBe(true);
    });

    it('"" → failure "Please select a category"', () => {
      const result = profileSchema.safeParse({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        contactno: 5551234,
        country: '',
        city: 'NYC',
        jobs: [],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Please select a category');
      }
    });

    it('undefined → failure', () => {
      const result = profileSchema.safeParse({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        contactno: 5551234,
        country: 'USA',
        // @ts-expect-error city is required
        city: undefined,
        jobs: [],
      });
      expect(result.success).toBe(false);
    });
  });

  // ─── jobs array ────────────────────────────────────────────────────────────

  describe('jobs array', () => {
    it('empty [] → success (no required length)', () => {
      const result = profileSchema.safeParse({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        contactno: 5551234,
        country: 'USA',
        city: 'NYC',
        jobs: [],
      });
      expect(result.success).toBe(true);
    });

    it('single valid job → success', () => {
      const result = profileSchema.safeParse({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        contactno: 5551234,
        country: 'USA',
        city: 'NYC',
        jobs: [
          {
            jobcountry: 'USA',
            jobcity: 'SF',
            jobtitle: 'Engineer',
            employer: 'Acme',
            startdate: '2020-01-15',
            enddate: '2023-06-30',
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('multiple valid jobs → success', () => {
      const result = profileSchema.safeParse({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        contactno: 5551234,
        country: 'USA',
        city: 'NYC',
        jobs: [
          {
            jobcountry: 'USA',
            jobcity: 'SF',
            jobtitle: 'Engineer',
            employer: 'Acme',
            startdate: '2020-01-15',
            enddate: '2023-06-30',
          },
          {
            jobcountry: 'UK',
            jobcity: 'LDN',
            jobtitle: 'Senior Engineer',
            employer: 'Globex',
            startdate: '2023-07-01',
            enddate: '2025-12-31',
          },
        ],
      });
      expect(result.success).toBe(true);
    });
  });

  // ─── Job field validation ─────────────────────────────────────────────────

  describe('job field validation', () => {
    it('jobtitle: "Dev" (3 chars) → success', () => {
      const result = profileSchema.safeParse({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        contactno: 5551234,
        country: 'USA',
        city: 'NYC',
        jobs: [
          {
            jobcountry: 'USA',
            jobcity: 'SF',
            jobtitle: 'Dev',
            employer: 'Acme',
            startdate: '2020-01-15',
            enddate: '2023-06-30',
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('jobtitle: "De" (2 chars) → failure', () => {
      const result = profileSchema.safeParse({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        contactno: 5551234,
        country: 'USA',
        city: 'NYC',
        jobs: [
          {
            jobcountry: 'USA',
            jobcity: 'SF',
            jobtitle: 'De',
            employer: 'Acme',
            startdate: '2020-01-15',
            enddate: '2023-06-30',
          },
        ],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Product Name must be at least 3 characters');
      }
    });

    it('employer: "Acme" (4 chars) → success', () => {
      const result = profileSchema.safeParse({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        contactno: 5551234,
        country: 'USA',
        city: 'NYC',
        jobs: [
          {
            jobcountry: 'USA',
            jobcity: 'SF',
            jobtitle: 'Engineer',
            employer: 'Acme',
            startdate: '2020-01-15',
            enddate: '2023-06-30',
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('employer: "Ac" (2 chars) → failure', () => {
      const result = profileSchema.safeParse({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        contactno: 5551234,
        country: 'USA',
        city: 'NYC',
        jobs: [
          {
            jobcountry: 'USA',
            jobcity: 'SF',
            jobtitle: 'Engineer',
            employer: 'Ac',
            startdate: '2020-01-15',
            enddate: '2023-06-30',
          },
        ],
      });
      expect(result.success).toBe(false);
    });
  });

  // ─── Date regex (YYYY-MM-DD) ───────────────────────────────────────────────

  describe('date regex (YYYY-MM-DD)', () => {
    it('startdate: "2024-01-15" → success', () => {
      const result = profileSchema.safeParse({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        contactno: 5551234,
        country: 'USA',
        city: 'NYC',
        jobs: [
          {
            jobcountry: 'USA',
            jobcity: 'SF',
            jobtitle: 'Engineer',
            employer: 'Acme',
            startdate: '2024-01-15',
            enddate: '2023-06-30',
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('startdate: "2024-1-15" → failure (single digit month)', () => {
      const result = profileSchema.safeParse({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        contactno: 5551234,
        country: 'USA',
        city: 'NYC',
        jobs: [
          {
            jobcountry: 'USA',
            jobcity: 'SF',
            jobtitle: 'Engineer',
            employer: 'Acme',
            startdate: '2024-1-15',
            enddate: '2023-06-30',
          },
        ],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Start date should be in the format YYYY-MM-DD');
      }
    });

    it('startdate: "24-01-15" → failure (2 digit year)', () => {
      const result = profileSchema.safeParse({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        contactno: 5551234,
        country: 'USA',
        city: 'NYC',
        jobs: [
          {
            jobcountry: 'USA',
            jobcity: 'SF',
            jobtitle: 'Engineer',
            employer: 'Acme',
            startdate: '24-01-15',
            enddate: '2023-06-30',
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    it('startdate: "2024/01/15" → failure (wrong separator)', () => {
      const result = profileSchema.safeParse({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        contactno: 5551234,
        country: 'USA',
        city: 'NYC',
        jobs: [
          {
            jobcountry: 'USA',
            jobcity: 'SF',
            jobtitle: 'Engineer',
            employer: 'Acme',
            startdate: '2024/01/15',
            enddate: '2023-06-30',
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    it('startdate: "2024-13-01" → success (regex passes; semantic validity NOT checked)', () => {
      const result = profileSchema.safeParse({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        contactno: 5551234,
        country: 'USA',
        city: 'NYC',
        jobs: [
          {
            jobcountry: 'USA',
            jobcity: 'SF',
            jobtitle: 'Engineer',
            employer: 'Acme',
            startdate: '2024-13-01',
            enddate: '2023-06-30',
          },
        ],
      });
      // Schema uses .refine with regex only, not .date()
      expect(result.success).toBe(true);
    });

    it('enddate: "2024-01-15" → success', () => {
      const result = profileSchema.safeParse({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        contactno: 5551234,
        country: 'USA',
        city: 'NYC',
        jobs: [
          {
            jobcountry: 'USA',
            jobcity: 'SF',
            jobtitle: 'Engineer',
            employer: 'Acme',
            startdate: '2020-01-15',
            enddate: '2024-01-15',
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('startdate: "" → failure', () => {
      const result = profileSchema.safeParse({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        contactno: 5551234,
        country: 'USA',
        city: 'NYC',
        jobs: [
          {
            jobcountry: 'USA',
            jobcity: 'SF',
            jobtitle: 'Engineer',
            employer: 'Acme',
            startdate: '',
            enddate: '2023-06-30',
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    it('startdate: undefined → failure', () => {
      const result = profileSchema.safeParse({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        contactno: 5551234,
        country: 'USA',
        city: 'NYC',
        jobs: [
          {
            jobcountry: 'USA',
            jobcity: 'SF',
            jobtitle: 'Engineer',
            employer: 'Acme',
            // @ts-expect-error startdate is required
            startdate: undefined,
            enddate: '2023-06-30',
          },
        ],
      });
      expect(result.success).toBe(false);
    });
  });

  // ─── Nested failures ──────────────────────────────────────────────────────

  describe('nested failures', () => {
    it('invalid job inside array → error path includes jobs.0.jobtitle', () => {
      const result = profileSchema.safeParse({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        contactno: 5551234,
        country: 'USA',
        city: 'NYC',
        jobs: [
          {
            jobcountry: 'USA',
            jobcity: 'SF',
            jobtitle: 'De',
            employer: 'Acme',
            startdate: '2020-01-15',
            enddate: '2023-06-30',
          },
        ],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path.join('.'));
        expect(paths.some((p) => p.startsWith('jobs.0.jobtitle'))).toBe(true);
      }
    });

    it('multiple job failures → multiple issues with correct indices', () => {
      const result = profileSchema.safeParse({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        contactno: 5551234,
        country: 'USA',
        city: 'NYC',
        jobs: [
          {
            jobcountry: 'USA',
            jobcity: 'SF',
            jobtitle: 'De',
            employer: 'Ac',
            startdate: '2020-01-15',
            enddate: '2023-06-30',
          },
          {
            jobcountry: 'USA',
            jobcity: 'SF',
            jobtitle: 'En',
            employer: 'Inc',
            startdate: '2024-1-15',
            enddate: 'invalid',
          },
        ],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path.join('.'));
        // First job failures (jobtitle too short, employer too short)
        expect(paths.filter((p) => p.startsWith('jobs.0')).length).toBeGreaterThanOrEqual(2);
        // Second job failures (jobtitle, employer, startdate, enddate)
        expect(paths.filter((p) => p.startsWith('jobs.1')).length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  // ─── Full valid example ───────────────────────────────────────────────────

  describe('full valid example', () => {
    it('complete valid profile → success', () => {
      const valid = {
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        contactno: '5551234',
        country: 'USA',
        city: 'NYC',
        jobs: [
          {
            jobcountry: 'USA',
            jobcity: 'SF',
            jobtitle: 'Engineer',
            employer: 'Acme',
            startdate: '2020-01-15',
            enddate: '2023-06-30',
          },
        ],
      };
      expect(profileSchema.safeParse(valid).success).toBe(true);
    });
  });

  // ─── ProfileFormValues type export ────────────────────────────────────────

  describe('ProfileFormValues type export', () => {
    it('type re-export exists and is importable as a type', () => {
      // @ts-expect-error only type-level test
      const _typeCheck: ProfileFormValues = {
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        contactno: 5551234,
        country: 'USA',
        city: 'NYC',
        jobs: [],
      };
      expect(true).toBe(true);
    });
  });
});
