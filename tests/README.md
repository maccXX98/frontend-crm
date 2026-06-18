# CRM Frontend — Test Suite

## 1. Overview

- **Total files**: 34
- **Total tests**: 785
- **Runtime**: ~22s (watch mode: ~5s after warm-up)
- **Stack**: Vitest 4.1.9 + @testing-library/react 16.3.2 + jsdom
- **Coverage**: 100% of HIGH/MEDIUM/LOW priority units from initial discovery

## 2. Quick Reference

```bash
bun run test           # Run full suite
bun run test:watch     # Watch mode (reruns affected tests on change)
bun run test -- tests/lib/utils.test.ts   # Run specific file
bun run test -t "contactno"              # Filter by test name pattern
bun run test -- --run  # CI mode (no watch, exits after run)
```

| Command | Description |
|---------|-------------|
| `bun run test` | Full suite, all 34 files |
| `bun run test:watch` | Watch mode, reruns affected tests |
| `bun run test -- tests/path/` | Run all tests in a directory |
| `bun run test -t "pattern"` | Run tests whose name matches regex |

## 3. Project Conventions

### File Location

```
tests/<mirror-of-src-path>/<name>.test.ts(x)
```

Mirror the `src/` structure exactly. Use `.tsx` for tests that render React or use hooks.

### Imports

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom'; // extends expect with toBeInTheDocument etc.
import { renderHook, act } from '@testing-library/react';
```

### Path Aliases

`@/` resolves to `./src`. Example:

```ts
import { profileSchema } from '@/features/profile/utils/form-schema';
```

### State Reset Patterns

**Zustand stores** — reset via `useStore.setState(...)` in `beforeEach`:

```ts
beforeEach(() => {
  useNotificationStore.setState({ notifications: [] });
  vi.clearAllMocks();
});
```

**Module-level mutable state** (inline-mocked data stores):

```ts
const initialRecords = [...fakeUsers.records];
beforeEach(() => {
  fakeUsers.records = [...initialRecords];
});
```

### Intentional Type Errors

Use `// @ts-expect-error` for tests of invalid inputs:

```ts
contactno: 'abc', // @ts-expect-error intentionally invalid string
```

### React Hook Testing

```ts
import { renderHook, act } from '@testing-library/react';
import { useStepper } from '@/hooks/use-stepper';

it('should advance', async () => {
  const { result } = renderHook(() => useStepper({ totalSteps: 3 }));
  await act(async () => { result.current.next(); });
  expect(result.current.currentStep).toBe(1);
});
```

## 4. Core Patterns Catalog

### 1. Mocking `fetch`

```ts
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
    ok: true,
    status: 200,
    json: async () => ({}),
  })));
});

afterEach(() => {
  vi.unstubAllGlobals();
});
```

### 2. Mocking Modules (`vi.mock`)

```ts
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));
```

### 3. Hoisted Mocks (`vi.hoisted`)

`vi.mock` is hoisted to the top of the file — variables referenced in the factory are resolved at call time, not declaration time:

```ts
const mockFn = vi.fn();
vi.hoisted(() => ({ usePathname: mockFn }));

vi.mock('next/navigation', () => ({
  usePathname: mockFn,
}));
```

### 4. Mocking `next/navigation`

```ts
const mockUsePathname = vi.fn();
vi.hoisted(() => ({ usePathname: mockUsePathname }));

vi.mock('next/navigation', () => ({
  usePathname: mockUsePathname,
  redirect: vi.fn(),
}));
```

Then use `mockUsePathname.mockReturnValueOnce('/dashboard')`.

### 5. Mocking `nuqs` (search params)

```ts
vi.mock('nuqs', () => ({
  ...vi.importActual('nuqs'),
  useQueryState: vi.fn((key: string) => [defaultValue, vi.fn()]),
  useQueryStates: vi.fn(() => ({ /* default state */ })),
}));
```

### 6. Mocking `matchMedia`

```ts
vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
})));
```

### 7. Mocking Zustand Actions

```ts
beforeEach(() => {
  useAuthStore.setState({ user: null, isLoading: false });
});
```

### 8. Fake Timers

```ts
beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

it('debounces', async () => {
  vi.advanceTimersByTime(300);
  await act(async () => { /* fire handler */ });
  vi.advanceTimersByTime(1100); // trigger delay
  await promise;
});
```

> **Critical**: Call `vi.advanceTimersByTime(N)` BEFORE the `await` that waits on a `delay()` call. See Gotcha #1.

### 9. Testing React Table Columns

