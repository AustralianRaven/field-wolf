import { describe, expect, it } from 'vitest';

import { cropRect, dragBox, normaliseBox, nudgeBox } from './region.ts';

describe('region', () => {
  it.each([
    ['a box dragged down-right', { x: 0.1, y: 0.1, w: 0.5, h: 0.4 }, { x: 0.1, y: 0.1, w: 0.5, h: 0.4 }],
    ['a box dragged up-left', { x: 0.6, y: 0.5, w: -0.5, h: -0.4 }, { x: 0.1, y: 0.1, w: 0.5, h: 0.4 }],
    ['a box past the edge', { x: 0.8, y: 0.8, w: 0.5, h: 0.5 }, { x: 0.8, y: 0.8, w: 0.2, h: 0.2 }],
  ])('Given %s, when normalised, then it is positive and inside the photo', (_, input, expected) => {
    const b = normaliseBox(input);
    expect(b, 'box should survive normalising').not.toBeNull();
    for (const k of ['x', 'y', 'w', 'h'] as const) expect(b![k], `${k} should match`).toBeCloseTo(expected[k]);
  });

  it('Given a tiny drag, when normalised, then it is ignored as a click', () => {
    expect(normaliseBox({ x: 0.5, y: 0.5, w: 0.01, h: 0.01 })).toBeNull();
  });

  it('Given a drag over a 200x100 element, when converted, then the box is in fractions', () => {
    const b = dragBox({ x: 60, y: 30 }, { x: 160, y: 80 }, { left: 10, top: 10, width: 200, height: 100 });
    const expected = { x: 0.25, y: 0.2, w: 0.5, h: 0.5 };
    for (const k of ['x', 'y', 'w', 'h'] as const) expect(b[k], `${k} should match`).toBeCloseTo(expected[k]);
  });

  it('Given a box and a 1000x500 photo, when cropped, then the pixel rectangle matches', () => {
    expect(cropRect(1000, 500, { x: 0.1, y: 0.2, w: 0.5, h: 0.5 })).toEqual({ x: 100, y: 100, w: 500, h: 250 });
    expect(cropRect(1000, 500, null), 'no box means the whole photo').toEqual({ x: 0, y: 0, w: 1000, h: 500 });
  });

  it('Given a box at the right edge, when nudged right, then it stays inside', () => {
    expect(nudgeBox({ x: 0.5, y: 0, w: 0.5, h: 0.5 }, 'ArrowRight', false).x).toBe(0.5);
    expect(nudgeBox({ x: 0, y: 0, w: 0.5, h: 0.5 }, 'ArrowDown', true).h, 'shift+down should grow the box').toBeCloseTo(0.52);
  });
});
