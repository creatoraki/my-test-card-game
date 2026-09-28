import type { StreetPlacement } from "../types";
import { createRandom } from "../core/base/random";
import { AMBIENT_SHADOW, NAVY, RIM_HOT, STEEL, TEAL, rgba, type Ramp } from "../core/base/palette";
import { fillTexture } from "../core/base/grain";
import { box, contactShadow, label, type StreetSpec } from "./common";

// 分类回收箱：并排两到三只，带盖、把手、小轮子和分类标签；偶尔盖子没盖严，塞出一只黑色垃圾袋。

const BIN_W = 76;
const BIN_H = 130;
const KINDS: readonly { text: string; ramp: Ramp }[] = [
  { text: "可回收", ramp: NAVY },
  { text: "其他", ramp: STEEL },
  { text: "厨余", ramp: TEAL },
];

function drawBins(ctx: CanvasRenderingContext2D, p: StreetPlacement): void {
  const r = createRandom(p.seed);
  const g = p.ground;
  const count = Math.max(1, Math.min(3, Math.floor((p.width + 6) / (BIN_W + 6))));
  const x0 = p.x + (p.width - count * BIN_W - (count - 1) * 6) / 2;
  contactShadow(ctx, p.x + p.width / 2, g, p.width * 1.2);
  for (let i = 0; i < count; i++) {
    const kind = KINDS[(i + (p.seed % 3)) % KINDS.length];
    const x = x0 + i * (BIN_W + 6);
    const y = g - BIN_H;
    // 身子略收腰：上宽下窄。
    const body = new Path2D();
    body.moveTo(x, y + 14);
    body.lineTo(x + BIN_W, y + 14);
    body.lineTo(x + BIN_W - 5, g - 10);
    body.lineTo(x + 5, g - 10);
    body.closePath();
    ctx.save();
    ctx.clip(body);
    box(ctx, x, y + 14, BIN_W, BIN_H - 24, kind.ramp);
    fillTexture(ctx, "grime", x, y, BIN_W, BIN_H, 0.7, (p.seed + i * 13) % 97, 1.3);
    ctx.restore();
    label(ctx, kind.text, x + BIN_W / 2, y + 64, "#dfe8ff", rgba("#000000", 0.45));
    // 盖子 + 把手。
    const open = r.chance(0.3);
    ctx.save();
    if (open) {
      ctx.translate(x, y + 14);
      ctx.rotate(-0.25);
      ctx.translate(-x, -(y + 14));
    }
    ctx.fillStyle = kind.ramp.light;
    ctx.fillRect(x - 3, y + 2, BIN_W + 6, 14);
    ctx.fillStyle = kind.ramp.hi;
    ctx.fillRect(x - 3, y + 2, BIN_W + 6, 2);
    ctx.fillStyle = STEEL.deep;
    ctx.fillRect(x + BIN_W / 2 - 14, y - 4, 28, 6);
    ctx.restore();
    if (open) {
      ctx.fillStyle = "#07070c";
      ctx.beginPath();
      ctx.ellipse(x + BIN_W / 2, y + 12, BIN_W * 0.42, 16, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = rgba("#9fb0e8", 0.25);
      ctx.fillRect(x + BIN_W * 0.3, y, 10, 2);
    }
    // 小轮子。
    ctx.fillStyle = "#06070b";
    ctx.beginPath();
    ctx.arc(x + 14, g - 8, 8, 0, Math.PI * 2);
    ctx.arc(x + BIN_W - 14, g - 8, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rgba(RIM_HOT, 0.4);
    ctx.fillRect(x + BIN_W - 2, y + 14, 1.5, BIN_H - 24);
  }
  if (r.chance(0.4)) {
    // 箱边丢着一只垃圾袋。
    const bx = r.chance(0.5) ? x0 - 50 : x0 + count * (BIN_W + 6);
    ctx.fillStyle = rgba(AMBIENT_SHADOW, 0.5);
    ctx.beginPath();
    ctx.ellipse(bx + 24, g, 34, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    const bag = ctx.createRadialGradient(bx + 16, g - 40, 4, bx + 24, g - 26, 36);
    bag.addColorStop(0, "#2a2d3c");
    bag.addColorStop(1, "#06070b");
    ctx.fillStyle = bag;
    ctx.beginPath();
    ctx.ellipse(bx + 24, g - 26, 28, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(bx + 20, g - 60, 8, 12);
  }
}

export const binsSpec: StreetSpec = {
  kind: "bins",
  label: "回收箱",
  width: [160, 250],
  lamps: () => [],
  draw: drawBins,
};
