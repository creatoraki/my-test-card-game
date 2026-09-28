import type { LightTone, StreetPlacement } from "../types";
import { createRandom } from "../core/base/random";
import { AMBIENT_SHADOW, AWNING_PAIRS, NAVY, RIM_HOT, STEEL, TEAL, lightCore, lightGlow, rgba } from "../core/base/palette";
import { radialGlow } from "../core/light/glow";
import { box, contactShadow, label, lightSpot, tube, type StreetSpec } from "./common";

// 小吃推车：车身（菜单面板 + 玻璃保温柜 + 铁板与热气）、两只车轮、一把条纹大伞，伞沿挂一串灯泡。

const FOODS = ["烤肠", "煎饼果子", "关东煮", "烤红薯", "炸串", "糖葫芦"] as const;
const UMBRELLA_H = 312;

function wheel(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number): void {
  ctx.fillStyle = "#07070c";
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = STEEL.light;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.55, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = STEEL.hi;
  ctx.fillRect(cx - 2, cy - 2, 4, 4);
}

function drawFoodCart(ctx: CanvasRenderingContext2D, p: StreetPlacement): void {
  const r = createRandom(p.seed);
  const g = p.ground;
  const cartW = Math.min(220, p.width - 40);
  const cx = p.x + (p.width - cartW) / 2;
  const bodyTop = g - 150;
  const tone: LightTone = r.chance(0.35) ? "warm" : r.pick(["pink", "white", "cyan"] as const);
  const [a, b] = r.pick(AWNING_PAIRS);
  contactShadow(ctx, p.x + p.width / 2, g, p.width, 0.55);

  // 伞杆 + 伞面（正视为一片带垂边的扇形）。
  const poleX = cx + cartW * 0.5;
  tube(ctx, poleX - 4, g - UMBRELLA_H, bodyTop, 8, STEEL);
  const top = g - UMBRELLA_H - 20;
  const edge = g - UMBRELLA_H + 60;
  const half = p.width / 2 + 10;
  const mid = p.x + p.width / 2;
  const panels = 6;
  for (let i = 0; i < panels; i++) {
    const t0 = i / panels;
    const t1 = (i + 1) / panels;
    ctx.fillStyle = i % 2 ? a : b;
    ctx.beginPath();
    ctx.moveTo(mid, top);
    ctx.lineTo(mid - half + t0 * half * 2, edge);
    ctx.lineTo(mid - half + t1 * half * 2, edge);
    ctx.closePath();
    ctx.fill();
  }
  const shade = ctx.createLinearGradient(0, top, 0, edge);
  shade.addColorStop(0, rgba("#b8c8ff", 0.12));
  shade.addColorStop(1, rgba(AMBIENT_SHADOW, 0.35));
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.moveTo(mid, top);
  ctx.lineTo(mid - half, edge);
  ctx.lineTo(mid + half, edge);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = rgba(RIM_HOT, 0.4);
  ctx.fillRect(mid - 3, top - 6, 6, 8);
  // 伞沿灯泡串。
  for (let bx = mid - half + 14; bx < mid + half - 8; bx += 26) {
    ctx.fillStyle = lightCore(tone);
    ctx.beginPath();
    ctx.arc(bx, edge + 10, 4.5, 0, Math.PI * 2);
    ctx.fill();
    radialGlow(ctx, bx, edge + 10, 22, lightGlow(tone), 0.45);
  }
  radialGlow(ctx, mid, bodyTop - 30, p.width * 0.6, lightGlow(tone), 0.18);

  // 车身。
  box(ctx, cx, bodyTop, cartW, 110, r.chance(0.5) ? NAVY : TEAL);
  ctx.fillStyle = rgba("#0a0d1a", 0.85);
  ctx.fillRect(cx + 14, bodyTop + 22, cartW - 28, 50);
  label(ctx, r.pick(FOODS), cx + cartW / 2, bodyTop + 47, lightCore(tone), rgba("#000000", 0));
  // 玻璃保温柜 + 铁板与热气。
  ctx.fillStyle = rgba(lightGlow(tone), 0.3);
  ctx.fillRect(cx + 10, bodyTop - 56, cartW * 0.5, 50);
  ctx.strokeStyle = STEEL.light;
  ctx.lineWidth = 2;
  ctx.strokeRect(cx + 10, bodyTop - 56, cartW * 0.5, 50);
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = r.pick(["#8b5a3a", "#c9a070", "#a0457f", "#e8d8b0"]);
    ctx.fillRect(cx + 16 + i * 20, bodyTop - 24, 14, 12);
  }
  ctx.fillStyle = STEEL.deep;
  ctx.fillRect(cx + cartW * 0.58, bodyTop - 12, cartW * 0.38, 10);
  const steam = ctx.createRadialGradient(cx + cartW * 0.77, bodyTop - 70, 4, cx + cartW * 0.77, bodyTop - 70, 70);
  steam.addColorStop(0, rgba("#dfe6ff", 0.18));
  steam.addColorStop(1, rgba("#dfe6ff", 0));
  ctx.fillStyle = steam;
  ctx.fillRect(cx + cartW * 0.77 - 70, bodyTop - 150, 140, 150);
  ctx.fillStyle = STEEL.dark;
  ctx.fillRect(cx - 4, bodyTop - 4, cartW + 8, 8);
  // 推把 + 车轮。
  ctx.strokeStyle = STEEL.light;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx + cartW, bodyTop + 30);
  ctx.lineTo(cx + cartW + 34, bodyTop + 10);
  ctx.stroke();
  wheel(ctx, cx + 40, g - 22, 22);
  wheel(ctx, cx + cartW - 40, g - 22, 22);
}

export const foodCartSpec: StreetSpec = {
  kind: "foodCart",
  label: "小吃推车",
  width: [270, 320],
  lamps: (p, rnd) => [lightSpot(p.x + p.width / 2, p.ground - UMBRELLA_H + 70, rnd.chance(0.4) ? "warm" : "pink", "strip")],
  draw: drawFoodCart,
};
