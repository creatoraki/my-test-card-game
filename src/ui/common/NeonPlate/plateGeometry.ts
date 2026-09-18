// 切角牌面几何：切角按像素计算，任意宽高下都不会被拉伸变形。

export interface Chamfer {
  tl: number;
  tr: number;
  br: number;
  bl: number;
}

const round = (value: number) => Math.round(value * 100) / 100;

/** 内缩 inset 后的切角轮廓；切角随内缩同步收窄，保持与外框平行。 */
export function chamferPath(w: number, h: number, c: Chamfer, inset = 0): string {
  const i = inset;
  const k = (size: number) => Math.max(0, size - i * 0.414);
  const [tl, tr, br, bl] = [k(c.tl), k(c.tr), k(c.br), k(c.bl)];
  const points = [
    [i, i + tl], [i + tl, i],
    [w - i - tr, i], [w - i, i + tr],
    [w - i, h - i - br], [w - i - br, h - i],
    [i + bl, h - i], [i, h - i - bl],
  ];
  return `M${points.map(([x, y]) => `${round(x)} ${round(y)}`).join("L")}Z`;
}

/** 左上、右下两处切角的高光折角：斜边加两端短延伸。 */
export function cornerAccentPath(w: number, h: number, c: Chamfer, inset = 1, reach = 14): string {
  const i = inset;
  const tl = `M${i} ${i + c.tl + reach}V${i + c.tl}L${i + c.tl} ${i}H${i + c.tl + reach}`;
  const br = `M${w - i} ${h - i - c.br - reach}V${h - i - c.br}L${w - i - c.br} ${h - i}H${w - i - c.br - reach}`;
  return `${tl}${br}`;
}
