/** Areas of a photo to analyse, as fractions of the photo (0..1). Pure, so the worker and the page share it. */

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Smallest box worth analysing, as a fraction of either side. Smaller drags are taken as clicks. */
export const MIN_SIDE = 0.03;

/** Flip a box dragged up or left so w and h are positive, and clamp it to the photo. Null when too small. */
export function normaliseBox(b: Box): Box | null {
  let { x, y, w, h } = b;
  if (w < 0) [x, w] = [x + w, -w];
  if (h < 0) [y, h] = [y + h, -h];
  const x0 = Math.max(0, Math.min(1, x));
  const y0 = Math.max(0, Math.min(1, y));
  const x1 = Math.max(0, Math.min(1, x + w));
  const y1 = Math.max(0, Math.min(1, y + h));
  if (x1 - x0 < MIN_SIDE || y1 - y0 < MIN_SIDE) return null;
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/** The box dragged between two client points, over an element's bounding rectangle. */
export function dragBox(
  from: { x: number; y: number },
  to: { x: number; y: number },
  rect: { left: number; top: number; width: number; height: number },
): Box {
  const fx = (v: number) => (v - rect.left) / rect.width;
  const fy = (v: number) => (v - rect.top) / rect.height;
  return { x: fx(from.x), y: fy(from.y), w: fx(to.x) - fx(from.x), h: fy(to.y) - fy(from.y) };
}

/** The pixel rectangle of a box in an image of the given size. The whole image without one. */
export function cropRect(width: number, height: number, box?: Box | null): { x: number; y: number; w: number; h: number } {
  if (!box) return { x: 0, y: 0, w: width, h: height };
  const x = Math.round(box.x * width);
  const y = Math.round(box.y * height);
  return {
    x,
    y,
    w: Math.max(1, Math.min(width - x, Math.round(box.w * width))),
    h: Math.max(1, Math.min(height - y, Math.round(box.h * height))),
  };
}

/** CSS position for a box drawn over the photo, in percent. */
export function boxStyle(b: Box): string {
  const p = (v: number) => `${(v * 100).toFixed(2)}%`;
  return `left:${p(b.x)};top:${p(b.y)};width:${p(b.w)};height:${p(b.h)}`;
}

/** Keyboard editing: arrows move the box, shift+arrows resize it. Steps are 2% of the photo. */
export function nudgeBox(b: Box, key: string, resize: boolean): Box {
  const s = 0.02;
  const d = { ArrowLeft: [-s, 0], ArrowRight: [s, 0], ArrowUp: [0, -s], ArrowDown: [0, s] }[key];
  if (!d) return b;
  const [dx, dy] = d as [number, number];
  if (resize) {
    const w = Math.max(MIN_SIDE, Math.min(1 - b.x, b.w + dx));
    const h = Math.max(MIN_SIDE, Math.min(1 - b.y, b.h + dy));
    return { ...b, w, h };
  }
  return { ...b, x: Math.max(0, Math.min(1 - b.w, b.x + dx)), y: Math.max(0, Math.min(1 - b.h, b.y + dy)) };
}

/** A centred starting box for keyboard users: the middle 60% of the photo. */
export const DEFAULT_BOX: Box = { x: 0.2, y: 0.2, w: 0.6, h: 0.6 };
