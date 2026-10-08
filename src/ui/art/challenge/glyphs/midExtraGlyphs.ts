// 中等档挑战图标(续): 敝帚自珍 / 稳扎稳打 / 循序渐进 / 背水一战 / 速战速决 / 擒贼擒王。
import { PixelCanvas } from "../pixel/PixelCanvas";
import { CORAL, CREAM, GOLD, GREEN, INK, PINK, RED, SKY, STEEL, TEAL } from "../pixel/palette";

/** 敝帚自珍: 系着红绳的旧扫帚, 旁边一颗小心心。 */
export function drawNoDiscard() {
  const c = new PixelCanvas();

  const heart = new PixelCanvas();
  heart.disc(5, 6, 2.6, PINK.base).disc(10, 6, 2.6, PINK.base);
  heart.poly([[2.4, 7], [12.6, 7], [7.5, 12.5]], PINK.base);
  heart.shade(PINK.base, PINK.hi, PINK.lo);
  c.stamp(heart, INK);

  const handle = new PixelCanvas();
  handle.line(28, 1, 15, 17, GOLD.lo, 2);
  handle.shade(GOLD.lo, GOLD.base, GOLD.dk);
  c.stamp(handle, INK);

  const bristles = new PixelCanvas();
  bristles.poly([[9, 19], [15, 22], [12, 31], [1, 27]], GOLD.base);
  bristles.shade(GOLD.base, GOLD.hi, GOLD.lo);
  bristles.line(11, 21, 5, 28, GOLD.lo).line(13, 22, 9, 30, GOLD.lo).line(10, 20, 3, 25, GOLD.lo);
  c.stamp(bristles, INK);

  const band = new PixelCanvas();
  band.poly([[11, 16], [17, 19], [15, 23], [9, 20]], RED.base);
  band.shade(RED.base, RED.hi, RED.lo);
  c.stamp(band, INK);
  return c.outline(INK);
}

/** 稳扎稳打: 慢慢爬的小乌龟。 */
export function drawSteady() {
  const c = new PixelCanvas();

  const body = new PixelCanvas();
  body.disc(27, 17, 3.4, GREEN.base);
  body.rect(5, 21, 4, 5, GREEN.base).rect(20, 21, 4, 5, GREEN.base);
  body.poly([[2, 20], [5, 18], [5, 21]], GREEN.base);
  body.ellipse(15, 21, 11, 3, GREEN.base);
  body.shade(GREEN.base, GREEN.hi, GREEN.lo);
  body.rect(28, 16, 1, 2, INK);
  body.set(30, 18, GREEN.dk);
  c.stamp(body, INK);

  const shell = new PixelCanvas();
  shell.ellipse(15, 20, 11, 11, TEAL.base);
  shell.rect(0, 20, 32, 12, null);
  shell.shade(TEAL.base, TEAL.hi, TEAL.lo, 2);
  // 龟甲六角纹: 中央一块 + 两侧斜线分割。
  shell.poly([[12, 11], [18, 11], [20, 15], [18, 19], [12, 19], [10, 15]], TEAL.lo);
  shell.poly([[13, 12], [17, 12], [19, 15], [17, 18], [13, 18], [11, 15]], TEAL.base);
  shell.line(10, 15, 5, 15, TEAL.lo).line(20, 15, 25, 15, TEAL.lo);
  shell.line(12, 11, 10, 9, TEAL.lo).line(18, 11, 20, 9, TEAL.lo);
  shell.dots([[14, 13], [13, 14]], TEAL.hi);
  shell.rect(4, 19, 23, 2, GOLD.lo);
  shell.shade(GOLD.lo, GOLD.base, GOLD.dk);
  c.stamp(shell, INK);
  return c.outline(INK);
}

/** 循序渐进: 一级比一级高的台阶柱, 上方一道攀升箭头。 */
export function drawAscending() {
  const c = new PixelCanvas();

  const bars = new PixelCanvas();
  bars.rect(3, 22, 7, 9, SKY.base).rect(12, 15, 7, 16, TEAL.base).rect(21, 8, 7, 23, GOLD.base);
  bars.shade(SKY.base, SKY.hi, SKY.lo).shade(TEAL.base, TEAL.hi, TEAL.lo).shade(GOLD.base, GOLD.hi, GOLD.lo);
  c.stamp(bars, INK);

  const arrow = new PixelCanvas();
  arrow.line(2, 17, 20, 4, CORAL.base, 2);
  arrow.poly([[16, 1], [27, 0], [23, 9]], CORAL.base);
  arrow.shade(CORAL.base, CORAL.hi, CORAL.lo);
  c.stamp(arrow, INK);
  return c.outline(INK);
}

