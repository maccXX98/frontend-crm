import { act, renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import { useControllableState } from '@/hooks/use-controllable-state';

describe('useControllableState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // Uncontrolled mode (no prop)
  // ============================================
  describe('Uncontrolled mode (no prop)', () => {
    it('initial value is defaultProp when provided', () => {
      const { result } = renderHook(() =>
        useControllableState({ defaultProp: 'initial', onChange: vi.fn() })
      );

      expect(result.current[0]).toBe('initial');
    });

    it('initial value is undefined when no defaultProp', () => {
      const { result } = renderHook(() =>
        useControllableState({ onChange: vi.fn() })
      );

      expect(result.current[0]).toBe(undefined);
    });

    it('setValue(newValue) updates the value', () => {
      const { result } = renderHook(() =>
        useControllableState({ defaultProp: 'initial', onChange: vi.fn() })
      );

      act(() => {
        result.current[1]('updated');
      });

      expect(result.current[0]).toBe('updated');
    });

    it('setValue triggers onChange with new value', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useControllableState({ defaultProp: 'initial', onChange })
      );

      act(() => {
        result.current[1]('updated');
      });

      expect(onChange).toHaveBeenCalledWith('updated');
    });

    it('setValue does NOT trigger onChange when value is the same (referentially)', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useControllableState({ defaultProp: 'initial', onChange })
      );

      // Set to same value
      act(() => {
        result.current[1]('initial');
      });

      // onChange should not be called when value doesn't change
      expect(onChange).not.toHaveBeenCalled();
    });

    it('functional setValue works correctly', () => {
      const { result } = renderHook(() =>
        useControllableState({ defaultProp: 0, onChange: vi.fn() })
      );

      act(() => {
        result.current[1]((prev: number) => prev + 1);
      });

      expect(result.current[0]).toBe(1);
    });

    it('functional setValue receives current value', () => {
      const { result } = renderHook(() =>
        useControllableState({ defaultProp: 10, onChange: vi.fn() })
      );

      act(() => {
        result.current[1]((prev: number) => prev * 2);
      });

      expect(result.current[0]).toBe(20);
    });
  });

  // ============================================
  // Controlled mode (with prop)
  // ============================================
  describe('Controlled mode (with prop)', () => {
    it('value is the controlled prop, not internal state', () => {
      const { result } = renderHook(() =>
        useControllableState({ prop: 'controlled', defaultProp: 'default', onChange: vi.fn() })
      );

      expect(result.current[0]).toBe('controlled');
    });

    it('setValue does NOT update internal state when controlled', () => {
      const { result } = renderHook(() =>
        useControllableState({ prop: 'controlled', defaultProp: 'default', onChange: vi.fn() })
      );

      act(() => {
        result.current[1]('should not change');
      });

      // Value should still be the controlled prop
      expect(result.current[0]).toBe('controlled');
    });

    it('setValue triggers onChange with new value', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useControllableState({ prop: 'controlled', onChange })
      );

      act(() => {
        result.current[1]('new value');
      });

      expect(onChange).toHaveBeenCalledWith('new value');
    });

    it('setValue skips onChange when new value equals prop', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useControllableState({ prop: 'controlled', onChange })
      );

      // Try to set to same value as prop
      act(() => {
        result.current[1]('controlled');
      });

      expect(onChange).not.toHaveBeenCalled();
    });

    it('controlled with functional setValue calls onChange with computed value', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useControllableState({ prop: 5, onChange })
      );

      act(() => {
        result.current[1]((prev: number) => prev + 1);
      });

      expect(onChange).toHaveBeenCalledWith(6);
    });
  });

  // ============================================
  // Both modes
  // ============================================
  describe('Both modes', () => {
    it('returns tuple of [value, setValue]', () => {
      const { result } = renderHook(() =>
        useControllableState({ defaultProp: 'initial', onChange: vi.fn() })
      );

      expect(result.current).toHaveLength(2);
      expect(result.current[0]).toBeDefined();
      expect(typeof result.current[1]).toBe('function');
    });

    it('setValue reference may change (uses useCallback)', () => {
      const { result, rerender } = renderHook(() =>
        useControllableState({ defaultProp: 'initial', onChange: vi.fn() })
      );

      const setValue1 = result.current[1];

      // Rerender with same props
      rerender();

      const setValue2 = result.current[1];

      // setValue might or might not be the same reference depending on deps
      // This is implementation detail - just verify it still works
      act(() => {
        setValue2('updated');
      });

      expect(result.current[0]).toBe('updated');
    });
  });

  // ============================================
  // Edge cases
  // ============================================
  describe('Edge cases', () => {
    it('handles undefined prop in controlled mode', () => {
      const { result } = renderHook(() =>
        useControllableState({ prop: undefined, defaultProp: 'default', onChange: vi.fn() })
      );

      // When prop is undefined, it falls back to uncontrolled behavior
      expect(result.current[0]).toBe('default');
    });

    it('handles null as valid value', () => {
      const { result } = renderHook(() =>
        useControllableState({ defaultProp: null, onChange: vi.fn() })
      );

      expect(result.current[0]).toBe(null);

      act(() => {
        result.current[1]('not null');
      });

      expect(result.current[0]).toBe('not null');
    });

    it('handles object values correctly', () => {
      const obj = { key: 'value' };
      const { result } = renderHook(() =>
        useControllableState({ defaultProp: obj, onChange: vi.fn() })
      );

      expect(result.current[0]).toBe(obj);

      const newObj = { key: 'new value' };
      act(() => {
        result.current[1](newObj);
      });

      expect(result.current[0]).toBe(newObj);
    });

    it('onChange is called with correct value type', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useControllableState<number>({ defaultProp: 42, onChange })
      );

      act(() => {
        result.current[1](100);
      });

      expect(onChange).toHaveBeenCalledWith(expect.any(Number));
      expect(onChange).toHaveBeenCalledWith(100);
    });
  });
});