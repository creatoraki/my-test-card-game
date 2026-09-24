import { SCREEN_H, SCREEN_W } from "../core/grid";
import { glowSprite } from "../core/glow";
import type { TerrainLight } from "../scene/terrain/terrainKit";

// 光照：静态光源每帧以 lighter 合成叠加分层光晕，暖灯带轻微闪烁；前景之上再压一层暗角。

function flicker(light: TerrainLight, time: number): number {
  if (light.flicker === 0) return 1;
  const p = light.flicker % 97;
  return 0.86 + Math.sin(time * 2.3 + p) * 0.06 + Math.sin(time * 7.1 + p * 1.7) * 0.04;
}

/** 绘制镜头范围内的光源，光源坐标为世界像素，按 camPx 换算到屏幕。 */
export function drawLights(ctx: CanvasRenderingContext2D, lights: readonly TerrainLight[], camPx: number, time: number) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const light of lights) {
    if (light.x + light.radius < camPx || light.x - light.radius > camPx + SCREEN_W) continue;
    const k = flicker(light, time);
    ctx.globalAlpha = Math.min(1, k);
    const sprite = glowSprite(light.color, light.radius, light.strength);
    ctx.drawImage(sprite, Math.round(light.x - camPx - light.radius), Math.round(light.y - light.radius));
  }
  ctx.restore();
}

/** 暗角：平滑径向渐变压暗四角，把视线收拢到画面中下部。 */
export function bakeVignette(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = SCREEN_W;
  canvas.height = SCREEN_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const cx = SCREEN_W / 2;
  const cy = SCREEN_H * 0.55;
  const gradient = ctx.createRadialGradient(cx, cy, SCREEN_H * 0.35, cx, cy, SCREEN_W * 0.62);
  gradient.addColorStop(0, "rgba(5, 6, 12, 0)");
  gradient.addColorStop(0.6, "rgba(5, 6, 12, 0.18)");
  gradient.addColorStop(1, "rgba(5, 6, 12, 0.62)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
  return canvas;
}