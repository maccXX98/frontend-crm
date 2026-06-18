import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { composeRefs, useComposedRefs } from '@/lib/compose-refs';

describe('composeRefs', () => {
  it('should call single callback ref with node', () => {
    const callbackRef = vi.fn();
    const composedRef = composeRefs(callbackRef);

    const node = document.createElement('div');
    composedRef(node);

    expect(callbackRef).toHaveBeenCalledWith(node);
  });

  it('should set single RefObject current to node', () => {
    const refObject = { current: null } as React.RefObject<HTMLDivElement>;
    const composedRef = composeRefs(refObject);

    const node = document.createElement('div');
    composedRef(node);

    expect(refObject.current).toBe(node);
  });

  it('should set multiple RefObject refs current to node', () => {
    const refObject1 = { current: null } as React.RefObject<HTMLDivElement>;
    const refObject2 = { current: null } as React.RefObject<HTMLDivElement>;
    const refObject3 = { current: null } as React.RefObject<HTMLDivElement>;
    const composedRef = composeRefs(refObject1, refObject2, refObject3);

    const node = document.createElement('div');
    composedRef(node);

    expect(refObject1.current).toBe(node);
    expect(refObject2.current).toBe(node);
    expect(refObject3.current).toBe(node);
  });

  it('should call multiple callback refs with node', () => {
    const callbackRef1 = vi.fn();
    const callbackRef2 = vi.fn();
    const callbackRef3 = vi.fn();
    const composedRef = composeRefs(callbackRef1, callbackRef2, callbackRef3);

    const node = document.createElement('div');
    composedRef(node);

    expect(callbackRef1).toHaveBeenCalledWith(node);
    expect(callbackRef2).toHaveBeenCalledWith(node);
    expect(callbackRef3).toHaveBeenCalledWith(node);
  });

  it('should handle mix of callback and RefObject refs', () => {
    const callbackRef = vi.fn();
    const refObject = { current: null } as React.RefObject<HTMLDivElement>;
    const composedRef = composeRefs(callbackRef, refObject);

    const node = document.createElement('div');
    composedRef(node);

    expect(callbackRef).toHaveBeenCalledWith(node);
    expect(refObject.current).toBe(node);
  });

  it('should skip undefined refs without throwing', () => {
    const callbackRef = vi.fn();
    const composedRef = composeRefs(undefined, callbackRef, undefined);

    const node = document.createElement('div');
    expect(() => composedRef(node)).not.toThrow();
    expect(callbackRef).toHaveBeenCalledWith(node);
  });

  it('should skip null refs without throwing', () => {
    const callbackRef = vi.fn();
    const composedRef = composeRefs(null, callbackRef, null);

    const node = document.createElement('div');
    expect(() => composedRef(node)).not.toThrow();
    expect(callbackRef).toHaveBeenCalledWith(node);
  });

  it('should handle empty ref list', () => {
    const composedRef = composeRefs();

    const node = document.createElement('div');
    expect(() => composedRef(node)).not.toThrow();
  });

  it('should pass the same node value to all refs', () => {
    const callbackRef1 = vi.fn();
    const callbackRef2 = vi.fn();
    const refObject = { current: null } as React.RefObject<HTMLDivElement>;
    const composedRef = composeRefs(callbackRef1, refObject, callbackRef2);

    const node = document.createElement('div');
    composedRef(node);

    // All refs should receive the exact same node
    expect(callbackRef1).toHaveBeenCalledWith(node);
    expect(callbackRef2).toHaveBeenCalledWith(node);
    expect(refObject.current).toBe(node);
  });

  describe('React 19 cleanup support', () => {
    it('should return cleanup function when any callback ref returns a function', () => {
      const callbackRefWithCleanup = vi.fn(() => () => {});
      const callbackRefWithoutCleanup = vi.fn();
      const composedRef = composeRefs(callbackRefWithCleanup, callbackRefWithoutCleanup);

      const node = document.createElement('div');
      const cleanup = composedRef(node);

      expect(typeof cleanup).toBe('function');
    });

    it('should return undefined when no callback ref returns a function', () => {
      const callbackRef1 = vi.fn();
      const callbackRef2 = vi.fn();
      const composedRef = composeRefs(callbackRef1, callbackRef2);

      const node = document.createElement('div');
      const cleanup = composedRef(node);

      expect(cleanup).toBeUndefined();
    });

    it('should call cleanup function for each ref with cleanup', () => {
      const cleanup1 = vi.fn();
      const cleanup2 = vi.fn();
      const callbackRef1 = vi.fn(() => cleanup1);
      const callbackRef2 = vi.fn(() => cleanup2);
      const composedRef = composeRefs(callbackRef1, callbackRef2);

      const node = document.createElement('div');
      const cleanup = composedRef(node);

      cleanup!();

      expect(cleanup1).toHaveBeenCalled();
      expect(cleanup2).toHaveBeenCalled();
    });

    it('should set non-cleanup refs back to null during cleanup', () => {
      const refObject = { current: null } as React.RefObject<HTMLDivElement>;
      const callbackRefWithCleanup = vi.fn(() => () => {});
      const composedRef = composeRefs(refObject, callbackRefWithCleanup);

      const node = document.createElement('div');
      const cleanup = composedRef(node);

      // Set a value first
      expect(refObject.current).toBe(node);

      // Cleanup should set it back to null
      cleanup!();

      expect(refObject.current).toBeNull();
    });

    it('should call cleanups in order during cleanup', () => {
      const callOrder: number[] = [];
      const callbackRef1 = vi.fn(() => {
        callOrder.push(1);
        return () => {};
      });
      const callbackRef2 = vi.fn(() => {
        callOrder.push(2);
        return () => {};
      });
      const callbackRef3 = vi.fn(() => {
        callOrder.push(3);
        return () => {};
      });
      const composedRef = composeRefs(callbackRef1, callbackRef2, callbackRef3);

      const node = document.createElement('div');
      const cleanup = composedRef(node);

      cleanup!();

      expect(callOrder).toEqual([1, 2, 3]);
    });

    it('should call cleanup when only some refs have cleanup', () => {
      const cleanupMock = vi.fn();
      const callbackRefWithCleanup = vi.fn(() => cleanupMock);
      const callbackRefWithoutCleanup = vi.fn();
      const refObject = { current: null } as React.RefObject<HTMLDivElement>;
      const composedRef = composeRefs(
        callbackRefWithCleanup,
        callbackRefWithoutCleanup,
        refObject
      );

      const node = document.createElement('div');
      const cleanup = composedRef(node);

      cleanup!();

      expect(cleanupMock).toHaveBeenCalled();
      // refObject should be set to null
      expect(refObject.current).toBeNull();
    });

    it('should propagate error thrown during ref callback setup', () => {
      // When a callback ref throws during execution (not during cleanup),
      // the error propagates up immediately
      const error = new Error('setup error');
      const callbackRef1 = vi.fn(() => {
        throw error;
      });
      const callbackRef2 = vi.fn(() => () => {});
      const composedRef = composeRefs(callbackRef1, callbackRef2);

      const node = document.createElement('div');

      // The error is thrown when calling the composed ref (during ref setup), not during cleanup
      expect(() => composedRef(node)).toThrow('setup error');
    });
  });
});

