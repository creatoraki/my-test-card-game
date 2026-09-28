import type { NeonTone, StreetPlacement } from "../types";
import { createRandom, type Random } from "../core/base/random";
import { ALLOY, CRIMSON, LED, NAVY, NEON_COLORS, STEEL, rgba, type Ramp } from "../core/base/palette";
import { fillTexture } from "../core/base/grain";
import { radialGlow } from "../core/light/glow";
import { ledDots } from "../core/fixtures/techkit";
import { box, contactShadow, label, lightSpot, type StreetSpec } from "./common";

// 自动售货机：1m × 1.85m。顶部灯箱、发光的商品橱窗（五层瓶罐）、右侧按键与投币口、底部取货口。
// 宽度够时并排两台，外壳配色不同。

const MACHINE_W = 130;
const MACHINE_H = 240;
const BOTTLES = ["#5fc8ff", "#ff7ac8", "#c8d4ff", "#7df0c0", "#b08aff", "#e8e8f0", "#3d7cff"];

function machine(ctx: CanvasRenderingContext2D, r: Random, x: number, ground: number, ramp: Ramp, tone: NeonTone, title: string): void {
  const y = ground - MACHINE_H;
  const { core, glow } = NEON_COLORS[tone];
  radialGlow(ctx, x + MACHINE_W / 2, y + 110, 150, glow, 0.2);
  box(ctx, x, y, MACHINE_W, MACHINE_H, ramp);
  // 顶部灯箱。
  ctx.fillStyle = rgba(core, 0.85);
  ctx.fillRect(x + 6, y + 6, MACHINE_W - 12, 28);
  label(ctx, title, x + MACHINE_W / 2, y + 20, "#0c1226", rgba(core, 0));
  // 商品橱窗。
  const wx = x + 8;
  const wy = y + 42;
  const ww = 84;
  const wh = 128;
  ctx.fillStyle = "#070a16";
  ctx.fillRect(wx, wy, ww, wh);
  const g = ctx.createLinearGradient(0, wy, 0, wy + wh);
  g.addColorStop(0, rgba(core, 0.55));
  g.addColorStop(1, rgba(glow, 0.2));
  ctx.fillStyle = g;
  ctx.fillRect(wx, wy, ww, wh);
  for (let row = 0; row < 5; row++) {
    const ry = wy + 6 + row * 25;
    for (let bx = wx + 4; bx < wx + ww - 8; bx += 12) {
      ctx.fillStyle = r.pick(BOTTLES);
      ctx.fillRect(bx, ry + 4, 8, 16);
      ctx.fillStyle = rgba("#ffffff", 0.5);
      ctx.fillRect(bx + 1, ry + 5, 2, 10);
      ctx.fillStyle = "#1a1a24";
      ctx.fillRect(bx + 2, ry, 4, 4);
    }
    ctx.fillStyle = rgba("#0b0f1c", 0.9);
    ctx.fillRect(wx, ry + 20, ww, 3);
  }
  ctx.fillStyle = rgba("#dfe8ff", 0.18);
  ctx.fillRect(wx + 4, wy + 2, ww * 0.25, wh - 4);
  // 按键列 + 投币口 + 读卡灯。
  ctx.fillStyle = STEEL.deep;
  ctx.fillRect(x + 98, y + 42, 24, 128);
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i % 2 ? LED.cyan : rgba("#c9d2e6", 0.7);
    ctx.fillRect(x + 104, y + 50 + i * 14, 12, 7);
  }
  ctx.fillStyle = "#020306";
  ctx.fillRect(x + 106, y + 140, 8, 16);
  ledDots(ctx, r, x + 104, y + 164, 2, 8);
  // 取货口。
  ctx.fillStyle = "#04050a";
  ctx.fillRect(x + 14, y + 188, 90, 30);
  ctx.fillStyle = ALLOY.mid;
  ctx.fillRect(x + 14, y + 188, 90, 6);
  ctx.fillStyle = ALLOY.hi;
  ctx.fillRect(x + 14, y + 188, 90, 1.5);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, MACHINE_W, MACHINE_H);
  ctx.clip();
  fillTexture(ctx, "grime", x, y, MACHINE_W, MACHINE_H, 0.5, x % 97, 1.4);
  ctx.restore();
  ctx.fillStyle = STEEL.deep;
  ctx.fillRect(x + 4, ground - 8, MACHINE_W - 8, 8);
}

function drawVending(ctx: CanvasRenderingContext2D, p: StreetPlacement): void {
  const r = createRandom(p.seed);
  const count = p.width >= MACHINE_W * 2 + 8 ? 2 : 1;
  contactShadow(ctx, p.x + p.width / 2, p.ground, p.width * 1.2, 0.55);
  const ramps = [NAVY, CRIMSON, ALLOY, NAVY];
  const titles = ["冷饮", "零食", "咖啡", "热饮"];
  const x0 = p.x + (p.width - count * MACHINE_W - (count - 1) * 8) / 2;
  for (let i = 0; i < count; i++) {
    machine(ctx, r, x0 + i * (MACHINE_W + 8), p.ground, r.pick(ramps), r.chance(0.6) ? "cyan" : "pink", r.pick(titles));
  }
}

export const vendingSpec: StreetSpec = {
  kind: "vending",
  label: "自动售货机",
  width: [130, 268],
  lamps: (p, rnd) => [lightSpot(p.x + p.width / 2, p.ground - 150, rnd.chance(0.6) ? "cyan" : "white")],
  draw: drawVending,
};