/** 背水一战: 浪头前碎裂的药瓶 —— 不靠治疗。 */
export function drawNoHeal() {
  const c = new PixelCanvas();

  const waves = new PixelCanvas();
  waves.paint((x, y) => y > 22.5 + 1.6 * Math.sin(x * 0.7), SKY.base);
  waves.recolor(SKY.base, SKY.lo, (x, y) => y + 0.5 > 26.5 + 1.4 * Math.sin(x * 0.7 + 2));
  waves.recolor(SKY.base, SKY.hi, (x, y) => y + 0.5 < 24 + 1.6 * Math.sin((x + 0.5) * 0.7));
  c.stamp(waves, INK);

  const bottle = new PixelCanvas();
  bottle.rect(13, 6, 6, 5, CREAM.lo);
  bottle.disc(16, 17, 8, CREAM.hi);
  bottle.paint((x, y) => Math.hypot(x - 16, y - 17) <= 6.8 && y > 15, RED.base);
  bottle.shade(RED.base, RED.hi, RED.lo);
  bottle.rect(12, 2, 8, 4, GOLD.lo);
  bottle.shade(GOLD.lo, GOLD.base, GOLD.dk);
  bottle.dots([[11, 13], [12, 12]], "#ffffff");
  // 裂纹: 从瓶肩斜劈到瓶底。
  bottle.dots([[18, 9], [19, 10], [19, 11], [20, 12], [19, 13], [20, 14], [21, 15], [20, 16], [21, 17], [22, 18]], INK);
  bottle.dots([[19, 13], [18, 14]], STEEL.dk);
  c.stamp(bottle, INK);
  return c.outline(INK);
}

/** 速战速决: 秒针疾走的怀表式秒表。 */
export function drawSwiftWin() {
  const c = new PixelCanvas();

  const speed = new PixelCanvas();
  speed.rect(0, 14, 4, 1, SKY.hi).rect(1, 18, 3, 1, SKY.base).rect(0, 22, 4, 1, SKY.hi);
  c.stamp(speed);

  const watch = new PixelCanvas();
  watch.rect(16, 1, 5, 2, GOLD.base).rect(17, 3, 3, 3, GOLD.lo);
  watch.poly([[26, 5], [29, 8], [27, 10], [24, 7]], GOLD.lo);
  watch.disc(18.5, 18, 12.4, GOLD.base);
  watch.shade(GOLD.base, GOLD.hi, GOLD.lo, 2);
  watch.disc(18.5, 18, 9.8, CREAM.base);
  watch.recolor(CREAM.base, CREAM.lo, (x, y) => Math.hypot(x + 0.5 - 17, y + 0.5 - 16.5) > 9.6);
  [[18, 9], [18, 26], [9, 17], [27, 17]].forEach(([x, y]) => watch.rect(x, y, 1, 2, INK));
  watch.rect(9, 17, 2, 1, INK).rect(26, 17, 2, 1, INK).rect(18, 9, 1, 2, INK);
  watch.line(18, 18, 18, 11, INK, 2);
  watch.line(18, 18, 24, 13, RED.base);
  watch.line(18, 18, 15, 21, RED.base);
  watch.rect(17, 17, 2, 2, RED.lo);
  watch.dots([[11, 11], [12, 10]], "#ffffff");
  c.stamp(watch, INK);
  return c;
}

/** 擒贼擒王: 被一箭贯穿的王冠。 */
export function drawRegicide() {
  const c = new PixelCanvas();

  const crown = new PixelCanvas();
  crown.poly([[4, 27], [28, 27], [29, 12], [22, 18], [16, 8], [10, 18], [3, 12]], GOLD.base);
  crown.shade(GOLD.base, GOLD.hi, GOLD.lo, 2);
  crown.rect(4, 23, 24, 4, GOLD.lo);
  crown.shade(GOLD.lo, GOLD.base, GOLD.dk);
  crown.disc(10, 25, 1.4, RED.base).disc(16, 25, 1.6, SKY.base).disc(22, 25, 1.4, RED.base);
  crown.dots([[16, 24]], SKY.hi);
  crown.disc(3, 11, 1.8, GOLD.hi).disc(16, 7, 1.8, GOLD.hi).disc(29, 11, 1.8, GOLD.hi);
  c.stamp(crown, INK);

  const arrow = new PixelCanvas();
  arrow.line(4, 4, 25, 18, GOLD.dk, 2);
  arrow.poly([[23, 15], [31, 22], [21, 20]], STEEL.base);
  arrow.shade(STEEL.base, STEEL.hi, STEEL.lo);
  arrow.poly([[0, 0], [6, 2], [3, 6]], RED.base);
  arrow.poly([[1, 4], [5, 5], [3, 8]], CREAM.base);
  c.stamp(arrow, INK);
  return c.outline(INK);
}