```ts
vi.mock('next/image', () => ({ default: (props: any) => <img {...props} /> }));
vi.mock('@/components/ui/badge', () => ({ Badge: (p: any) => <span>{p.children}</span> }));

const columns = productColumns.map(col => {
  if (col.id === 'image') return { ...col, cell: (info: any) => null };
  if (col.id === 'actions') return { ...col, cell: (info: any) => <button>action</button> };
  return col;
});
const { result } = renderHook(() => useColumns({ data: mockProducts }));
```

### 10. Testing Zod Schemas

```ts
const result = schema.safeParse(input);
expect(result.success).toBe(false);
if (!result.success) {
  expect(result.error.issues[0].message).toBe('Expected message');
  expect(result.error.issues[0].path).toEqual(['fieldName']);
}
```

### 11. Testing TanStack Query Mutations

```ts
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
    ok: true,
    json: async () => ({ id: 1, name: 'Test' }),
  })));
});
```

### 12. Module-level State Isolation

Always re-stub in `beforeEach` after `vi.unstubAllGlobals()`:

```ts
afterEach(() => { vi.unstubAllGlobals(); });

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetchFn);
  vi.stubGlobal('matchMedia', mockMatchMedia);
});
```

## 5. Gotchas & Lessons Learned

### 1. `vi.advanceTimersByTime(N)` BEFORE await

Must call fake-timer advance BEFORE the `await` for `delay()` calls to resolve:

```ts
vi.advanceTimersByTime(1100);
await promise; // resolves after timers advance
```

Calling after causes the promise to never settle (timer already past).

### 2. `vi.hoisted` for `vi.mock` factories

`vi.mock` is hoisted. Variables referenced in the factory are captured at call time. Use `vi.hoisted()` to create mocks before the `vi.mock` call:

```ts
const mockFn = vi.fn();
vi.hoisted(() => ({ usePathname: mockFn }));
vi.mock('next/navigation', () => ({ usePathname: mockFn }));
```

### 3. `Headers.get('X')` for assertions

`expect.objectContaining` does NOT work with `Headers` objects. Use:

```ts
expect(headers.get('Content-Type')).toBe('application/json');
```

### 4. Cookie deletion pattern

```ts
document.cookie = 'key=; path=/; max-age=0';
expect(document.cookie).toMatch(/key=;/);
```

### 5. Zustand persist + jsdom

jsdom handles localStorage/sessionStorage automatically. Reset state via `useStore.setState(...)` in `beforeEach`.

### 6. `mockClear` vs `mockReset`

- `mockClear()` — clears call history, preserves implementations
- `mockReset()` — clears call history AND implementations (returns `undefined`)

Use `mockClear()` for tests with default implementations you want to keep.

### 7. `vi.unstubAllGlobals()` kills stubs

After calling `vi.unstubAllGlobals()`, re-stub ALL globals in the next `beforeEach`, not once at the top level.

### 8. Default `vi.fn()` returns undefined

Provide a default return to prevent cascading failures:

```ts
vi.fn(() => ({ ok: true, json: async () => ({}) }));
```

### 9. `onSuccess` returns `void`, not `Promise`

```ts
// WRONG
await expect(mutation.onSuccess()).resolves.toBeUndefined();

// CORRECT
expect(() => mutation.onSuccess()).not.toThrow();
```

### 10. `as const` is TypeScript-only

No runtime `Object.isFrozen()` assertion on `as const` objects — it has no effect at runtime.

### 11. `formatDate(0)` returns `''`

Falsy guard on `timestamp`. Use `new Date(0)` for timestamp tests.

### 12. ISO date strings shift in non-UTC timezones

`'2024-01-01'` parsed as local time differs from UTC. Use `Date.UTC()` or match by pattern/regex instead of exact string.

### 13. `parseAsInteger.parse('1.5')` truncates to 1

Not null, not NaN. Truncates toward zero.

### 14. nuqs `serialize` skips default values

`page: 1` becomes empty string in URL when page is at default. Handle this in tests.

### 15. `z.coerce.number()` accepts `null` and `''`

Both coerce to `0`. Use `.refine(v => v > 0)` to reject. `Number(null) === 0`, `Number('') === 0`. Fixed in `src/features/profile/utils/form-schema.ts`.

### 16. `createRestrictToContainer` math

`maxY = container.bottom - dragging.bottom` (not `container.bottom - dragging.top`). Corrected during batch 7.

### 17. `useIsMobile` uses BOTH `window.innerWidth` AND `matchMedia`

Mock both, not just `matchMedia`.

