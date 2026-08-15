import { BOT, NECK, R, TOP } from "./hourglassConstants";

export interface GlassWidthPoint {
  h: number;
  w: number;
}

export const GLASS_HALF_WIDTH_LUT: readonly GlassWidthPoint[] = (() => {
  const points: GlassWidthPoint[] = [];
  const sampleCount = 220;
  for (let index = 0; index <= sampleCount; index += 1) {
    const t = index / sampleCount;
    const inverse = 1 - t;
    const y =
      TOP * inverse * inverse * inverse +
      3 * (TOP + 95) * t * inverse * inverse +
      3 * -55 * t * t * inverse;
    const x =
      -R * inverse * inverse * inverse +
      3 * -R * t * inverse * inverse +
      3 * -NECK * t * t * inverse +
      -NECK * t * t * t;
    points.push({ h: -y, w: -x });
  }
  points.sort((left, right) => left.h - right.h);
  return points;
})();

export function bulbHalfWidth(y: number): number {
  const height = Math.min(170, Math.max(0, Math.abs(y)));
  if (height <= 0) return NECK;
  if (height >= 170) return R;

  let lower = 0;
  let upper = GLASS_HALF_WIDTH_LUT.length - 1;
  while (lower + 1 < upper) {
    const middle = (lower + upper) >> 1;
    if (GLASS_HALF_WIDTH_LUT[middle].h <= height) lower = middle;
    else upper = middle;
  }

  const left = GLASS_HALF_WIDTH_LUT[lower];
  const right = GLASS_HALF_WIDTH_LUT[upper];
  const ratio = (height - left.h) / (right.h - left.h || 1);
  return left.w + (right.w - left.w) * ratio;
}

export function glassPath(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.moveTo(-R, TOP);
  ctx.bezierCurveTo(-R, TOP + 95, -NECK, -55, -NECK, 0);
  ctx.bezierCurveTo(-NECK, 55, -R, BOT - 95, -R, BOT);
  ctx.lineTo(R, BOT);
  ctx.bezierCurveTo(R, BOT - 95, NECK, 55, NECK, 0);
  ctx.bezierCurveTo(NECK, -55, R, TOP + 95, R, TOP);
  ctx.closePath();
}