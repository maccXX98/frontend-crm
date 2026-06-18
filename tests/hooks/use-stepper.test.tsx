import { act, renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import { z } from 'zod';
import { useFormStepper } from '@/hooks/use-stepper';

// Mock TanStack Form
function makeForm(values: any, handleSubmit = vi.fn()) {
  return {
    state: { values },
    handleSubmit
  };
}

describe('useFormStepper', () => {
  // Define schemas for multi-step form
  const schema1 = z.object({
    firstName: z.string().min(1, 'First name is required')
  });
  const schema2 = z.object({
    lastName: z.string().min(1, 'Last name is required')
  });
  const schema3 = z.object({
    email: z.string().email('Invalid email')
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // Initial state
  // ============================================
  describe('Initial state', () => {
    it('currentStep starts at 1', () => {
      const { result } = renderHook(() => useFormStepper([schema1, schema2, schema3]));
      expect(result.current.currentStep).toBe(1);
    });

    it('isFirstStep is true on first step', () => {
      const { result } = renderHook(() => useFormStepper([schema1, schema2, schema3]));
      expect(result.current.isFirstStep).toBe(true);
    });

    it('currentValidator is schemas[0] on first step', () => {
      const { result } = renderHook(() => useFormStepper([schema1, schema2, schema3]));
      expect(result.current.currentValidator).toBe(schema1);
    });

    it('step.value = 1, step.count = schemas.length', () => {
      const { result } = renderHook(() => useFormStepper([schema1, schema2, schema3]));
      expect(result.current.step.value).toBe(1);
      expect(result.current.step.count).toBe(3);
    });

    it('step.isCompleted is false when not on last step', () => {
      const { result } = renderHook(() => useFormStepper([schema1, schema2, schema3]));
      expect(result.current.step.isCompleted).toBe(false);
    });

    it('step.isCompleted is true when on last step', () => {
      const { result } = renderHook(() => useFormStepper([schema1]));
      expect(result.current.step.isCompleted).toBe(true);
    });
  });

  // ============================================
  // goToNextStep / goToPrevStep
  // ============================================
  describe('goToNextStep / goToPrevStep', () => {
    it('goToNextStep increments by 1', () => {
      const { result } = renderHook(() => useFormStepper([schema1, schema2, schema3]));

      act(() => {
        result.current.step.goToNextStep();
      });

      expect(result.current.currentStep).toBe(2);
    });

    it('goToNextStep at last step stays at last step (clamping)', () => {
      const { result } = renderHook(() => useFormStepper([schema1]));

      act(() => {
        result.current.step.goToNextStep();
      });

      expect(result.current.currentStep).toBe(1);
    });

    it('goToPrevStep decrements by 1', () => {
      const { result } = renderHook(() => useFormStepper([schema1, schema2, schema3]));

      // First go to step 2
      act(() => {
        result.current.step.goToNextStep();
      });

      // Then go back
      act(() => {
        result.current.step.goToPrevStep();
      });

      expect(result.current.currentStep).toBe(1);
    });

    it('goToPrevStep at step 1 stays at 1 (clamping)', () => {
      const { result } = renderHook(() => useFormStepper([schema1, schema2, schema3]));

      act(() => {
        result.current.step.goToPrevStep();
      });

      expect(result.current.currentStep).toBe(1);
    });

    it('after advancing to last step, step.isCompleted is true', () => {
      const { result } = renderHook(() => useFormStepper([schema1, schema2, schema3]));

      // Go to step 2
      act(() => {
        result.current.step.goToNextStep();
      });
      expect(result.current.step.isCompleted).toBe(false);

      // Go to step 3 (last)
      act(() => {
        result.current.step.goToNextStep();
      });
      expect(result.current.step.isCompleted).toBe(true);
    });
  });

  // ============================================
  // triggerFormGroup
  // ============================================
  describe('triggerFormGroup', () => {
    it('returns success when form.state.values matches current validator', async () => {
      const { result } = renderHook(() => useFormStepper([schema1, schema2, schema3]));
      const form = makeForm({ firstName: 'John' });

      const triggerResult = await result.current.triggerFormGroup(form);

      expect(triggerResult.success).toBe(true);
    });

    it('returns failure when validation fails', async () => {
      const { result } = renderHook(() => useFormStepper([schema1, schema2, schema3]));
      const form = makeForm({ firstName: '' }); // Empty string fails validation

      const triggerResult = await result.current.triggerFormGroup(form);

      expect(triggerResult.success).toBe(false);
    });

    it('on failure calls form.handleSubmit with step info', async () => {
      const handleSubmit = vi.fn();
      const { result } = renderHook(() => useFormStepper([schema1, schema2, schema3]));
      const form = makeForm({ firstName: '' }, handleSubmit);

      await result.current.triggerFormGroup(form);

      expect(handleSubmit).toHaveBeenCalledWith({ step: '1' });
    });

    it('on success does NOT call form.handleSubmit', async () => {
      const handleSubmit = vi.fn();
      const { result } = renderHook(() => useFormStepper([schema1, schema2, schema3]));
      const form = makeForm({ firstName: 'John' }, handleSubmit);

      await result.current.triggerFormGroup(form);

      expect(handleSubmit).not.toHaveBeenCalled();
    });

    it('validates against CURRENT step schema, not all schemas', async () => {
      const { result } = renderHook(() => useFormStepper([schema1, schema2, schema3]));

      // Go to step 2
      act(() => {
        result.current.step.goToNextStep();
      });
      // Need to rerender to pick up new step state
      result.current.currentStep; // access to trigger potential re-render

      // Step 2 expects lastName
      const form = makeForm({ lastName: 'Doe' });
      const triggerResult = await result.current.triggerFormGroup(form);

      expect(triggerResult.success).toBe(true);
    });
  });

  // ============================================
  // handleNextStepOrSubmit
  // ============================================
  describe('handleNextStepOrSubmit', () => {
    it('validation fails returns early, currentStep unchanged', async () => {
      const { result } = renderHook(() => useFormStepper([schema1, schema2, schema3]));
      const form = makeForm({ firstName: '' }); // Invalid

      await act(async () => {
        await result.current.handleNextStepOrSubmit(form);
      });

      expect(result.current.currentStep).toBe(1);
    });

    it('validation succeeds + not last step calls goToNextStep', async () => {
      const { result, rerender } = renderHook(() => useFormStepper([schema1, schema2, schema3]));
      const form = makeForm({ firstName: 'John' });

      await act(async () => {
        await result.current.handleNextStepOrSubmit(form);
      });

      // After async operation, rerender to get updated state
      rerender();

      // Step should have advanced to 2
      expect(result.current.currentStep).toBe(2);
    });

    it('validation succeeds + last step calls form.handleSubmit', async () => {
      const handleSubmit = vi.fn();
      const { result, rerender } = renderHook(() => useFormStepper([schema1, schema2, schema3]));

      // Go to last step
      act(() => {
        result.current.step.goToNextStep();
      });
      act(() => {
        result.current.step.goToNextStep();
      });

      const form = makeForm({ email: 'john@example.com' }, handleSubmit);

      await act(async () => {
        await result.current.handleNextStepOrSubmit(form);
      });

      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  // ============================================
  // handleCancelOrBack
  // ============================================
  describe('handleCancelOrBack', () => {
    it('on first step + no opts calls onCancel', () => {
      const onCancel = vi.fn();
      const { result } = renderHook(() => useFormStepper([schema1, schema2, schema3]));

      result.current.handleCancelOrBack({ onCancel });

      expect(onCancel).toHaveBeenCalled();
    });

    it('on first step + opts with onCancel calls onCancel', () => {
      const onCancel = vi.fn();
      const onBack = vi.fn();
      const { result } = renderHook(() => useFormStepper([schema1, schema2, schema3]));

      result.current.handleCancelOrBack({ onCancel, onBack });

      expect(onCancel).toHaveBeenCalled();
      expect(onBack).not.toHaveBeenCalled();
    });

    it('middle step + opts with onBack calls onBack AND goes to previous step', () => {
      const onBack = vi.fn();
      const { result, rerender } = renderHook(() => useFormStepper([schema1, schema2, schema3]));

      // Go to step 2
      act(() => {
        result.current.step.goToNextStep();
      });
      rerender();

      act(() => {
        result.current.handleCancelOrBack({ onBack });
      });
      rerender();

      expect(onBack).toHaveBeenCalled();
      expect(result.current.currentStep).toBe(1);
    });

    it('middle step + no opts just goes to previous step', () => {
      const { result, rerender } = renderHook(() => useFormStepper([schema1, schema2, schema3]));

      // Go to step 2
      act(() => {
        result.current.step.goToNextStep();
      });
      rerender();

      act(() => {
        result.current.handleCancelOrBack();
      });
      rerender();

      expect(result.current.currentStep).toBe(1);
    });

    it('last step (step.isCompleted=true) calls onCancel', () => {
      const onCancel = vi.fn();
      const { result } = renderHook(() => useFormStepper([schema1]));

      result.current.handleCancelOrBack({ onCancel });

      expect(onCancel).toHaveBeenCalled();
    });
  });

  // ============================================
  // Single step edge case
  // ============================================
  describe('Single step behavior', () => {
    it('with single schema, step.isCompleted is true from start', () => {
      const { result } = renderHook(() => useFormStepper([schema1]));
      expect(result.current.step.isCompleted).toBe(true);
    });

    it('with single schema, triggerFormGroup validates correctly', async () => {
      const { result } = renderHook(() => useFormStepper([schema1]));
      const form = makeForm({ firstName: 'John' });

      const triggerResult = await result.current.triggerFormGroup(form);
      expect(triggerResult.success).toBe(true);
    });

    it('with single schema, handleNextStepOrSubmit calls form.handleSubmit', async () => {
      const handleSubmit = vi.fn();
      const { result } = renderHook(() => useFormStepper([schema1]));
      const form = makeForm({ firstName: 'John' }, handleSubmit);

      await act(async () => {
        await result.current.handleNextStepOrSubmit(form);
      });

      expect(handleSubmit).toHaveBeenCalled();
    });
  });
});