### 18. Async stepper state

```ts
await act(async () => { result.current.next(); });
rerender();
expect(result.current.currentStep).toBe(1);
```

### 19. Module-level mock ref pattern

```ts
const mockFn = vi.fn();
vi.hoisted(() => ({ usePathname: mockFn }));
vi.mock('next/navigation', () => ({ usePathname: mockFn }));
mockFn.mockReturnValueOnce('/path');
```

Use `vi.mocked(usePathname)` does NOT work without importing it first in the factory.

### 20. `vitest` skill not in opencode registry

The skill exists at `.agents/skills/vitest/` but the `skill` tool cannot find it by name. Read `SKILL.md` and reference files directly.

## 6. Bugs Found Through Testing

### Bug 1: `z.coerce.number()` silently accepts `null` and `''`

**File**: `src/features/profile/utils/form-schema.ts`

**Description**: `z.coerce.number()` accepts `null` (coerces to `0`) and `''` (coerces to `0`) as valid contact numbers. Clearing the contact number field silently submitted `0` to the backend.

**Evidence**: Existing test asserted `contactno: null → success, data === 0` and `contactno: 0 → success`. Both passed with the buggy code.

**Fix applied**:

```ts
// BEFORE
contactno: z.coerce.number(),

// AFTER
contactno: z
  .coerce
  .number({ message: 'Contact number is required' })
  .refine((v) => v > 0, { message: 'Contact number must be a positive number' }),
```

**Tests updated**:
- `contactno: null` → now FAILS with "Contact number must be a positive number"
- `contactno: ''` → now FAILS with "Contact number must be a positive number"
- `contactno: 0` → now FAILS with "Contact number must be a positive number"
- `contactno: -5` → now FAILS with "Contact number must be a positive number"
- `contactno: 12345` → still SUCCESS
- `contactno: '12345'` → still SUCCESS (coerced)

### Bug 2: `formatBytes` overflow on >1PB

**File**: `src/lib/utils.ts`

**Description**: `sizes` has 5 entries (indices 0–4). For `bytes = 1024 ** 5` (1 PB), `Math.log(bytes) / Math.log(1024) ≈ 5.0`. With floating point, `i` could be `5`, causing `sizes[5]` to be `undefined`, falling back to `'Bytes'`. Result: `formatBytes(1024 ** 5)` returned `'1 Bytes'` instead of a sensible value.

**Evidence**: Test asserted `formatBytes(1024 ** 5) → '1 Bytes'` (buggy behavior).

**Fix applied**:

```ts
// BEFORE
const i = Math.floor(Math.log(bytes) / Math.log(1024));

// AFTER
const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
```

**Tests updated**:
- `formatBytes(1024 ** 5)` → now returns `'1024 TB'`
- `formatBytes(1024 ** 5, { sizeType: 'accurate' })` → now returns `'1024 TiB'`
- `formatBytes(1024 ** 6)` → now returns `'1048576 TB'`

## 7. Files & Coverage

### HIGH Priority — Auth, Contracts, API Layer

| Source | Test File | Tests |
|--------|-----------|-------|
| `src/lib/api-client.ts` | `tests/lib/api-client.test.ts` | 24 |
| `src/stores/auth-store.ts` | `tests/stores/auth-store.test.ts` | 18 |
| `src/constants/mock-api.ts` | `tests/constants/mock-api.test.ts` | 45 |
| `src/constants/mock-api-users.ts` | `tests/constants/mock-api-users.test.ts` | 55 |
| `src/features/users/api/mutations.ts` | `tests/features/users/api/mutations.test.ts` | 13 |
| `src/features/users/api/queries.ts` | `tests/features/users/api/queries.test.ts` | 13 |
| `src/features/products/api/mutations.ts` | `tests/features/products/api/mutations.test.ts` | 13 |
| `src/features/products/api/queries.ts` | `tests/features/products/api/queries.test.ts` | 18 |
| `src/features/products/api/service.ts` | `tests/features/products/api/service.test.ts` | 7 |

### MEDIUM Priority — Hooks, Queries, Mutations, Schemas, Stores

