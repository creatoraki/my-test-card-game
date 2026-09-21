// 悬浮详情卡的几何: 设计图卡片本体 1416 宽, 等比缩到 480 宽(k ≈ 0.339)。
// 所有数值都是按设计图量出来再乘 k 取整的结果, 调整时请回到设计图重新量。

import { useId } from "react";

export const CARD = {
  /** 大头部卡(带徽章)的固定宽度。 */
  width: 480,
  /** 外框斜切。 */
  chamfer: 10,
  /** 头部内描边相对外框的内缩。 */
  innerInset: 5,
} as const;

/** 三档头部高度(含内描边): 无头部 / 紧凑头部 / 大头部。 */
export const HEAD_HEIGHT = {
  none: 0,
  compact: 62,
  hero: 123,
} as const;

/** 默认主题色 —— 与外框亮线同一色系。 */
export const DEFAULT_ACCENT = "#8fd0f0";

/** 斜切四角的矩形轮廓。 */
export function chamferRect(l: number, t: number, r: number, b: number, c: number): string {
  return `M${l + c} ${t}H${r - c}L${r} ${t + c}V${b - c}L${r - c} ${b}H${l + c}L${l} ${b - c}V${t + c}Z`;
}

/** 四角加粗的角标: 每个角沿两条边各延伸 len。 */
export function cornerBrackets(l: number, t: number, r: number, b: number, c: number, len: number): string {
  return [
    `M${l} ${t + c + len}V${t + c}L${l + c} ${t}H${l + c + len}`,
    `M${r - c - len} ${t}H${r - c}L${r} ${t + c}V${t + c + len}`,
    `M${r} ${b - c - len}V${b - c}L${r - c} ${b}H${r - c - len}`,
    `M${l + c + len} ${b}H${l + c}L${l} ${b - c}V${b - c - len}`,
  ].join("");
}

/** 四角星(径向臂 long, 横向臂 short, 腰身 waist)。 */
export function sparkPath(cx: number, cy: number, long: number, short: number, waist: number): string {
  return (
    `M${cx} ${cy - long}L${cx + waist} ${cy - waist}L${cx + short} ${cy}L${cx + waist} ${cy + waist}` +
    `L${cx} ${cy + long}L${cx - waist} ${cy + waist}L${cx - short} ${cy}L${cx - waist} ${cy - waist}Z`
  );
}

/** SVG 内部引用(url(#id))用的唯一 id; React 18 的 useId 带冒号, 需要清洗。 */
export function useSvgId(prefix: string): string {
  return `${prefix}-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
}
