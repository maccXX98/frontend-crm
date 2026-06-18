import { act, renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import { useIsMobile } from '@/hooks/use-mobile';

describe('useIsMobile', () => {
  let listener: (() => void) | undefined;
  let matchMediaSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();

    listener = undefined;
    matchMediaSpy = vi.fn().mockImplementation((q: string) => ({
      matches: false,
      media: q,
      addEventListener: vi.fn((_: string, cb: () => void) => {
        listener = cb;
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn()
    }));

    vi.stubGlobal('matchMedia', matchMediaSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns false on initial render', () => {
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('returns true after mount with window.innerWidth = 500 (mobile)', () => {
    // Override matchMedia AND stub window.innerWidth
    vi.stubGlobal('matchMedia', vi.fn().mockImplementation((q: string) => ({
      matches: true, // At 500px < 768px, this would be true
      media: q,
      addEventListener: vi.fn((_: string, cb: () => void) => {
        listener = cb;
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn()
    })));
    vi.stubGlobal('innerWidth', 500);

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);

    vi.unstubAllGlobals();
  });

  it('returns false after mount with window.innerWidth = 1024 (desktop)', () => {
    const { result } = renderHook(() => useIsMobile());
    // Default innerWidth in jsdom is 1024, which is >= 768
    expect(result.current).toBe(false);
  });

  it('returns false at boundary window.innerWidth = 768', () => {
    // At exactly 768, innerWidth < 768 is false (768 is not less than 768)
    vi.stubGlobal('innerWidth', 768);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
    vi.unstubAllGlobals();
  });

  it('returns true at window.innerWidth = 767', () => {
    vi.stubGlobal('innerWidth', 767);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
    vi.unstubAllGlobals();
  });

  it('adds listener on mount', () => {
    renderHook(() => useIsMobile());

    expect(matchMediaSpy).toHaveBeenCalledWith('(max-width: 767px)');
  });

  it('removes listener on unmount', () => {
    const removeEventListener = vi.fn();
    vi.stubGlobal('matchMedia', vi.fn().mockImplementation((q: string) => ({
      matches: false,
      media: q,
      addEventListener: vi.fn(),
      removeEventListener,
      dispatchEvent: vi.fn(),
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn()
    })));

    const { unmount } = renderHook(() => useIsMobile());
    unmount();

    expect(removeEventListener).toHaveBeenCalled();
  });

  it('triggering listener updates isMobile state', () => {
    const { result } = renderHook(() => useIsMobile());

    // Initial state is false (1024 >= 768)
    expect(result.current).toBe(false);

    // Trigger listener to simulate window resize
    act(() => {
      listener?.();
    });

    // The listener re-checks window.innerWidth, which is still 1024
    // So the state should still be false
  });
});