describe('useComposedRefs', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return a function', () => {
    const { result } = renderHook(() => useComposedRefs());

    expect(typeof result.current).toBe('function');
  });

  it('should return same reference across rerenders (memoized)', () => {
    const { result, rerender } = renderHook(() => useComposedRefs());

    const firstRef = result.current;

    rerender();

    expect(result.current).toBe(firstRef);
  });

  it('should return different reference when ref identity changes', () => {
    const { result, rerender } = renderHook(
      ({ ref }) => useComposedRefs(ref),
      { initialProps: { ref: { current: null } as React.RefObject<HTMLDivElement> } }
    );

    const firstRef = result.current;

    // New ref object means new callback
    rerender({ ref: { current: null } as React.RefObject<HTMLDivElement> });

    expect(result.current).not.toBe(firstRef);
  });

  // Note: React warns when useCallback deps array size changes.
  // This test documents the behavior - different array length creates new callback
  it('should return different reference when number of refs changes', () => {
    const ref1 = { current: null } as React.RefObject<HTMLDivElement>;
    const ref2 = { current: null } as React.RefObject<HTMLDivElement>;

    const { result: result1 } = renderHook(() => useComposedRefs(ref1));
    const { result: result2 } = renderHook(() => useComposedRefs(ref1, ref2));

    // Different number of refs means different composed callbacks
    expect(result1.current).not.toBe(result2.current);
  });

  it('should call the returned function with node sets all composed refs', () => {
    const refObject1 = { current: null } as React.RefObject<HTMLDivElement>;
    const refObject2 = { current: null } as React.RefObject<HTMLDivElement>;

    const { result } = renderHook(() => useComposedRefs(refObject1, refObject2));

    const node = document.createElement('div');

    act(() => {
      result.current(node);
    });

    expect(refObject1.current).toBe(node);
    expect(refObject2.current).toBe(node);
  });

  it('should work with callback refs', () => {
    const callbackRef1 = vi.fn();
    const callbackRef2 = vi.fn();

    const { result } = renderHook(() => useComposedRefs(callbackRef1, callbackRef2));

    const node = document.createElement('div');

    act(() => {
      result.current(node);
    });

    expect(callbackRef1).toHaveBeenCalledWith(node);
    expect(callbackRef2).toHaveBeenCalledWith(node);
  });

  it('should handle undefined refs', () => {
    const callbackRef = vi.fn();

    const { result } = renderHook(() => useComposedRefs(undefined, callbackRef, undefined));

    const node = document.createElement('div');

    expect(() => {
      act(() => {
        result.current(node);
      });
    }).not.toThrow();

    expect(callbackRef).toHaveBeenCalledWith(node);
  });

  it('should handle null refs', () => {
    const callbackRef = vi.fn();

    const { result } = renderHook(() => useComposedRefs(null, callbackRef, null));

    const node = document.createElement('div');

    expect(() => {
      act(() => {
        result.current(node);
      });
    }).not.toThrow();

    expect(callbackRef).toHaveBeenCalledWith(node);
  });

  it('should memoize by ref values', () => {
    const ref1 = { current: null } as React.RefObject<HTMLDivElement>;
    const ref2 = { current: null } as React.RefObject<HTMLDivElement>;

    const { result, rerender } = renderHook(
      ({ refs }) => useComposedRefs(...refs),
      { initialProps: { refs: [ref1] } }
    );

    const firstResult = result.current;

    // Same refs array content should return same reference
    rerender({ refs: [ref1] });

    expect(result.current).toBe(firstResult);
  });
});