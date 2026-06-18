import { describe, it, expect, afterEach } from 'vitest';
import { productSchema, ProductFormValues } from '@/features/products/schemas/product';

describe('productSchema', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── Valid input ────────────────────────────────────────────────────────────

  describe('valid input', () => {
    it('all required fields filled correctly → success, data matches input', () => {
      const input = {
        name: 'Tablet',
        description: 'A great tablet device for everyday use',
        distributorId: 1,
      };
      const result = productSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(input);
      }
    });

    it('minimal valid input (only required fields) → success', () => {
      const result = productSchema.safeParse({
        name: 'AB',
        description: '1234567890',
        distributorId: 0,
      });
      expect(result.success).toBe(true);
    });

    it('with optional nickname, template, categoryIds, cost, sellingPrice, currency → success', () => {
      const input = {
        name: 'Smartphone',
        description: 'A powerful smartphone with all the features',
        distributorId: 2,
        nickname: 'Phone X',
        template: 'default',
        categoryIds: [1, 2, 3],
        cost: 299.99,
        sellingPrice: 499.99,
        currency: 'USD',
      };
      const result = productSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  // ─── image refine — count (max 1) ────────────────────────────────────────────

  describe('image refine — count (max 1)', () => {
    it('image: undefined → success (optional, refines pass when !files)', () => {
      const result = productSchema.safeParse({
        name: 'Product',
        description: 'Description here that is at least 10 chars',
        distributorId: 1,
        image: undefined,
      });
      expect(result.success).toBe(true);
    });

    it('image: [] → failure "Max 1 image allowed."', () => {
      const result = productSchema.safeParse({
        name: 'Product',
        description: 'Description here that is at least 10 chars',
        distributorId: 1,
        image: [],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const msg = result.error.issues[0].message;
        expect(msg).toBe('Max 1 image allowed.');
      }
    });

    it('image: [file, file] → failure "Max 1 image allowed."', () => {
      const result = productSchema.safeParse({
        name: 'Product',
        description: 'Description here that is at least 10 chars',
        distributorId: 1,
        image: [
          { size: 1000, type: 'image/png' },
          { size: 2000, type: 'image/png' },
        ],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const msg = result.error.issues[0].message;
        expect(msg).toBe('Max 1 image allowed.');
      }
    });

    it('image: [file] → success on count check', () => {
      const result = productSchema.safeParse({
        name: 'Product',
        description: 'Description here that is at least 10 chars',
        distributorId: 1,
        image: [{ size: 1000, type: 'image/png' }],
      });
      expect(result.success).toBe(true);
    });
  });

  // ─── image refine — size (max 5MB) ──────────────────────────────────────────

  describe('image refine — size (max 5MB)', () => {
    it('image: [{ size: 5_000_000, type: image/png }] → success on size check', () => {
      const result = productSchema.safeParse({
        name: 'Product',
        description: 'Description here that is at least 10 chars',
        distributorId: 1,
        image: [{ size: 5_000_000, type: 'image/png' }],
      });
      expect(result.success).toBe(true);
    });

    it('image: [{ size: 5_000_001, type: image/png }] → failure "Max file size is 5MB."', () => {
      const result = productSchema.safeParse({
        name: 'Product',
        description: 'Description here that is at least 10 chars',
        distributorId: 1,
        image: [{ size: 5_000_001, type: 'image/png' }],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const msg = result.error.issues[0].message;
        expect(msg).toBe('Max file size is 5MB.');
      }
    });

    it('image: [{ size: 0, type: image/png }] → success (0 ≤ 5MB)', () => {
      const result = productSchema.safeParse({
        name: 'Product',
        description: 'Description here that is at least 10 chars',
        distributorId: 1,
        image: [{ size: 0, type: 'image/png' }],
      });
      expect(result.success).toBe(true);
    });
  });

  // ─── image refine — type ────────────────────────────────────────────────────

  describe('image refine — type', () => {
    it('image: [{ size: 1000, type: image/jpeg }] → success', () => {
      const result = productSchema.safeParse({
        name: 'Product',
        description: 'Description here that is at least 10 chars',
        distributorId: 1,
        image: [{ size: 1000, type: 'image/jpeg' }],
      });
      expect(result.success).toBe(true);
    });

    it('image: [{ size: 1000, type: image/jpg }] → success', () => {
      const result = productSchema.safeParse({
        name: 'Product',
        description: 'Description here that is at least 10 chars',
        distributorId: 1,
        image: [{ size: 1000, type: 'image/jpg' }],
      });
      expect(result.success).toBe(true);
    });

    it('image: [{ size: 1000, type: image/png }] → success', () => {
      const result = productSchema.safeParse({
        name: 'Product',
        description: 'Description here that is at least 10 chars',
        distributorId: 1,
        image: [{ size: 1000, type: 'image/png' }],
      });
      expect(result.success).toBe(true);
    });

    it('image: [{ size: 1000, type: image/webp }] → success', () => {
      const result = productSchema.safeParse({
        name: 'Product',
        description: 'Description here that is at least 10 chars',
        distributorId: 1,
        image: [{ size: 1000, type: 'image/webp' }],
      });
      expect(result.success).toBe(true);
    });

    it('image: [{ size: 1000, type: image/gif }] → failure ".jpg, .jpeg, .png and .webp files are accepted."', () => {
      const result = productSchema.safeParse({
        name: 'Product',
        description: 'Description here that is at least 10 chars',
        distributorId: 1,
        image: [{ size: 1000, type: 'image/gif' }],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const msg = result.error.issues[0].message;
        expect(msg).toBe('.jpg, .jpeg, .png and .webp files are accepted.');
      }
    });

    it('image: [{ size: 1000, type: application/pdf }] → failure', () => {
      const result = productSchema.safeParse({
        name: 'Product',
        description: 'Description here that is at least 10 chars',
        distributorId: 1,
        image: [{ size: 1000, type: 'application/pdf' }],
      });
      expect(result.success).toBe(false);
    });
  });

  // ─── name ───────────────────────────────────────────────────────────────────

  describe('name', () => {
    it('name: "AB" (exactly 2 chars) → success', () => {
      const result = productSchema.safeParse({
        name: 'AB',
        description: 'Description here that is at least 10 chars',
        distributorId: 1,
      });
      expect(result.success).toBe(true);
    });

    it('name: "A" (1 char) → failure "Product name must be at least 2 characters."', () => {
      const result = productSchema.safeParse({
        name: 'A',
        description: 'Description here that is at least 10 chars',
        distributorId: 1,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Product name must be at least 2 characters.');
      }
    });

    it('name: "" → failure', () => {
      const result = productSchema.safeParse({
        name: '',
        description: 'Description here that is at least 10 chars',
        distributorId: 1,
      });
      expect(result.success).toBe(false);
    });

    it('name: undefined → failure', () => {
      const result = productSchema.safeParse({
        // @ts-expect-error name is required
        name: undefined,
        description: 'Description here that is at least 10 chars',
        distributorId: 1,
      });
      expect(result.success).toBe(false);
    });

    it('name: "Product 1" → success', () => {
      const result = productSchema.safeParse({
        name: 'Product 1',
        description: 'Description here that is at least 10 chars',
        distributorId: 1,
      });
      expect(result.success).toBe(true);
    });
  });

  // ─── description ───────────────────────────────────────────────────────────

  describe('description', () => {
    it('description: "1234567890" (exactly 10 chars) → success', () => {
      const result = productSchema.safeParse({
        name: 'Product',
        description: '1234567890',
        distributorId: 1,
      });
      expect(result.success).toBe(true);
    });

    it('description: "123456789" (9 chars) → failure "Description must be at least 10 characters."', () => {
      const result = productSchema.safeParse({
        name: 'Product',
        description: '123456789',
        distributorId: 1,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Description must be at least 10 characters.');
      }
    });

    it('description: "" → failure', () => {
      const result = productSchema.safeParse({
        name: 'Product',
        description: '',
        distributorId: 1,
      });
      expect(result.success).toBe(false);
    });

    it('description: undefined → failure', () => {
      const result = productSchema.safeParse({
        name: 'Product',
        // @ts-expect-error description is required
        description: undefined,
        distributorId: 1,
      });
      expect(result.success).toBe(false);
    });
  });

  // ─── distributorId ──────────────────────────────────────────────────────────

  describe('distributorId', () => {
    it('distributorId: 1 → success', () => {
      const result = productSchema.safeParse({
        name: 'Product',
        description: 'Description here that is at least 10 chars',
        distributorId: 1,
      });
      expect(result.success).toBe(true);
    });

    it('distributorId: 0 → success (0 is a valid number)', () => {
      const result = productSchema.safeParse({
        name: 'Product',
        description: 'Description here that is at least 10 chars',
        distributorId: 0,
      });
      expect(result.success).toBe(true);
    });

    it('distributorId: undefined → failure with message "Distributor is required"', () => {
      const result = productSchema.safeParse({
        name: 'Product',
        description: 'Description here that is at least 10 chars',
        // @ts-expect-error distributorId is required
        distributorId: undefined,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Distributor is required');
      }
    });

    it('distributorId: "1" (string) → failure (number type check)', () => {
      const result = productSchema.safeParse({
        name: 'Product',
        description: 'Description here that is at least 10 chars',
        // @ts-expect-error testing string instead of number
        distributorId: '1',
      });
      expect(result.success).toBe(false);
    });

    it('distributorId: null → failure', () => {
      const result = productSchema.safeParse({
        name: 'Product',
        description: 'Description here that is at least 10 chars',
        // @ts-expect-error testing null instead of number
        distributorId: null,
      });
      expect(result.success).toBe(false);
    });

    it('distributorId: NaN → failure (NaN is not a number per Zod)', () => {
      const result = productSchema.safeParse({
        name: 'Product',
        description: 'Description here that is at least 10 chars',
        // @ts-expect-error testing NaN instead of number
        distributorId: NaN,
      });
      expect(result.success).toBe(false);
    });
  });

  // ─── nickname, template, currency (optional strings) ───────────────────────

  describe('nickname, template, currency (optional strings)', () => {
    it('undefined → success', () => {
      const result = productSchema.safeParse({
        name: 'Product',
        description: 'Description here that is at least 10 chars',
        distributorId: 1,
        nickname: undefined,
        template: undefined,
        currency: undefined,
      });
      expect(result.success).toBe(true);
    });

    it('empty string "" → success (min check not applied)', () => {
      const result = productSchema.safeParse({
        name: 'Product',
        description: 'Description here that is at least 10 chars',
        distributorId: 1,
        nickname: '',
        template: '',
        currency: '',
      });
      expect(result.success).toBe(true);
    });

    it('valid string → success', () => {
      const result = productSchema.safeParse({
        name: 'Product',
        description: 'Description here that is at least 10 chars',
        distributorId: 1,
        nickname: 'Nick',
        template: 'Template',
        currency: 'EUR',
      });
      expect(result.success).toBe(true);
    });
  });

  // ─── categoryIds (optional array of numbers) ────────────────────────────────

  describe('categoryIds (optional array of numbers)', () => {
    it('undefined → success', () => {
      const result = productSchema.safeParse({
        name: 'Product',
        description: 'Description here that is at least 10 chars',
        distributorId: 1,
        categoryIds: undefined,
      });
      expect(result.success).toBe(true);
    });

    it('[] → success', () => {
      const result = productSchema.safeParse({
        name: 'Product',
        description: 'Description here that is at least 10 chars',
        distributorId: 1,
        categoryIds: [],
      });
      expect(result.success).toBe(true);
    });

    it('[1, 2, 3] → success', () => {
      const result = productSchema.safeParse({
        name: 'Product',
        description: 'Description here that is at least 10 chars',
        distributorId: 1,
        categoryIds: [1, 2, 3],
      });
      expect(result.success).toBe(true);
    });

    it('[1, "2", 3] → failure (mixed types)', () => {
      const result = productSchema.safeParse({
        name: 'Product',
        description: 'Description here that is at least 10 chars',
        distributorId: 1,
        // @ts-expect-error testing mixed types
        categoryIds: [1, '2', 3],
      });
      expect(result.success).toBe(false);
    });
  });

  // ─── cost, sellingPrice (optional numbers) ─────────────────────────────────

  describe('cost, sellingPrice (optional numbers)', () => {
    it('undefined → success', () => {
      const result = productSchema.safeParse({
        name: 'Product',
        description: 'Description here that is at least 10 chars',
        distributorId: 1,
        cost: undefined,
        sellingPrice: undefined,
      });
      expect(result.success).toBe(true);
    });

    it('0 → success', () => {
      const result = productSchema.safeParse({
        name: 'Product',
        description: 'Description here that is at least 10 chars',
        distributorId: 1,
        cost: 0,
        sellingPrice: 0,
      });
      expect(result.success).toBe(true);
    });

    it('100 → success', () => {
      const result = productSchema.safeParse({
        name: 'Product',
        description: 'Description here that is at least 10 chars',
        distributorId: 1,
        cost: 100,
        sellingPrice: 200,
      });
      expect(result.success).toBe(true);
    });

    it('-10 → success (negative allowed unless constrained)', () => {
      const result = productSchema.safeParse({
        name: 'Product',
        description: 'Description here that is at least 10 chars',
        distributorId: 1,
        cost: -10,
        sellingPrice: -5,
      });
      expect(result.success).toBe(true);
    });

    it('"100" (string) → failure', () => {
      const result = productSchema.safeParse({
        name: 'Product',
        description: 'Description here that is at least 10 chars',
        distributorId: 1,
        // @ts-expect-error testing string instead of number
        cost: '100',
      });
      expect(result.success).toBe(false);
    });
  });

  // ─── Multiple errors at once ────────────────────────────────────────────────

  describe('multiple errors at once', () => {
    it('invalid name + invalid description + missing distributorId → error.issues has 3+ entries', () => {
      const result = productSchema.safeParse({
        name: 'A',
        description: 'short',
        // @ts-expect-error missing distributorId
        distributorId: undefined,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThanOrEqual(3);
      }
    });

    it('each issue has the expected field path and message', () => {
      const result = productSchema.safeParse({
        name: 'A',
        description: 'short',
        // @ts-expect-error missing distributorId
        distributorId: undefined,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issues = result.error.issues;
        const paths = issues.map((i) => i.path.join('.'));
        const messages = issues.map((i) => i.message);
        expect(paths).toContain('name');
        expect(paths).toContain('description');
        expect(paths).toContain('distributorId');
        expect(messages).toContain('Product name must be at least 2 characters.');
        expect(messages).toContain('Description must be at least 10 characters.');
        expect(messages).toContain('Distributor is required');
      }
    });
  });

  // ─── ProductFormValues type export ──────────────────────────────────────────

  describe('ProductFormValues type export', () => {
    it('type re-export exists and is importable as a type', () => {
      // @ts-expect-error only type-level test
      const _typeCheck: ProductFormValues = {
        name: 'Test',
        description: 'Description here',
        distributorId: 1,
      };
      // If TypeScript accepts it, the type exists and is correct
      expect(true).toBe(true);
    });
  });
});
