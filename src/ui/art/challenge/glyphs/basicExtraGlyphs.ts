// 基础档挑战图标(续): 当机立断 / 知足 / 返璞归真 / 光明磊落。
import { PixelCanvas, type Point } from "../pixel/PixelCanvas";
import { CORAL, CREAM, GOLD, GREEN, INK, RED, SKY, TEAL } from "../pixel/palette";

/** 当机立断: 被红杠划掉的沙漏 —— 不等了。 */
export function drawNoWait() {
  const c = new PixelCanvas();

  const bulb = new PixelCanvas();
  bulb.poly([[8, 5], [24, 5], [17, 16], [15, 16]], SKY.hi);
  bulb.poly([[15, 16], [17, 16], [24, 27], [8, 27]], SKY.hi);
  bulb.shade(SKY.hi, "#ffffff", SKY.base);
  bulb.poly([[11, 9], [21, 9], [17, 14], [15, 14]], GOLD.base);
  bulb.rect(15, 14, 2, 8, GOLD.base);
  bulb.poly([[9, 27], [23, 27], [16, 20]], GOLD.base);
  bulb.shade(GOLD.base, GOLD.hi, GOLD.lo);
  c.stamp(bulb, INK);

  const frame = new PixelCanvas();
  frame.rect(6, 2, 20, 3, GOLD.lo).rect(6, 27, 20, 3, GOLD.lo);
  frame.rect(6, 5, 2, 22, GOLD.dk).rect(24, 5, 2, 22, GOLD.dk);
  frame.shade(GOLD.lo, GOLD.base, GOLD.dk);
  c.stamp(frame, INK);

  const slash = new PixelCanvas();
  slash.line(4, 28, 28, 4, RED.base, 3);
  slash.shade(RED.base, RED.hi, RED.lo);
  c.stamp(slash, INK);
  return c.outline(INK);
}

/** 知足: 冒着热气的一盏茶。 */
export function drawContent() {
  const c = new PixelCanvas();

  const steam = new PixelCanvas();
  steam.line(11, 9, 13, 6, CREAM.lo).line(13, 6, 11, 3, CREAM.lo);
  steam.line(17, 8, 19, 5, CREAM.hi).line(19, 5, 17, 2, CREAM.hi);
  steam.line(22, 9, 23, 7, CREAM.lo);
  c.stamp(steam);

  const saucer = new PixelCanvas();
  saucer.ellipse(16, 27.5, 14, 3, CREAM.base);
  saucer.shade(CREAM.base, CREAM.hi, CREAM.lo);
  c.stamp(saucer, INK);

  const cup = new PixelCanvas();
  cup.ring(26, 18, 2, 4.4, TEAL.base, 270, 90);
  cup.poly([[5, 12], [27, 12], [25, 21], [21, 26], [11, 26], [7, 21]], TEAL.base);
  cup.shade(TEAL.base, TEAL.hi, TEAL.lo, 2);
  cup.ellipse(16, 12.5, 10.6, 2.2, GOLD.lo);
  cup.rect(8, 12, 16, 1, GOLD.base);
  cup.dots([[12, 18], [13, 17], [13, 19], [14, 18], [19, 19], [20, 18]], CREAM.hi);
  cup.set(13, 18, CORAL.base);
  c.stamp(cup, INK);
  return c.outline(INK);
}

/** 返璞归真: 冒出新芽的原木卡牌。 */
export function drawPlain() {
  const c = new PixelCanvas();

  const card = new PixelCanvas();
  card.rect(6, 7, 20, 24, GOLD.lo);
  card.dots([[6, 7], [25, 7], [6, 30], [25, 30]], null);
  card.shade(GOLD.lo, GOLD.base, GOLD.dk);
  // 木纹: 两道竖纹 + 一圈年轮结疤。
  card.line(10, 10, 10, 27, GOLD.dk).line(21, 10, 22, 27, GOLD.dk);
  card.ring(16, 19, 2.2, 3.4, GOLD.dk);
  card.disc(16, 19, 1, GOLD.dk);
  card.dots([[9, 9], [12, 28]], GOLD.base);
  c.stamp(card, INK);

  const sprout = new PixelCanvas();
  sprout.line(16, 7, 16, 3, GREEN.lo);
  sprout.ellipse(12.5, 3.5, 3, 1.6, GREEN.base);
  sprout.ellipse(19.5, 2.5, 3, 1.6, GREEN.base);
  sprout.dots([[11, 3], [18, 2]], GREEN.hi);
  sprout.dots([[14, 4], [21, 3]], GREEN.lo);
  c.stamp(sprout, INK);
  return c.outline(INK);
}

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
