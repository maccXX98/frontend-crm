import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs';

// Mock next/navigation - import the mocked module
const mockUsePathname = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname()
}));

describe('useBreadcrumbs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue('/dashboard');
  });

  // ============================================
  // Route mapping cases
  // ============================================
  describe('Route mapping', () => {
    it('path /dashboard returns [{ title: "Dashboard", link: "/dashboard" }]', () => {
      mockUsePathname.mockReturnValueOnce('/dashboard');

      const { result } = renderHook(() => useBreadcrumbs());

      expect(result.current).toEqual([{ title: 'Dashboard', link: '/dashboard' }]);
    });

    it('path /dashboard/employee returns 2-item array with Dashboard + Employee', () => {
      mockUsePathname.mockReturnValueOnce('/dashboard/employee');

      const { result } = renderHook(() => useBreadcrumbs());

      expect(result.current).toEqual([
        { title: 'Dashboard', link: '/dashboard' },
        { title: 'Employee', link: '/dashboard/employee' }
      ]);
    });

    it('path /dashboard/product returns Dashboard + Product', () => {
      mockUsePathname.mockReturnValueOnce('/dashboard/product');

      const { result } = renderHook(() => useBreadcrumbs());

      expect(result.current).toEqual([
        { title: 'Dashboard', link: '/dashboard' },
        { title: 'Product', link: '/dashboard/product' }
      ]);
    });
  });

  // ============================================
  // Fallback path generation
  // ============================================
  describe('Fallback path generation', () => {
    it('path /dashboard/unknown falls back to path segments, all capitalized', () => {
      mockUsePathname.mockReturnValueOnce('/dashboard/unknown');

      const { result } = renderHook(() => useBreadcrumbs());

      expect(result.current).toEqual([
        { title: 'Dashboard', link: '/dashboard' },
        { title: 'Unknown', link: '/dashboard/unknown' }
      ]);
    });

    it('path /dashboard/employee/profile returns 3 segments, all capitalized', () => {
      mockUsePathname.mockReturnValueOnce('/dashboard/employee/profile');

      const { result } = renderHook(() => useBreadcrumbs());

      expect(result.current).toEqual([
        { title: 'Dashboard', link: '/dashboard' },
        { title: 'Employee', link: '/dashboard/employee' },
        { title: 'Profile', link: '/dashboard/employee/profile' }
      ]);
    });

    it('single segment path /foo returns 1 item with title "Foo"', () => {
      mockUsePathname.mockReturnValueOnce('/foo');

      const { result } = renderHook(() => useBreadcrumbs());

      expect(result.current).toEqual([{ title: 'Foo', link: '/foo' }]);
    });

    it('empty path / returns empty array', () => {
      mockUsePathname.mockReturnValueOnce('/');

      const { result } = renderHook(() => useBreadcrumbs());

      expect(result.current).toEqual([]);
    });

    it('mixed case /dashboard/CamelCase preserves exact case in title', () => {
      mockUsePathname.mockReturnValueOnce('/dashboard/CamelCase');

      const { result } = renderHook(() => useBreadcrumbs());

      // Title should be "CamelCase" (charAt(0).toUpperCase() + slice(1))
      expect(result.current).toEqual([
        { title: 'Dashboard', link: '/dashboard' },
        { title: 'CamelCase', link: '/dashboard/CamelCase' }
      ]);
    });
  });

  // ============================================
  // Deep paths
  // ============================================
  describe('Deep paths', () => {
    it('handles deeply nested paths', () => {
      mockUsePathname.mockReturnValueOnce('/a/b/c/d');

      const { result } = renderHook(() => useBreadcrumbs());

      expect(result.current).toEqual([
        { title: 'A', link: '/a' },
        { title: 'B', link: '/a/b' },
        { title: 'C', link: '/a/b/c' },
        { title: 'D', link: '/a/b/c/d' }
      ]);
    });
  });

  // ============================================
  // Empty segments
  // ============================================
  describe('Empty segments filtering', () => {
    it('filters out empty segments from path', () => {
      mockUsePathname.mockReturnValueOnce('///');

      const { result } = renderHook(() => useBreadcrumbs());

      expect(result.current).toEqual([]);
    });
  });
});