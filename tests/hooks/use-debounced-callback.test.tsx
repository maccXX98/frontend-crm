import { act, renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('before delay, callback has NOT fired', () => {
    const cb = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(cb, 500));

    result.current('hello');

    // Advance time by only 400ms (less than 500ms delay)
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(cb).not.toHaveBeenCalled();
  });

  it('after delay, callback fires', () => {
    const cb = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(cb, 500));

    result.current('hello');

    expect(cb).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(cb).toHaveBeenCalledWith('hello');
  });

  it('multiple rapid calls: only the LAST call args are used (timer reset)', () => {
    const cb = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(cb, 500));

    result.current('first');
    act(() => {
      vi.advanceTimersByTime(200);
    });
    result.current('second');
    act(() => {
      vi.advanceTimersByTime(200);
    });
    result.current('third');

    // After 400ms total, the third call is still pending
    expect(cb).not.toHaveBeenCalled();

    // After 500ms from the last call (900ms total), callback fires with 'third'
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith('third');
  });

  it('each call uses the latest callback (callbackRef updates via useCallbackRef)', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();

    const { result, rerender } = renderHook(
      ({ callback, delay }) => useDebouncedCallback(callback, delay),
      { initialProps: { callback: cb1, delay: 500 } }
    );

    result.current('test');

    // Change callback
    rerender({ callback: cb2, delay: 500 });

    // Now call with new callback
    result.current('test2');

    act(() => {
      vi.advanceTimersByTime(500);
    });

    // cb2 should have been called, not cb1
    expect(cb1).not.toHaveBeenCalled();
    expect(cb2).toHaveBeenCalledWith('test2');
  });

  it('cleanup on unmount clears the timer', () => {
    const cb = vi.fn();
    const { result, unmount } = renderHook(() => useDebouncedCallback(cb, 500));

    result.current('hello');

    // Unmount before timer fires
    unmount();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Callback should not have been called because timer was cleared
    expect(cb).not.toHaveBeenCalled();
  });

  it('works with no args callback', () => {
    const cb = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(cb, 500));

    result.current();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(cb).toHaveBeenCalled();
  });

  it('works with object args', () => {
    const cb = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(cb, 500));

    const obj = { key: 'value' };
    result.current(obj);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(cb).toHaveBeenCalledWith(obj);
  });

  it('works with numeric delay', () => {
    const cb = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(cb, 100));

    result.current('fast');

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(cb).toHaveBeenCalledWith('fast');
  });

  it('multiple callbacks fire at correct times', () => {
    const cb = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(cb, 300));

    // First call at time 0
    result.current('first');

    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Second call at time 200
    result.current('second');

    act(() => {
      vi.advanceTimersByTime(200); // time 400
    });

    // First call should not have fired (reset at 200)
    expect(cb).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(100); // time 500
    });

    // Second call fires
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith('second');
  });

  it('callback receives correct arguments from last call only', () => {
    const cb = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(cb, 200));

    result.current('arg1');
    result.current('arg2');
    result.current('arg3');

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith('arg3');
    expect(cb).not.toHaveBeenCalledWith('arg1');
    expect(cb).not.toHaveBeenCalledWith('arg2');
  });
});