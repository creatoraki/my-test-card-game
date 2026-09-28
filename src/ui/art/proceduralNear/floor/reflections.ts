import { NEAR_SCENE_GEOMETRY, type LampSpot } from "../types";
import { lightGlow, rgba } from "../core/base/palette";
import { DECK_BOTTOM } from "./walkway";

// 地面反光：把建筑上的灯位投到行走带上，一团贴墙的光斑 + 一道向前拉长的湿地倒影，
// 让建筑和地面在光照上连成一体。叠加混合，只照亮行走带。

const G = NEAR_SCENE_GEOMETRY;
const REACH = 260;

export function drawReflections(ctx: CanvasRenderingContext2D, lamps: readonly LampSpot[], x0: number, x1: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, G.baseY + 8, x1 - x0, DECK_BOTTOM - G.baseY - 8);
  ctx.clip();
  ctx.globalCompositeOperation = "lighter";
  for (const lamp of lamps) {
    if (lamp.x < x0 - REACH || lamp.x > x1 + REACH) continue;
    const color = lightGlow(lamp.tone);
    // 光源越高，照到地面的光越散越弱。
    const height = G.baseY - lamp.y;
    const strength = (lamp.kind === "strip" ? 0.34 : 0.28) * Math.max(0.35, 1 - height / 900);
    const spread = 100 + height * 0.25;

    ctx.save();
    ctx.translate(lamp.x, G.baseY + 14);
    ctx.scale(1, 0.28);
    const pool = ctx.createRadialGradient(0, 0, 0, 0, 0, spread);
    pool.addColorStop(0, rgba(color, strength));
    pool.addColorStop(0.5, rgba(color, strength * 0.35));
    pool.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = pool;
    ctx.fillRect(-spread, -spread, spread * 2, spread * 2);
    ctx.restore();

    const streak = ctx.createLinearGradient(0, G.baseY, 0, DECK_BOTTOM);
    streak.addColorStop(0, rgba(color, strength * 0.9));
    streak.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = streak;
    ctx.fillRect(lamp.x - 7, G.baseY, 14, DECK_BOTTOM - G.baseY);
    ctx.fillRect(lamp.x - 2, G.baseY, 4, DECK_BOTTOM - G.baseY);
  }
  ctx.restore();
}
