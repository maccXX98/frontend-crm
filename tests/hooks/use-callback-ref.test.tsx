import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import { useCallbackRef } from '@/hooks/use-callback-ref';

describe('useCallbackRef', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a function', () => {
    const { result } = renderHook(() => useCallbackRef(vi.fn()));
    expect(typeof result.current).toBe('function');
  });

  it('calling returned function calls the latest callback', () => {
    const cb = vi.fn();
    const { result } = renderHook(() => useCallbackRef(cb));

    result.current('arg1', 'arg2');

    expect(cb).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('returned function is stable across rerenders (same reference)', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();

    const { result, rerender } = renderHook(
      ({ cb }) => useCallbackRef(cb),
      { initialProps: { cb: cb1 } }
    );

    const ref1 = result.current;

    // Rerender with same callback
    rerender({ cb: cb1 });

    expect(result.current).toBe(ref1);
  });

  it('after rerender with new callback, calling returned fn uses new callback', () => {
    const cb1 = vi.fn(() => 'one');
    const cb2 = vi.fn(() => 'two');

    const { result, rerender } = renderHook(
      ({ cb }) => useCallbackRef(cb),
      { initialProps: { cb: cb1 } }
    );

    expect(result.current()).toBe('one');

    rerender({ cb: cb2 });

    expect(result.current()).toBe('two');
  });

  it('latest callback args are forwarded', () => {
    const cb = vi.fn();
    const { result } = renderHook(() => useCallbackRef(cb));

    result.current('a', 1, { nested: true });

    expect(cb).toHaveBeenCalledWith('a', 1, { nested: true });
  });

  it('latest callback return value is returned', () => {
    const cb = vi.fn(() => 'expected');
    const { result } = renderHook(() => useCallbackRef(cb));

    const returnValue = result.current();

    expect(returnValue).toBe('expected');
  });

  it('works with undefined callback initially', () => {
    const { result } = renderHook(() => useCallbackRef(undefined));

    // Should not throw
    expect(typeof result.current).toBe('function');
  });

  it('callback updated via useEffect after render', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();

    const { result, rerender } = renderHook(
      ({ cb }) => useCallbackRef(cb),
      { initialProps: { cb: cb1 } }
    );

    result.current();
    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).not.toHaveBeenCalled();

    rerender({ cb: cb2 });
    result.current();

    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledTimes(1);
  });

  it('handles multiple sequential updates', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const cb3 = vi.fn();

    const { result, rerender } = renderHook(
      ({ cb }) => useCallbackRef(cb),
      { initialProps: { cb: cb1 } }
    );

    result.current();
    rerender({ cb: cb2 });
    result.current();
    rerender({ cb: cb3 });
    result.current();

    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledTimes(1);
    expect(cb3).toHaveBeenCalledTimes(1);
  });
});