import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fakeProducts, delay, Product } from '@/constants/mock-api';

describe('mock-api', () => {
  beforeEach(() => {
    // Reset and reinitialize the fake products data before each test
    fakeProducts.records = [];
    fakeProducts.initialize();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('delay', () => {
    it('should delay for the specified milliseconds', async () => {
      vi.useFakeTimers();

      const promise = delay(1000);
      vi.advanceTimersByTime(1000);
      await promise;

      expect(true).toBe(true); // If we get here without error, delay worked
    });
  });

  describe('fakeProducts.initialize()', () => {
    it('should generate 20 products', () => {
      expect(fakeProducts.records).toHaveLength(20);
    });

    it('should generate products with IDs 1-20', () => {
      const ids = fakeProducts.records.map((p) => p.id).sort((a, b) => a - b);
      expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    });

    it('should generate products with all required fields', () => {
      const product = fakeProducts.records[0];

      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('description');
      expect(product).toHaveProperty('price');
      expect(product).toHaveProperty('category');
      expect(product).toHaveProperty('photo_url');
      expect(product).toHaveProperty('created_at');
      expect(product).toHaveProperty('updated_at');
    });

    it('should generate valid photo_url format', () => {
      fakeProducts.records.forEach((product) => {
        expect(product.photo_url).toMatch(/^https:\/\/api\.slingacademy\.com\/public\/sample-products\/\d+\.png$/);
      });
    });

    it('should generate price as a number', () => {
      fakeProducts.records.forEach((product) => {
        expect(typeof product.price).toBe('number');
      });
    });
  });

  describe('fakeProducts.getAll()', () => {
    it('should return all records when no filters provided', async () => {
      const result = await fakeProducts.getAll({});

      expect(result).toHaveLength(20);
    });

    it('should filter by category when categories array provided', async () => {
      // First, find what categories exist
      const electronicsProducts = fakeProducts.records.filter(
        (p) => p.category === 'Electronics'
      );

      if (electronicsProducts.length > 0) {
        const result = await fakeProducts.getAll({ categories: ['Electronics'] });

        expect(result.length).toBe(electronicsProducts.length);
        result.forEach((product) => {
          expect(product.category).toBe('Electronics');
        });
      }
    });

    it('should return all products when categories is empty array', async () => {
      const result = await fakeProducts.getAll({ categories: [] });

      expect(result).toHaveLength(20);
    });

    it('should filter by multiple categories', async () => {
      const electronicsAndFurniture = fakeProducts.records.filter(
        (p) => p.category === 'Electronics' || p.category === 'Furniture'
      );

      const result = await fakeProducts.getAll({
        categories: ['Electronics', 'Furniture']
      });

      expect(result.length).toBe(electronicsAndFurniture.length);
    });

    it('should search across name, description, and category', async () => {
      // Use the first product's name to search
      const firstProduct = fakeProducts.records[0];
      const searchTerm = firstProduct.name.split(' ')[0]; // Use first word of name

      const result = await fakeProducts.getAll({ search: searchTerm });

      // matchSorter should find products matching the term
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return empty array for non-matching search', async () => {
      const result = await fakeProducts.getAll({ search: 'xyznonexistent123' });

      expect(result).toHaveLength(0);
    });

    it('should combine category filter with search', async () => {
      const electronicsProducts = fakeProducts.records.filter(
        (p) => p.category === 'Electronics'
      );

      if (electronicsProducts.length > 0) {
        const searchTerm = electronicsProducts[0].name.split(' ')[0];

        const result = await fakeProducts.getAll({
          categories: ['Electronics'],
          search: searchTerm
        });

        result.forEach((product) => {
          expect(product.category).toBe('Electronics');
        });
      }
    });
  });

  describe('fakeProducts.getProducts()', () => {
    it('should return paginated response with metadata', async () => {
      vi.useFakeTimers();

      const promise = fakeProducts.getProducts({ page: 1, limit: 10 });
      vi.advanceTimersByTime(1100); // delay(1000) + buffer
      const result = await promise;

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('total_products');
      expect(result).toHaveProperty('offset', 0);
      expect(result).toHaveProperty('limit', 10);
      expect(result).toHaveProperty('products');
      expect(result).toHaveProperty('time');
      expect(result).toHaveProperty('message');
    });

    it('should return correct offset and limit for page 1', async () => {
      vi.useFakeTimers();

      const promise = fakeProducts.getProducts({ page: 1, limit: 10 });
      vi.advanceTimersByTime(1100);
      const result = await promise;

      expect(result.offset).toBe(0);
      expect(result.limit).toBe(10);
      expect(result.products.length).toBe(10);
    });

    it('should return correct offset for page 2 with limit 5', async () => {
      vi.useFakeTimers();

      const promise = fakeProducts.getProducts({ page: 2, limit: 5 });
      vi.advanceTimersByTime(1100);
      const result = await promise;

      expect(result.offset).toBe(5); // (2-1) * 5
      expect(result.limit).toBe(5);
      expect(result.products.length).toBe(5);
    });

    it('should handle string categories (comma-separated)', async () => {
      vi.useFakeTimers();

      // Categories as string with comma
      const promise = fakeProducts.getProducts({
        page: 1,
        limit: 10,
        categories: 'Electronics,Furniture'
      });
      vi.advanceTimersByTime(1100);
      const result = await promise;

      // The function should split the string into array
      expect(result.total_products).toBeDefined();
    });

    it('should handle string categories (dot-separated)', async () => {
      vi.useFakeTimers();

      // Categories as string with dot
      const promise = fakeProducts.getProducts({
        page: 1,
        limit: 10,
        categories: 'Electronics.Furniture'
      });
      vi.advanceTimersByTime(1100);
      const result = await promise;

      expect(result.total_products).toBeDefined();
    });

    it('should parse valid sort JSON and sort numerically for number fields', async () => {
      vi.useFakeTimers();

      // Sort by price descending
      const promise = fakeProducts.getProducts({
        page: 1,
        limit: 20,
        sort: JSON.stringify([{ id: 'price', desc: true }])
      });
      vi.advanceTimersByTime(1100);
      const result = await promise;

      const prices = result.products.map((p) => p.price);
      const sortedPrices = [...prices].sort((a, b) => b - a);
      expect(prices).toEqual(sortedPrices);
    });

    it('should parse valid sort JSON and sort alphabetically for string fields', async () => {
      vi.useFakeTimers();

      // Sort by name ascending
      const promise = fakeProducts.getProducts({
        page: 1,
        limit: 20,
        sort: JSON.stringify([{ id: 'name', desc: false }])
      });
      vi.advanceTimersByTime(1100);
      const result = await promise;

      const names = result.products.map((p) => p.name.toLowerCase());
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    });

    it('should sort descending when desc is true', async () => {
      vi.useFakeTimers();

      // Sort by id descending
      const promise = fakeProducts.getProducts({
        page: 1,
        limit: 20,
        sort: JSON.stringify([{ id: 'id', desc: true }])
      });
      vi.advanceTimersByTime(1100);
      const result = await promise;

      const ids = result.products.map((p) => p.id);
      expect(ids[0]).toBeGreaterThan(ids[ids.length - 1]);
    });

    it('should ignore invalid sort JSON without throwing', async () => {
      vi.useFakeTimers();

      // Should not throw even with invalid JSON
      const promise = fakeProducts.getProducts({
        page: 1,
        limit: 10,
        sort: 'not-valid-json'
      });
      vi.advanceTimersByTime(1100);
      const result = await promise;

      expect(result).toHaveProperty('success', true);
      expect(result.products).toBeDefined();
    });

    it('should ignore empty sort array', async () => {
      vi.useFakeTimers();

      const promise = fakeProducts.getProducts({
        page: 1,
        limit: 10,
        sort: JSON.stringify([])
      });
      vi.advanceTimersByTime(1100);
      const result = await promise;

      // Should return products without sorting
      expect(result.products.length).toBe(10);
    });
  });

  describe('fakeProducts.getProductById()', () => {
    it('should return product when found', async () => {
      vi.useFakeTimers();

      const product = fakeProducts.records[0];
      const promise = fakeProducts.getProductById(product.id);
      vi.advanceTimersByTime(3100); // delay(3000) + buffer
      const result = await promise;

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('product');
      expect(result.product.id).toBe(product.id);
      expect(result.product.name).toBe(product.name);
    });

    it('should return failure response when product not found', async () => {
      vi.useFakeTimers();

      const promise = fakeProducts.getProductById(99999);
      vi.advanceTimersByTime(3100);
      const result = await promise;

      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('message', 'Product with ID 99999 not found');
    });

    it('should include time in response', async () => {
      vi.useFakeTimers();

      const promise = fakeProducts.getProductById(1);
      vi.advanceTimersByTime(3100);
      const result = await promise;

      expect(result).toHaveProperty('time');
    });
  });

  describe('fakeProducts.createProduct()', () => {
    it('should add new product to records', async () => {
      vi.useFakeTimers();

      const initialCount = fakeProducts.records.length;
      const newProduct = {
        name: 'New Test Product',
        description: 'A test product description',
        price: 99.99,
        category: 'Electronics'
      };

      const promise = fakeProducts.createProduct(newProduct);
      vi.advanceTimersByTime(1100);
      await promise;

      expect(fakeProducts.records.length).toBe(initialCount + 1);
    });

    it('should generate new id for created product', async () => {
      vi.useFakeTimers();

      const newProduct = {
        name: 'New Test Product',
        description: 'A test product description',
        price: 99.99,
        category: 'Electronics'
      };

      const promise = fakeProducts.createProduct(newProduct);
      vi.advanceTimersByTime(1100);
      const result = await promise;

      expect(result.product.id).toBeGreaterThan(0);
    });

    it('should set created_at and updated_at timestamps', async () => {
      vi.useFakeTimers();

      const newProduct = {
        name: 'New Test Product',
        description: 'A test product description',
        price: 99.99,
        category: 'Electronics'
      };

      const promise = fakeProducts.createProduct(newProduct);
      vi.advanceTimersByTime(1100);
      const result = await promise;

      expect(result.product.created_at).toBeDefined();
      expect(result.product.updated_at).toBeDefined();
    });

    it('should generate photo_url for new product', async () => {
      vi.useFakeTimers();

      const newProduct = {
        name: 'New Test Product',
        description: 'A test product description',
        price: 99.99,
        category: 'Electronics'
      };

      const promise = fakeProducts.createProduct(newProduct);
      vi.advanceTimersByTime(1100);
      const result = await promise;

      expect(result.product.photo_url).toMatch(/^https:\/\/api\.slingacademy\.com\/public\/sample-products\/\d+\.png$/);
    });

    it('should return success response with created product', async () => {
      vi.useFakeTimers();

      const newProduct = {
        name: 'New Test Product',
        description: 'A test product description',
        price: 99.99,
        category: 'Electronics'
      };

      const promise = fakeProducts.createProduct(newProduct);
      vi.advanceTimersByTime(1100);
      const result = await promise;

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message', 'Product created successfully');
      expect(result.product).toMatchObject(newProduct);
    });

    it('should merge all fields in created product', async () => {
      vi.useFakeTimers();

      const newProduct = {
        name: 'Complete Product',
        description: 'Full description',
        price: 150,
        category: 'Books'
      };

      const promise = fakeProducts.createProduct(newProduct);
      vi.advanceTimersByTime(1100);
      const result = await promise;

      expect(result.product.name).toBe('Complete Product');
      expect(result.product.description).toBe('Full description');
      expect(result.product.price).toBe(150);
      expect(result.product.category).toBe('Books');
      expect(result.product.id).toBeDefined();
      expect(result.product.photo_url).toBeDefined();
      expect(result.product.created_at).toBeDefined();
      expect(result.product.updated_at).toBeDefined();
    });
  });

  describe('fakeProducts.updateProduct()', () => {
    it('should merge updated data into existing product', async () => {
      vi.useFakeTimers();

      const product = fakeProducts.records[0];
      const originalName = product.name;

      const promise = fakeProducts.updateProduct(product.id, {
        name: 'Updated Name',
        price: 999.99
      });
      vi.advanceTimersByTime(1100);
      const result = await promise;

      expect(result.product.name).toBe('Updated Name');
      expect(result.product.price).toBe(999.99);
      expect(result.product.description).toBe(product.description); // unchanged
    });

    it('should update the updated_at timestamp', async () => {
      vi.useFakeTimers();

      const product = fakeProducts.records[0];
      const originalUpdatedAt = product.updated_at;

      // Advance time to ensure different timestamp
      vi.advanceTimersByTime(1000);

      const promise = fakeProducts.updateProduct(product.id, {
        name: 'Updated Name'
      });
      vi.advanceTimersByTime(1100);
      const result = await promise;

      expect(result.product.updated_at).not.toBe(originalUpdatedAt);
    });

    it('should return success response with updated product', async () => {
      vi.useFakeTimers();

      const product = fakeProducts.records[0];

      const promise = fakeProducts.updateProduct(product.id, {
        name: 'Updated Name'
      });
      vi.advanceTimersByTime(1100);
      const result = await promise;

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message', 'Product updated successfully');
      expect(result.product.name).toBe('Updated Name');
    });

    it('should return failure when product id not found', async () => {
      vi.useFakeTimers();

      const promise = fakeProducts.updateProduct(99999, {
        name: 'Updated Name'
      });
      vi.advanceTimersByTime(1100);
      const result = await promise;

      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('message', 'Product with ID 99999 not found');
    });

    it('should not modify records when product not found', async () => {
      vi.useFakeTimers();

      const initialRecords = [...fakeProducts.records];

      const promise = fakeProducts.updateProduct(99999, { name: 'Updated Name' });
      vi.advanceTimersByTime(1100);
      await promise;

      expect(fakeProducts.records).toEqual(initialRecords);
    });
  });

  describe('fakeProducts.deleteProduct()', () => {
    it('should remove product from records', async () => {
      vi.useFakeTimers();

      const productToDelete = fakeProducts.records[0];
      const initialCount = fakeProducts.records.length;

      const promise = fakeProducts.deleteProduct(productToDelete.id);
      vi.advanceTimersByTime(1100);
      await promise;

      expect(fakeProducts.records.length).toBe(initialCount - 1);
      expect(fakeProducts.records.find((p) => p.id === productToDelete.id)).toBeUndefined();
    });

    it('should return success response', async () => {
      vi.useFakeTimers();

      const productToDelete = fakeProducts.records[0];

      const promise = fakeProducts.deleteProduct(productToDelete.id);
      vi.advanceTimersByTime(1100);
      const result = await promise;

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message', 'Product deleted successfully');
    });

    it('should return failure when product not found', async () => {
      vi.useFakeTimers();

      const promise = fakeProducts.deleteProduct(99999);
      vi.advanceTimersByTime(1100);
      const result = await promise;

      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('message', 'Product with ID 99999 not found');
    });

    it('should not modify records when product not found', async () => {
      vi.useFakeTimers();

      const initialRecords = [...fakeProducts.records];

      const promise = fakeProducts.deleteProduct(99999);
      vi.advanceTimersByTime(1100);
      await promise;

      expect(fakeProducts.records).toEqual(initialRecords);
    });

    it('should only delete the specified product', async () => {
      vi.useFakeTimers();

      const productToKeep = fakeProducts.records[1];
      const productToDelete = fakeProducts.records[0];

      const promise = fakeProducts.deleteProduct(productToDelete.id);
      vi.advanceTimersByTime(1100);
      await promise;

      expect(fakeProducts.records.find((p) => p.id === productToDelete.id)).toBeUndefined();
      expect(fakeProducts.records.find((p) => p.id === productToKeep.id)).toBeDefined();
    });
  });

  describe('Product type', () => {
    it('should have all required fields matching Product type', () => {
      const product: Product = {
        id: 1,
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        category: 'Electronics',
        photo_url: 'https://example.com/photo.png',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      };

      expect(product.id).toBe(1);
      expect(product.name).toBe('Test Product');
      expect(product.description).toBe('Test Description');
      expect(product.price).toBe(100);
      expect(product.category).toBe('Electronics');
      expect(product.photo_url).toBe('https://example.com/photo.png');
      expect(product.created_at).toBe('2024-01-01T00:00:00.000Z');
      expect(product.updated_at).toBe('2024-01-01T00:00:00.000Z');
    });
  });

  describe('state isolation between tests', () => {
    it('should start with 20 records in each test (due to beforeEach reset)', () => {
      // This test verifies that the beforeEach reset is working
      expect(fakeProducts.records).toHaveLength(20);
    });

    it('should still have 20 records if previous test added then deleted', async () => {
      vi.useFakeTimers();

      // Simulate operations that modify state
      const promise1 = fakeProducts.createProduct({
        name: 'Temp Product',
        description: 'Temp',
        price: 100,
        category: 'Temp'
      });
      vi.advanceTimersByTime(1100);
      const result1 = await promise1;

      const promise2 = fakeProducts.deleteProduct(result1.product.id);
      vi.advanceTimersByTime(1100);
      await promise2;

      // But the next test's beforeEach will reset to 20
      expect(fakeProducts.records.length).toBe(20);
    });
  });
});
