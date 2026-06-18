import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { pokemonOptions } from '@/features/react-query-demo/api/queries';

// ============================================================
// Mock fetch — vi.fn() captured at module level.
// Re-stub in beforeEach because vi.unstubAllGlobals in afterEach
// removes the global stub between tests.
// ============================================================
const mockFetch = vi.fn(() => ({
  ok: true,
  json: async () => ({}),
}));

beforeEach(() => {
  // Re-stub after vi.unstubAllGlobals from previous afterEach
  vi.stubGlobal('fetch', mockFetch);
  mockFetch.mockClear();
});

afterEach(async () => {
  // Give pending async operations a tick to complete with the mock still in place
  await new Promise((r) => setTimeout(r, 0));
  vi.unstubAllGlobals();
});

describe('react-query-demo api/queries', () => {
  // ============================================================
  // pokemonOptions — queryKey
  // ============================================================
  describe('pokemonOptions — queryKey', () => {
    it('queryKey is ["pokemon", 25] (default id)', () => {
      const options = pokemonOptions();
      expect(options.queryKey).toEqual(['pokemon', 25]);
    });

    it('queryKey is ["pokemon", 1] (explicit id)', () => {
      const options = pokemonOptions(1);
      expect(options.queryKey).toEqual(['pokemon', 1]);
    });

    it('queryKey is ["pokemon", 150] (Mewtwo)', () => {
      const options = pokemonOptions(150);
      expect(options.queryKey).toEqual(['pokemon', 150]);
    });

    it('queryKey for id=0 is ["pokemon", 0]', () => {
      const options = pokemonOptions(0);
      expect(options.queryKey).toEqual(['pokemon', 0]);
    });

    it('different ids produce different queryKeys', () => {
      const opt25 = pokemonOptions(25);
      const opt1 = pokemonOptions(1);
      const opt150 = pokemonOptions(150);
      expect(opt25.queryKey).not.toEqual(opt1.queryKey);
      expect(opt25.queryKey).not.toEqual(opt150.queryKey);
      expect(opt1.queryKey).not.toEqual(opt150.queryKey);
    });
  });

  // ============================================================
  // pokemonOptions — queryFn
  // ============================================================
  describe('pokemonOptions — queryFn', () => {
    it('queryFn is an async function', () => {
      const options = pokemonOptions();
      expect(options.queryFn).toBeInstanceOf(Function);
      const result = options.queryFn();
      expect(result).toBeInstanceOf(Promise);
    });

    it('successful fetch: returns parsed JSON', async () => {
      const mockPokemon = {
        id: 25,
        name: 'pikachu',
        sprites: { front_shiny: 'shiny.png', front_default: 'default.png' },
        types: [{ type: { name: 'electric' } }],
        stats: [{ base_stat: 100, stat: { name: 'hp' } }],
        height: 4,
        weight: 60,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPokemon,
      });

      const options = pokemonOptions(25);
      const result = await options.queryFn();

      expect(result).toEqual(mockPokemon);
    });

    it('fetches correct URL: https://pokeapi.co/api/v2/pokemon/25', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const options = pokemonOptions(25);
      await options.queryFn();

      expect(mockFetch).toHaveBeenCalledWith('https://pokeapi.co/api/v2/pokemon/25');
    });

    it('fetches with explicit id: URL contains /pokemon/150', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const options = pokemonOptions(150);
      await options.queryFn();

      expect(mockFetch).toHaveBeenCalledWith('https://pokeapi.co/api/v2/pokemon/150');
    });

    it('non-ok response (status 404): throws Error with message "Failed to fetch pokemon"', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const options = pokemonOptions(999);
      await expect(options.queryFn()).rejects.toThrow('Failed to fetch pokemon');
    });

    it('non-ok response (status 500): throws same error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const options = pokemonOptions(25);
      await expect(options.queryFn()).rejects.toThrow('Failed to fetch pokemon');
    });

    it('non-ok response (status 403): throws "Failed to fetch pokemon"', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
      });

      const options = pokemonOptions(1);
      await expect(options.queryFn()).rejects.toThrow('Failed to fetch pokemon');
    });

    it('ok=true with full Pokemon payload: queryFn returns the payload', async () => {
      const fullPayload = {
        id: 25,
        name: 'pikachu',
        sprites: { front_shiny: 'shiny.png', front_default: 'default.png' },
        types: [{ type: { name: 'electric' } }],
        stats: [{ base_stat: 100, stat: { name: 'hp' } }],
        height: 4,
        weight: 60,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => fullPayload,
      });

      const options = pokemonOptions(25);
      const result = await options.queryFn();

      expect(result).toEqual(fullPayload);
      expect(result.id).toBe(25);
      expect(result.name).toBe('pikachu');
      expect(result.height).toBe(4);
      expect(result.weight).toBe(60);
    });

    it('default id=25 is used when no argument provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 25 }),
      });

      const options = pokemonOptions(); // no args — uses default 25
      await options.queryFn();

      expect(mockFetch).toHaveBeenCalledWith('https://pokeapi.co/api/v2/pokemon/25');
    });
  });
});
