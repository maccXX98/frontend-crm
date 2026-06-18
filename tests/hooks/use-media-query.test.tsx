import { act, renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import { useMediaQuery } from '@/hooks/use-media-query';

describe('useMediaQuery', () => {
  let listener: ((e: MediaQueryListEvent) => void) | undefined;
  let matchMediaSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();

    listener = undefined;
    matchMediaSpy = vi.fn().mockImplementation((q: string) => ({
      matches: false,
      media: q,
      addEventListener: vi.fn((_: string, cb: (e: MediaQueryListEvent) => void) => {
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

  it('returns { isOpen: false } initially', () => {
    const { result } = renderHook(() => useMediaQuery());
    expect(result.current).toEqual({ isOpen: false });
  });

  it('after mount with mediaQuery.matches = true returns { isOpen: true }', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockImplementation((q: string) => ({
      matches: true,
      media: q,
      addEventListener: vi.fn((_: string, cb: (e: MediaQueryListEvent) => void) => {
        listener = cb;
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn()
    })));

    const { result } = renderHook(() => useMediaQuery());
    expect(result.current).toEqual({ isOpen: true });
  });

  it('after mount with mediaQuery.matches = false returns { isOpen: false }', () => {
    const { result } = renderHook(() => useMediaQuery());
    expect(result.current).toEqual({ isOpen: false });
  });

  it('adds listener on mount', () => {
    renderHook(() => useMediaQuery());

    expect(matchMediaSpy).toHaveBeenCalledWith('(max-width: 768px)');
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

    const { unmount } = renderHook(() => useMediaQuery());
    unmount();

    expect(removeEventListener).toHaveBeenCalled();
  });

  it('triggering listener with event.matches = true updates to true', () => {
    const { result } = renderHook(() => useMediaQuery());

    expect(result.current.isOpen).toBe(false);

    act(() => {
      listener?.({ matches: true } as MediaQueryListEvent);
    });

    expect(result.current.isOpen).toBe(true);
  });

  it('triggering listener with event.matches = false updates to false', () => {
    // Start with matches = true
    vi.stubGlobal('matchMedia', vi.fn().mockImplementation((q: string) => ({
      matches: true,
      media: q,
      addEventListener: vi.fn((_: string, cb: (e: MediaQueryListEvent) => void) => {
        listener = cb;
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn()
    })));

    const { result } = renderHook(() => useMediaQuery());
    expect(result.current.isOpen).toBe(true);

    act(() => {
      listener?.({ matches: false } as MediaQueryListEvent);
    });

    expect(result.current.isOpen).toBe(false);
  });
});