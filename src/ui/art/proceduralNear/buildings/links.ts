import type { CablePlacement } from "../types";
import { createRandom } from "../core/base/random";
import { rgba } from "../core/base/palette";
import { cable } from "../core/fixtures/techkit";

// 楼间连接：垂坠线缆（两端挂在屋檐或从画面外垂下），偶尔在线上挂一串三角彩旗。

const FLAG_COLORS = ["#3b5fae", "#a0457f", "#2e8c95", "#6c4fae", "#8d9bb8", "#7a2c46"];

export function drawCable(ctx: CanvasRenderingContext2D, c: CablePlacement): void {
  cable(ctx, c.x0, c.y0, c.x1, c.y1, c.sag, c.width);
  if (!c.flags) return;
  const r = createRandom(c.seed);
  const mx = (c.x0 + c.x1) / 2;
  const my = (c.y0 + c.y1) / 2 + c.sag * 2;
  const at = (t: number) => ({
    x: (1 - t) * (1 - t) * c.x0 + 2 * (1 - t) * t * mx + t * t * c.x1,
    y: (1 - t) * (1 - t) * c.y0 + 2 * (1 - t) * t * my + t * t * c.y1,
  });
  const n = Math.max(4, Math.round(Math.abs(c.x1 - c.x0) / 60));
  for (let i = 1; i < n; i++) {
    const a = at(i / n);
    const b = at((i + 0.7) / n);
    const color = r.pick(FLAG_COLORS);
    ctx.fillStyle = rgba("#000000", 0.35);
    ctx.beginPath();
    ctx.moveTo(a.x + 4, a.y + 5);
    ctx.lineTo(b.x + 4, b.y + 5);
    ctx.lineTo((a.x + b.x) / 2 + 4, (a.y + b.y) / 2 + 50);
    ctx.closePath();
    ctx.fill();
    const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y + 40);
    g.addColorStop(0, color);
    g.addColorStop(1, rgba("#05060b", 0.9));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo((a.x + b.x) / 2, (a.y + b.y) / 2 + 46);
    ctx.closePath();
    ctx.fill();
  }
}
