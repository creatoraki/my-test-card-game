// 基础档挑战图标: 慈悲 / 不改初衷 / 养精蓄锐。
import { PixelCanvas } from "../pixel/PixelCanvas";
import { CORAL, CREAM, GOLD, GREEN, INK, PINK, SKY, STEEL, VIOLET } from "../pixel/palette";

/** 慈悲: 衔橄榄枝的白鸽。 */
export function drawMercy() {
  const c = new PixelCanvas();

  const wingBack = new PixelCanvas();
  wingBack.poly([[14, 16], [21, 3], [29, 1], [27, 8], [23, 15]], CREAM.lo);
  c.stamp(wingBack);

  const body = new PixelCanvas();
  body.ellipse(16, 19.5, 9.5, 6, CREAM.base);
  body.disc(8.5, 13.5, 4.6, CREAM.base);
  body.poly([[20, 15], [31, 12], [31, 16], [28, 21], [20, 23]], CREAM.base);
  body.shade(CREAM.base, CREAM.hi, CREAM.lo);
  body.dots([[28, 13], [29, 13], [27, 17], [28, 17]], CREAM.lo);
  body.poly([[2, 13], [5, 12], [5, 16]], GOLD.base);
  body.set(3, 14, GOLD.lo);
  body.rect(7, 12, 2, 2, INK);
  body.set(7, 12, CREAM.hi);
  c.stamp(body, INK);

  const wing = new PixelCanvas();
  wing.poly([[11, 17], [16, 5], [23, 1], [22, 8], [20, 14], [17, 19]], CREAM.base);
  wing.shade(CREAM.base, CREAM.hi, CREAM.lo);
  wing.line(15, 13, 20, 4, CREAM.lo);
  wing.line(17, 16, 21, 9, CREAM.lo);
  c.stamp(wing, INK);

  const branch = new PixelCanvas();
  branch.line(4, 16, 6, 24, GREEN.dk);
  branch.ellipse(3, 20, 1.6, 2.4, GREEN.base);
  branch.ellipse(8, 21, 1.6, 2.4, GREEN.lo);
  branch.ellipse(4, 25, 1.4, 2.2, GREEN.base);
  branch.dots([[3, 19], [4, 24]], GREEN.hi);
  c.stamp(branch, INK);

  c.rect(14, 26, 1, 3, CORAL.lo).rect(18, 26, 1, 3, CORAL.lo);
  c.rect(13, 28, 3, 1, CORAL.base).rect(17, 28, 3, 1, CORAL.base);
  return c.outline(INK);
}

/** 不改初衷: 被挂锁锁住的手牌。 */
export function drawNoRedraw() {
  const c = new PixelCanvas();

  const back = new PixelCanvas();
  back.rect(3, 4, 16, 22, VIOLET.lo);
  back.dots([[3, 4], [18, 4], [3, 25], [18, 25]], null);
  c.stamp(back);

  const card = new PixelCanvas();
  card.rect(8, 1, 17, 24, GOLD.base);
  card.dots([[8, 1], [24, 1], [8, 24], [24, 24]], null);
  card.shade(GOLD.base, GOLD.hi, GOLD.lo);
  card.rect(10, 3, 13, 20, VIOLET.base);
  card.shade(VIOLET.base, VIOLET.hi, VIOLET.lo);
  card.poly([[16.5, 5], [21, 12.5], [16.5, 20], [12, 12.5]], GOLD.base);
  card.poly([[16.5, 5], [12, 12.5], [16.5, 12.5]], GOLD.hi);
  card.poly([[16.5, 20], [21, 12.5], [16.5, 12.5]], GOLD.lo);
  card.rect(16, 11, 2, 3, CORAL.base);
  card.dots([[11, 4], [21, 21]], GOLD.hi);
  c.stamp(card, INK);

  const lock = new PixelCanvas();
  lock.ring(23.5, 21, 3, 5.2, STEEL.base, 180, 360);
  lock.rect(18, 21, 3, 2, STEEL.base).rect(27, 21, 3, 2, STEEL.base);
  lock.shade(STEEL.base, STEEL.hi, STEEL.lo);
  lock.rect(16, 22, 15, 9, GOLD.base);
  lock.shade(GOLD.base, GOLD.hi, GOLD.lo);
  lock.disc(23.5, 25, 1.6, INK);
  lock.rect(23, 26, 1, 3, INK);
  lock.rect(17, 29, 13, 1, GOLD.dk);
  c.stamp(lock, INK);
  return c.outline(INK);
}

/** 养精蓄锐: 戴睡帽打盹的珊瑚色方块小怪。 */
export function drawSlowStart() {
  const c = new PixelCanvas();

  const zz = new PixelCanvas();
  zz.rect(22, 2, 7, 2, SKY.base).line(27, 4, 23, 8, SKY.base, 2).rect(22, 8, 7, 2, SKY.base);
  zz.rect(16, 8, 4, 1, SKY.hi).line(19, 9, 17, 11, SKY.hi).rect(16, 11, 4, 1, SKY.hi);
  zz.shade(SKY.base, SKY.hi, SKY.lo);
  c.stamp(zz, INK);

  const critter = new PixelCanvas();
  critter.rect(5, 15, 22, 11, CORAL.base);
  critter.rect(2, 19, 3, 3, CORAL.base).rect(27, 19, 3, 3, CORAL.base);
  [7, 11, 19, 23].forEach((x) => critter.rect(x, 26, 2, 3, CORAL.base));
  critter.shade(CORAL.base, CORAL.hi, CORAL.lo);
  critter.dots([[9, 20], [10, 21], [11, 21], [12, 20], [19, 20], [20, 21], [21, 21], [22, 20]], INK);
  critter.rect(7, 22, 2, 1, PINK.base).rect(23, 22, 2, 1, PINK.base);
  critter.rect(15, 23, 2, 1, CORAL.dk);
  c.stamp(critter, INK);

  const cap = new PixelCanvas();
  cap.poly([[4, 16], [19, 16], [16, 10], [11, 6], [7, 5], [9, 9]], VIOLET.base);
  cap.shade(VIOLET.base, VIOLET.hi, VIOLET.lo);
  cap.rect(4, 15, 16, 2, CREAM.base);
  cap.shade(CREAM.base, CREAM.hi, CREAM.lo);
  cap.disc(6, 5, 2.3, CREAM.base);
  cap.set(5, 4, CREAM.hi);
  cap.dots([[11, 11], [14, 13], [9, 13]], GOLD.base);
  c.stamp(cap, INK);
  return c.outline(INK);
}
