// 中等档挑战图标: 克制 / 聚焦 / 轻装上阵。
import { PixelCanvas } from "../pixel/PixelCanvas";
import { CREAM, GOLD, INK, RED, SKY, STEEL, TEAL } from "../pixel/palette";

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

/** 轻装上阵: 随风斜飘的羽毛。 */
export function drawLowCost() {
  const c = new PixelCanvas();

  const wind = new PixelCanvas();
  wind.rect(2, 6, 8, 1, SKY.hi).rect(4, 9, 5, 1, SKY.base);
  wind.rect(22, 25, 7, 1, SKY.hi).rect(24, 28, 5, 1, SKY.base);
  c.stamp(wind);

  // 羽轴沿 (4,28) → (28,3); t 为沿轴进度, d 为到轴的有符号距离。
  const ax = 4, ay = 28, bx = 28, by = 3;
  const len = Math.hypot(bx - ax, by - ay);
  const ux = (bx - ax) / len, uy = (by - ay) / len;
  const project = (x: number, y: number) => {
    const t = ((x - ax) * ux + (y - ay) * uy) / len;
    const d = (x - ax) * -uy + (y - ay) * ux;
    return { t, d };
  };
  const halfWidth = (t: number) => (t < 0.22 || t > 1 ? 0 : 5.6 * Math.sin(Math.PI * Math.min(1, (t - 0.22) / 0.8)) ** 0.7 + 0.6);
  const notch = (t: number, d: number) => d > 0 && [0.46, 0.7].some((n) => Math.abs(t - n) < 0.03 && d > 2.4);

  const feather = new PixelCanvas();
  feather.paint((x, y) => { const { t, d } = project(x, y); return Math.abs(d) <= halfWidth(t) && !notch(t, d) && d < 0; }, TEAL.base);
  feather.paint((x, y) => { const { t, d } = project(x, y); return Math.abs(d) <= halfWidth(t) && !notch(t, d) && d >= 0; }, TEAL.lo);
  feather.recolor(TEAL.base, TEAL.hi, (x, y) => project(x + 0.5, y + 0.5).t > 0.82);
  feather.recolor(TEAL.lo, TEAL.base, (x, y) => project(x + 0.5, y + 0.5).t > 0.82);
  feather.shade(TEAL.base, TEAL.hi, null);
  feather.shade(TEAL.lo, null, TEAL.dk);
  feather.paint((x, y) => { const { t, d } = project(x, y); return t >= 0 && t <= 0.96 && Math.abs(d) <= 0.6; }, CREAM.base);
  feather.recolor(CREAM.base, CREAM.lo, (x, y) => project(x + 0.5, y + 0.5).t < 0.22);
  c.stamp(feather, INK);
  return c.outline(INK);
}
