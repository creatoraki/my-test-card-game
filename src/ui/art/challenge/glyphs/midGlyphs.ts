// 挑战图标: 克制 / 聚焦。
import { PixelCanvas } from "../pixel/PixelCanvas";
import { CREAM, GOLD, INK, RED, SKY, STEEL } from "../pixel/palette";

/** 克制: 被铁链横勒的法力水晶。 */
export function drawRestraint() {
  const c = new PixelCanvas();

  const gem = new PixelCanvas();
  gem.poly([[16, 1], [26, 12], [16, 31], [6, 12]], SKY.base);
  gem.recolor(SKY.base, SKY.lo, (x) => x >= 16);
  gem.poly([[16, 1], [11, 12], [16, 12]], SKY.hi);
  gem.poly([[16, 1], [21, 12], [16, 12]], SKY.base);
  gem.poly([[16, 31], [11, 12], [16, 12]], SKY.base);
  gem.poly([[16, 31], [21, 12], [16, 12]], SKY.dk);
  gem.dots([[12, 6], [13, 5], [10, 10]], "#ffffff");
  c.stamp(gem, INK);

  const chain = new PixelCanvas();
  [3.5, 16, 28.5].forEach((cx) => {
    chain.ellipse(cx, 15.5, 4.6, 3.6, STEEL.base);
    chain.ellipse(cx, 15.5, 2.2, 1.2, null);
  });
  chain.shade(STEEL.base, STEEL.hi, STEEL.lo);
  const links = new PixelCanvas();
  [9.75, 22.25].forEach((cx) => links.rect(Math.round(cx) - 3, 14, 6, 3, STEEL.base));
  links.shade(STEEL.base, STEEL.hi, STEEL.lo);
  chain.stamp(links, INK);
  c.stamp(chain, INK);
  return c.outline(INK);
}

/** 聚焦: 靶心 + 锁定准星。 */
export function drawFocusFire() {
  const c = new PixelCanvas();

  const target = new PixelCanvas();
  target.disc(16, 16, 11, RED.base);
  target.disc(16, 16, 8.4, CREAM.base);
  target.disc(16, 16, 5.8, RED.base);
  target.disc(16, 16, 3.2, CREAM.base);
  target.disc(16, 16, 1.5, RED.base);
  // 整体当成一颗球体打光: 右下外缘压暗, 左上内侧提亮。
  const rim = (x: number, y: number) => Math.hypot(x + 0.5 - 13.5, y + 0.5 - 13.5) > 12.2;
  const glint = (x: number, y: number) => Math.hypot(x + 0.5 - 11, y + 0.5 - 11) < 3.2;
  target.recolor(RED.base, RED.lo, rim).recolor(CREAM.base, CREAM.lo, rim);
  target.recolor(RED.base, RED.hi, glint).recolor(CREAM.base, CREAM.hi, glint);
  c.stamp(target, INK);

  const scope = new PixelCanvas();
  scope.ring(16, 16, 12.6, 14.6, STEEL.base, 20, 70);
  scope.ring(16, 16, 12.6, 14.6, STEEL.base, 110, 160);
  scope.ring(16, 16, 12.6, 14.6, STEEL.base, 200, 250);
  scope.ring(16, 16, 12.6, 14.6, STEEL.base, 290, 340);
  scope.rect(15, 0, 2, 5, GOLD.base).rect(15, 27, 2, 5, GOLD.base);
  scope.rect(0, 15, 5, 2, GOLD.base).rect(27, 15, 5, 2, GOLD.base);
  scope.shade(STEEL.base, STEEL.hi, STEEL.lo);
  scope.shade(GOLD.base, GOLD.hi, GOLD.lo);
  c.stamp(scope, INK);
  return c;
}