| Source | Test File | Tests |
|--------|-----------|-------|
| `src/hooks/use-stepper.ts` | `tests/hooks/use-stepper.test.tsx` | 27 |
| `src/hooks/use-controllable-state.ts` | `tests/hooks/use-controllable-state.test.tsx` | 18 |
| `src/hooks/use-data-table.ts` | `tests/hooks/use-data-table.test.tsx` | 21 |
| `src/hooks/use-breadcrumbs.ts` | `tests/hooks/use-breadcrumbs.test.tsx` | 10 |
| `src/hooks/use-mobile.ts` | `tests/hooks/use-mobile.test.tsx` | 8 |
| `src/hooks/use-media-query.ts` | `tests/hooks/use-media-query.test.tsx` | 7 |
| `src/hooks/use-debounce.ts` | `tests/hooks/use-debounce.test.tsx` | 3 |
| `src/hooks/use-debounced-callback.ts` | `tests/hooks/use-debounced-callback.test.tsx` | 10 |
| `src/hooks/use-callback-ref.ts` | `tests/hooks/use-callback-ref.test.tsx` | 9 |
| `src/features/profile/utils/form-schema.ts` | `tests/features/profile/utils/form-schema.test.ts` | 41 |
| `src/features/users/schemas/user.ts` | `tests/features/users/schemas/user.test.ts` | 29 |
| `src/features/products/schemas/product.ts` | `tests/features/products/schemas/product.test.ts` | 46 |
| `src/features/chat/utils/store.ts` | `tests/features/chat/utils/store.test.ts` | 36 |
| `src/features/kanban/utils/store.ts` | `tests/features/kanban/utils/store.test.ts` | 21 |
| `src/features/notifications/utils/store.ts` | `tests/features/notifications/utils/store.test.ts` | 26 |
| `src/features/react-query-demo/api/queries.ts` | `tests/features/react-query-demo/api/queries.test.ts` | 14 |

### LOW Priority — Format, Utils, SearchParams, DnD, Columns

| Source | Test File | Tests |
|--------|-----------|-------|
| `src/lib/utils.ts` | `tests/lib/utils.test.ts` | 32 |
| `src/lib/format.ts` | `tests/lib/format.test.ts` | 18 |
| `src/lib/parsers.ts` | `tests/lib/parsers.test.ts` | 63 |
| `src/lib/searchparams.ts` | `tests/lib/searchparams.test.ts` | 24 |
| `src/lib/data-table.ts` | `tests/lib/data-table.test.ts` | 53 |
| `src/lib/compose-refs.tsx` | `tests/lib/compose-refs.test.tsx` | 25 |
| `src/features/kanban/utils/restrict-to-container.ts` | `tests/features/kanban/utils/restrict-to-container.test.ts` | 11 |
| `src/features/products/components/product-tables/columns.tsx` | `tests/features/products/components/product-tables/columns.test.tsx` | 26 |

### Sanity

| Source | Test File | Tests |
|--------|-----------|-------|
| — | `tests/sanity.test.tsx` | 1 |

**Total: 34 files, 785 tests**

## 8. How to Add New Tests

### Step 1 — Identify the source file

Find the source file you need to test. E.g., `src/features/profile/utils/form-schema.ts`.

### Step 2 — Determine test location

Mirror the path in `tests/`:

```
src/features/profile/utils/form-schema.ts
→ tests/features/profile/utils/form-schema.test.ts
```

### Step 3 — Check required mocks

Look at similar test files for patterns:
- `next/navigation` mocking → use `vi.hoisted` + `vi.mock`
- `fetch` mocking → use `vi.stubGlobal('fetch', ...)` in `beforeEach`
- `matchMedia` → `vi.stubGlobal('matchMedia', ...)`
- Zustand stores → `useStore.setState(...)` in `beforeEach`

### Step 4 — Write tests following conventions

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mySchema } from '@/features/my-feature/utils/my-schema';

describe('mySchema', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('valid input', () => {
    it('valid data → success', () => {
      const result = mySchema.safeParse({ name: 'John' });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid input', () => {
    it('empty name → failure', () => {
      const result = mySchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Name is required');
      }
    });
  });
});
```

### Step 5 — Run the specific file

```bash
bun run test -- tests/features/profile/utils/form-schema.test.ts
```

### Step 6 — Run full suite

```bash
bun run test
```

### Step 7 — If you find a bug

1. Fix the source code
2. Update the test to assert the **fixed** behavior (not the buggy behavior)
3. Document the bug in this README under Section 6

## 9. References

- [Vitest Docs](https://vitest.dev)
- [@testing-library/react](https://testing-library.com/react)
- [nuqs](https://nuqs.47ng.com)
- [Zod](https://zod.dev)
- Internal: `D:\TITULACION_UNI\.agents\skills\vitest\SKILL.md`
- Internal: `D:\TITULACION_UNI\.agents\skills\kiranism-shadcn-dashboard\SKILL.md`
