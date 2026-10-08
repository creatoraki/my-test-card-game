// 高难档挑战图标: 及时治疗 / 独当一面 / 大屠杀 / 轮转。
import { PixelCanvas } from "../pixel/PixelCanvas";
import { CORAL, CREAM, GOLD, GREEN, INK, RED, SKY, STEEL, TEAL, VIOLET } from "../pixel/palette";

/** 四角星闪光, 以 (x,y) 为中心。 */
function sparkle(c: PixelCanvas, x: number, y: number, color: string, core: string) {
  c.rect(x, y - 2, 1, 5, color).rect(x - 2, y, 5, 1, color).set(x, y, core);
}

/** 及时治疗: 带治疗十字的心。 */
export function drawUntouched() {
  const c = new PixelCanvas();

  const heart = new PixelCanvas();
  heart.disc(10, 11, 7.2, RED.base);
  heart.disc(22, 11, 7.2, RED.base);
  heart.poly([[3, 13], [29, 13], [16, 29]], RED.base);
  heart.shade(RED.base, RED.hi, RED.lo, 2);
  heart.recolor(RED.base, RED.lo, (x, y) => x + y > 38);
  heart.rect(6, 7, 2, 3, "#ffffff").set(8, 6, "#ffffff");
  c.stamp(heart, INK);

  const cross = new PixelCanvas();
  cross.rect(14, 9, 5, 13, CREAM.base).rect(10, 13, 13, 5, CREAM.base);
  cross.shade(CREAM.base, CREAM.hi, CREAM.lo);
  cross.rect(15, 10, 3, 11, GREEN.base).rect(11, 14, 11, 3, GREEN.base);
  cross.shade(GREEN.base, GREEN.hi, GREEN.lo);
  c.stamp(cross, INK);

  sparkle(c, 27, 3, GOLD.base, GOLD.hi);
  sparkle(c, 4, 26, GOLD.base, GOLD.hi);
  return c;
}

/** 独当一面: 光芒中独自竖立的长剑。 */
export function drawLoneBlade() {
  const c = new PixelCanvas();

  const aura = new PixelCanvas();
  aura.ring(16, 13, 10.5, 12, GOLD.lo, 200, 340);
  sparkle(aura, 5, 7, GOLD.base, GOLD.hi);
  sparkle(aura, 27, 10, GOLD.base, GOLD.hi);
  aura.dots([[4, 18], [28, 19], [9, 2]], GOLD.hi);
  c.stamp(aura);

  // 剑身单独描外轮廓再盖上去, 光晕与星芒保持无描边的柔和。
  const sword = new PixelCanvas();
  const blade = new PixelCanvas();
  blade.poly([[16, 0], [19, 4], [19, 21], [13, 21], [13, 4]], STEEL.base);
  blade.recolor(STEEL.base, STEEL.lo, (x) => x >= 16);
  blade.rect(14, 4, 1, 16, STEEL.hi);
  blade.rect(16, 5, 1, 15, STEEL.dk);
  blade.dots([[15, 1], [15, 2]], "#ffffff");
  sword.stamp(blade, INK);

  const hilt = new PixelCanvas();
  hilt.rect(8, 21, 17, 3, GOLD.base);
  hilt.disc(7.5, 22.5, 1.8, GOLD.base).disc(25.5, 22.5, 1.8, GOLD.base);
  hilt.shade(GOLD.base, GOLD.hi, GOLD.lo);
  hilt.rect(15, 21, 3, 3, RED.base).set(15, 21, RED.hi);
  hilt.rect(14, 24, 5, 5, VIOLET.lo);
  [25, 27].forEach((y) => hilt.rect(14, y, 5, 1, VIOLET.dk));
  hilt.disc(16.5, 30, 2.2, GOLD.base);
  hilt.set(15, 29, GOLD.hi);
  sword.stamp(hilt, INK);
  return c.stamp(sword.outline(INK));
}

/** 大屠杀: 交叉骨上的红眼骷髅。 */
export function drawMassacre() {
  const c = new PixelCanvas();

  const bones = new PixelCanvas();
  [[[4, 20], [27, 29]], [[27, 20], [4, 29]]].forEach(([[x0, y0], [x1, y1]]) => {
    bones.line(x0, y0, x1, y1, CREAM.base, 3);
    bones.disc(x0 - 0.5, y0 - 1, 2, CREAM.base).disc(x0 + 1.5, y0 + 1.2, 2, CREAM.base);
    bones.disc(x1 - 0.5, y1 - 1.2, 2, CREAM.base).disc(x1 + 1.5, y1 + 0.8, 2, CREAM.base);
  });
  bones.shade(CREAM.base, CREAM.hi, CREAM.lo);
  c.stamp(bones, INK);

  const skull = new PixelCanvas();
  skull.disc(16, 12.5, 10.5, CREAM.base);
  skull.rect(10, 18, 12, 7, CREAM.base);
  skull.shade(CREAM.base, CREAM.hi, CREAM.lo, 2);
  skull.recolor(CREAM.base, CREAM.lo, (x, y) => x > 21 && y > 8);
  skull.ellipse(11.5, 13.5, 3.4, 3.2, INK).ellipse(20.5, 13.5, 3.4, 3.2, INK);
  skull.rect(11, 13, 2, 2, RED.base).rect(20, 13, 2, 2, RED.base);
  skull.dots([[11, 13], [20, 13]], RED.hi);
  skull.poly([[16, 17], [14, 20.5], [18, 20.5]], INK);
  [12, 15, 18].forEach((x) => skull.rect(x, 22, 1, 3, INK));
  skull.rect(11, 21, 11, 1, CREAM.lo);
  skull.dots([[18, 3], [19, 4], [19, 5], [20, 6]], CREAM.dk);
  c.stamp(skull, INK);
  return c.outline(INK);
}

/** 轮转: 首尾相衔的双色循环箭头, 围着三名归属不同的角色。 */
export function drawRotation() {
  const c = new PixelCanvas();

  const arrows = new PixelCanvas();
  const polar = (deg: number, r: number) => [16 + Math.cos(deg * Math.PI / 180) * r, 16 + Math.sin(deg * Math.PI / 180) * r] as const;
  /** 顺时针弧线箭头: 弧身 from→to, 箭头从 to 起再向前伸 28°。 */
  const arcArrow = (from: number, to: number, color: string) => {
    arrows.ring(16, 16, 8.6, 12.4, color, from, to);
    arrows.poly([polar(to, 5.6), polar(to, 15.6), polar(to + 30, 10.2)], color);
  };
  arcArrow(160, 300, CORAL.base);
  arcArrow(340, 120, TEAL.base);
  arrows.shade(CORAL.base, CORAL.hi, CORAL.lo);
  arrows.shade(TEAL.base, TEAL.hi, TEAL.lo);
  c.stamp(arrows, INK);

  const trio = new PixelCanvas();
  const member = (x: number, y: number, ramp: { hi: string; base: string; lo: string }) => {
    trio.disc(x, y, 2.6, ramp.base);
    trio.set(Math.floor(x) - 1, Math.floor(y) - 1, ramp.hi);
    trio.set(Math.floor(x) + 1, Math.floor(y) + 1, ramp.lo);
  };
  member(16, 11.5, GOLD);
  member(11.5, 19.5, VIOLET);
  member(20.5, 19.5, SKY);
  c.stamp(trio, INK);
  return c.outline(INK);
}
