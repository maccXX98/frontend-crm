import { describe, it, expect, vi, afterEach } from 'vitest';
import { createRestrictToContainer } from '@/features/kanban/utils/restrict-to-container';

function makeContainer(rect: {
  left: number;
  top: number;
  right: number;
  bottom: number;
}) {
  return {
    getBoundingClientRect: () => rect,
  } as unknown as HTMLElement;
}

function makeRect(rect: {
  left: number;
  top: number;
  right: number;
  bottom: number;
}) {
  return rect;
}

describe('createRestrictToContainer', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should return transform unchanged when getElement returns null', () => {
    const getElement = vi.fn(() => null);
    const modifier = createRestrictToContainer(getElement);
    const input = { x: 50, y: 50, scaleX: 1, scaleY: 1 };
    const result = modifier({ transform: input, draggingNodeRect: makeRect({ left: 0, top: 0, right: 100, bottom: 100 }), containerNodeRect: undefined });
    expect(result).toEqual(input);
  });

  it('should return transform unchanged when draggingNodeRect is undefined', () => {
    const getElement = vi.fn(() => makeContainer({ left: 0, top: 0, right: 200, bottom: 200 }));
    const modifier = createRestrictToContainer(getElement);
    const input = { x: 30, y: 30, scaleX: 1, scaleY: 1 };
    const result = modifier({ transform: input, draggingNodeRect: undefined, containerNodeRect: undefined });
    expect(result).toEqual(input);
  });

  it('should return transform unchanged when within container bounds', () => {
    // Container: { left: 0, top: 0, right: 200, bottom: 200 }
    // Dragging node: { left: 50, top: 50, right: 100, bottom: 100 }
    // minX = 0 - 50 = -50, maxX = 200 - 100 = 100
    // minY = 0 - 50 = -50, maxY = 200 - 100 = 100
    const getElement = vi.fn(() =>
      makeContainer({ left: 0, top: 0, right: 200, bottom: 200 })
    );
    const modifier = createRestrictToContainer(getElement);
    const input = { x: 30, y: 30, scaleX: 1, scaleY: 1 };
    const result = modifier({
      transform: input,
      draggingNodeRect: makeRect({ left: 50, top: 50, right: 100, bottom: 100 }),
      containerNodeRect: undefined,
    });
    expect(result).toEqual(input);
  });

  it('should clamp x and y when both exceed max bounds', () => {
    // Container: { left: 0, top: 0, right: 200, bottom: 200 }
    // Dragging node: { left: 50, top: 50, right: 100, bottom: 100 }
    // minX = -50, maxX = 100; minY = -50, maxY = 100
    const getElement = vi.fn(() =>
      makeContainer({ left: 0, top: 0, right: 200, bottom: 200 })
    );
    const modifier = createRestrictToContainer(getElement);
    // x: 200 exceeds maxX=100, y: 200 exceeds maxY=100
    const result = modifier({
      transform: { x: 200, y: 200, scaleX: 1, scaleY: 1 },
      draggingNodeRect: makeRect({ left: 50, top: 50, right: 100, bottom: 100 }),
      containerNodeRect: undefined,
    });
    expect(result.x).toBe(100);
    expect(result.y).toBe(100);
    expect(result.scaleX).toBe(1);
    expect(result.scaleY).toBe(1);
  });

  it('should clamp x and y when both exceed min bounds', () => {
    // minX = -50, minY = -50
    const getElement = vi.fn(() =>
      makeContainer({ left: 0, top: 0, right: 200, bottom: 200 })
    );
    const modifier = createRestrictToContainer(getElement);
    // x: -200 below minX=-50, y: -200 below minY=-50
    const result = modifier({
      transform: { x: -200, y: -200, scaleX: 1, scaleY: 1 },
      draggingNodeRect: makeRect({ left: 50, top: 50, right: 100, bottom: 100 }),
      containerNodeRect: undefined,
    });
    expect(result.x).toBe(-50);
    expect(result.y).toBe(-50);
    expect(result.scaleX).toBe(1);
    expect(result.scaleY).toBe(1);
  });

  it('should clamp only x when only x exceeds max', () => {
    // minX = -50, maxX = 100; minY = -50, maxY = 100
    const getElement = vi.fn(() =>
      makeContainer({ left: 0, top: 0, right: 200, bottom: 200 })
    );
    const modifier = createRestrictToContainer(getElement);
    // x: 200 exceeds maxX=100, y: 30 is within bounds [-50, 100]
    const result = modifier({
      transform: { x: 200, y: 30, scaleX: 1, scaleY: 1 },
      draggingNodeRect: makeRect({ left: 50, top: 50, right: 100, bottom: 100 }),
      containerNodeRect: undefined,
    });
    expect(result.x).toBe(100); // x clamped
    expect(result.y).toBe(30); // y unchanged (within bounds)
    expect(result.scaleX).toBe(1);
    expect(result.scaleY).toBe(1);
  });

  it('should clamp only y when only y exceeds max', () => {
    // minX = -50, maxX = 100; minY = -50, maxY = 100
    const getElement = vi.fn(() =>
      makeContainer({ left: 0, top: 0, right: 200, bottom: 200 })
    );
    const modifier = createRestrictToContainer(getElement);
    // x: 30 within bounds [-50, 100], y: 200 exceeds maxY=100
    const result = modifier({
      transform: { x: 30, y: 200, scaleX: 1, scaleY: 1 },
      draggingNodeRect: makeRect({ left: 50, top: 50, right: 100, bottom: 100 }),
      containerNodeRect: undefined,
    });
    expect(result.x).toBe(30); // x unchanged (within bounds)
    expect(result.y).toBe(100); // y clamped to maxY
    expect(result.scaleX).toBe(1);
    expect(result.scaleY).toBe(1);
  });

  it('should preserve scaleX and scaleY when clamping x/y', () => {
    const getElement = vi.fn(() =>
      makeContainer({ left: 0, top: 0, right: 200, bottom: 200 })
    );
    const modifier = createRestrictToContainer(getElement);
    // Input with non-default scale values + out-of-bounds x/y
    const result = modifier({
      transform: { x: 300, y: -200, scaleX: 2, scaleY: 3 },
      draggingNodeRect: makeRect({ left: 50, top: 50, right: 100, bottom: 100 }),
      containerNodeRect: undefined,
    });
    expect(result.scaleX).toBe(2);
    expect(result.scaleY).toBe(3);
    expect(result.x).toBe(100); // clamped to maxX
    expect(result.y).toBe(-50); // clamped to minY
  });

  it('should handle different container position at (100,100) to (300,300)', () => {
    // Container at { left: 100, top: 100, right: 300, bottom: 300 }
    // Dragging at { left: 0, top: 0, right: 50, bottom: 50 }
    // minX = 100 - 0 = 100, maxX = 300 - 50 = 250
    // minY = 100 - 0 = 100, maxY = 300 - 50 = 250
    const getElement = vi.fn(() =>
      makeContainer({ left: 100, top: 100, right: 300, bottom: 300 })
    );
    const modifier = createRestrictToContainer(getElement);
    // x: 150, y: 150 — within bounds (100 <= 150 <= 250, 100 <= 150 <= 250)
    const result = modifier({
      transform: { x: 150, y: 150, scaleX: 1, scaleY: 1 },
      draggingNodeRect: makeRect({ left: 0, top: 0, right: 50, bottom: 50 }),
      containerNodeRect: undefined,
    });
    expect(result).toEqual({ x: 150, y: 150, scaleX: 1, scaleY: 1 });
  });

  it('should clamp when transform is below min bounds in offset container', () => {
    // minX = 100, maxX = 250; minY = 100, maxY = 250
    const getElement = vi.fn(() =>
      makeContainer({ left: 100, top: 100, right: 300, bottom: 300 })
    );
    const modifier = createRestrictToContainer(getElement);
    // x: 50, y: 50 — below min (100)
    const result = modifier({
      transform: { x: 50, y: 50, scaleX: 1, scaleY: 1 },
      draggingNodeRect: makeRect({ left: 0, top: 0, right: 50, bottom: 50 }),
      containerNodeRect: undefined,
    });
    expect(result.x).toBe(100);
    expect(result.y).toBe(100);
  });

  it('should handle dragging node wider than container width', () => {
    // Container: { left: 0, top: 0, right: 100, bottom: 200 }
    // Dragging: { left: 0, top: 50, right: 200, bottom: 150 }
    // minX = 0 - 0 = 0, maxX = 100 - 200 = -100
    const getElement = vi.fn(() =>
      makeContainer({ left: 0, top: 0, right: 100, bottom: 200 })
    );
    const modifier = createRestrictToContainer(getElement);
    const result = modifier({
      transform: { x: 0, y: 0, scaleX: 1, scaleY: 1 },
      draggingNodeRect: makeRect({ left: 0, top: 50, right: 200, bottom: 150 }),
      containerNodeRect: undefined,
    });
    // x: Math.min(Math.max(0, 0), -100) = -100
    expect(result.x).toBe(-100);
  });
});