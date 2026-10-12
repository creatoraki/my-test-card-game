// 挑战图标: 光明磊落。
import { PixelCanvas, type Point } from "../pixel/PixelCanvas";
import { CORAL, GOLD, INK } from "../pixel/palette";

/** 光明磊落: 坦荡微笑的太阳。 */
export function drawHonorable() {
  const c = new PixelCanvas();

  const polar = (deg: number, r: number): Point => [
    16 + Math.cos((deg * Math.PI) / 180) * r,
    16 + Math.sin((deg * Math.PI) / 180) * r,
  ];
  const rays = new PixelCanvas();
  for (let k = 0; k < 8; k += 1) {
    const deg = k * 45;
    rays.poly([polar(deg - 14, 9), polar(deg, 15.6), polar(deg + 14, 9)], k % 2 === 0 ? GOLD.base : GOLD.lo);
  }
  c.stamp(rays, INK);

  const sun = new PixelCanvas();
  sun.disc(16, 16, 9, GOLD.base);
  sun.shade(GOLD.base, GOLD.hi, GOLD.lo, 2);
  sun.dots([[11, 11], [12, 10], [11, 12]], "#ffffff");
  sun.rect(12, 14, 2, 2, INK).rect(19, 14, 2, 2, INK);
  sun.dots([[13, 19], [14, 20], [15, 20], [16, 20], [17, 20], [18, 20], [19, 19]], INK);
  sun.rect(10, 17, 2, 1, CORAL.hi).rect(21, 17, 2, 1, CORAL.hi);
  c.stamp(sun, INK);
  return c.outline(INK);
}
