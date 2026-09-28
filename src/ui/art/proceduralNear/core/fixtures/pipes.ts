import { rgba, type Ramp } from "../base/palette";

// 管道：一条折线 + 圆角弯头，分层描边模拟圆柱截面（主光左上，高光向左上偏移）。

export type PipePoint = readonly [number, number];

function pipePath(points: readonly PipePoint[], bend: number): Path2D {
  const path = new Path2D();
  path.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length - 1; i++) {
    path.arcTo(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1], bend);
  }
  const last = points[points.length - 1];
  path.lineTo(last[0], last[1]);
  return path;
}

function strokeLayer(ctx: CanvasRenderingContext2D, path: Path2D, color: string, width: number, dx = 0, dy = 0): void {
  ctx.save();
  ctx.translate(dx, dy);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke(path);
  ctx.restore();
}

/** 法兰：垂直于管线的一圈加厚环。 */
function flange(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, vertical: boolean, ramp: Ramp): void {
  // vertical 指管线走向；竖管的法兰是一圈横向加宽的环。
  const long = radius * 2 + 6;
  const thick = Math.max(4, radius * 0.5);
  const w = vertical ? long : thick;
  const h = vertical ? thick : long;
  ctx.fillStyle = ramp.deep;
  ctx.fillRect(x - w / 2 - 1, y - h / 2 - 1, w + 2, h + 2);
  ctx.fillStyle = ramp.mid;
  ctx.fillRect(x - w / 2, y - h / 2, w, h);
  ctx.fillStyle = rgba(ramp.hi, 0.7);
  if (vertical) ctx.fillRect(x - w / 2, y - h / 2, w, 1.5);
  else ctx.fillRect(x - w / 2, y - h / 2, 1.5, h);
}

/**
 * 画一段管道。points 须为横平竖直的折线；拐角按 bend 半径做弯头。
 * flangeStep > 0 时沿直段每隔一段距离加一个法兰，两端总带法兰。
 */
export function drawPipe(
  ctx: CanvasRenderingContext2D,
  points: readonly PipePoint[],
  radius: number,
  ramp: Ramp,
  flangeStep = 160,
  bend = radius * 2.6,
): void {
  if (points.length < 2) return;
  const path = pipePath(points, bend);
  const d = 2 * radius;
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "butt";
  strokeLayer(ctx, path, ramp.deep, d + 3);
  strokeLayer(ctx, path, ramp.dark, d);
  strokeLayer(ctx, path, ramp.mid, d * 0.62, -radius * 0.16, -radius * 0.16);
  strokeLayer(ctx, path, ramp.light, d * 0.28, -radius * 0.4, -radius * 0.4);
  strokeLayer(ctx, path, rgba(ramp.hi, 0.75), Math.max(1, d * 0.09), -radius * 0.52, -radius * 0.52);
  ctx.restore();

  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const vertical = x0 === x1;
    const len = Math.abs(vertical ? y1 - y0 : x1 - x0);
    const margin = bend + 6;
    if (i === 0) flange(ctx, x0, y0, radius, vertical, ramp);
    if (i === points.length - 2) flange(ctx, x1, y1, radius, vertical, ramp);
    if (flangeStep <= 0 || len < flangeStep) continue;
    const n = Math.floor(len / flangeStep);
    for (let k = 1; k <= n; k++) {
      const t = k / (n + 1);
      const along = t * len;
      if (along < margin || along > len - margin) continue;
      flange(ctx, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, radius, vertical, ramp);
    }
  }
}

/** 管卡：把管道固定到墙上的小抱箍。 */
export function pipeClamp(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, ramp: Ramp): void {
  ctx.fillStyle = ramp.deep;
  ctx.fillRect(x - radius - 4, y - 3, radius * 2 + 8, 6);
  ctx.fillStyle = ramp.light;
  ctx.fillRect(x - radius - 4, y - 3, radius * 2 + 8, 1.5);
}
