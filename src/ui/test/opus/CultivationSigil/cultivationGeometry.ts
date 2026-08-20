// 「培育植物」BUFF 图标的几何层 —— 纯数据 / 纯函数, 不含 React, 不含样式。
//
// ★ 为什么把几何单独抽出来: 这两枚图标的构图是**算出来的**(六瓣阵列、刻度环、进度弧的
//   dasharray), 手写 path 字面量既改不动也读不懂。几何进这一层, 组件只负责把它摆上画布。
// ⚠ 所有坐标都在 128×128 的图标画布内, 与最终渲染尺寸无关 —— 图标靠 viewBox 缩放,
//   调用方给多大就多大, 这里不要出现任何真实 px 的假设。

/** 图标画布边长。1:1 的唯一真相: viewBox 恒为 `0 0 128 128`。 */
export const SIGIL_VIEWBOX = 128;

/** 画布中心。 */
export const CENTER = SIGIL_VIEWBOX / 2;

const TAU = Math.PI * 2;

/** 极坐标取点: 角度以 12 点方向为 0°, 顺时针为正 —— 与徽记的阅读方向一致。 */
export function polarPoint(deg: number, radius: number): { x: number; y: number } {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: CENTER + Math.cos(rad) * radius, y: CENTER + Math.sin(rad) * radius };
}

export type Tick = { key: string; x1: number; y1: number; x2: number; y2: number; long: boolean };

/**
 * 环形刻度: 沿半径 `outer` 均分 `count` 根短线, 每 `longEvery` 根加长一次。
 * 长短交替是为了在小尺寸下仍有节奏感 —— 全等长的刻度缩到 20px 会糊成一圈灰边。
 */
export function ringTicks(
  count: number,
  outer: number,
  shortLen: number,
  longLen: number,
  longEvery: number,
  offsetDeg = 0,
): Tick[] {
  return Array.from({ length: count }, (_, i) => {
    const deg = offsetDeg + (i * 360) / count;
    const long = i % longEvery === 0;
    const a = polarPoint(deg, outer);
    const b = polarPoint(deg, outer - (long ? longLen : shortLen));
    return { key: `t${i}`, x1: a.x, y1: a.y, x2: b.x, y2: b.y, long };
  });
}

/**
 * 共用外框: 切角方形(八边形)。
 * 两枚图标构图完全不同, 但**外框同规格** —— 并排陈列时边界对得齐, 一眼是同一套 BUFF。
 */
export function cutSquarePath(half: number, cut: number): string {
  const lo = CENTER - half;
  const hi = CENTER + half;
  return [
    `M${lo + cut} ${lo}`,
    `H${hi - cut}`,
    `L${hi} ${lo + cut}`,
    `V${hi - cut}`,
    `L${hi - cut} ${hi}`,
    `H${lo + cut}`,
    `L${lo} ${hi - cut}`,
    `V${lo + cut}`,
    "Z",
  ].join("");
}

/**
 * 进度弧的 dasharray: 让一段圆弧只画出 `ratio` 圈。
 * 培育中用未满的弧(生长未完成), 完成态用满圈 —— 两态的核心语义差别就压在这个数上。
 */
export function arcDash(radius: number, ratio: number): string {
  const circumference = TAU * radius;
  return `${circumference * ratio} ${circumference}`;
}

/** 圆周长, 给 dashoffset 动画用。 */
export function circumference(radius: number): number {
  return TAU * radius;
}

// ── 培育中: 土壤剖面 ──────────────────────────────────────────────

/** 土层: 三条下凹的地层线, 越深越淡。dip 是中段下垂量, 决定"剖面"的透视感。 */
export const SOIL_STRATA: { key: string; y: number; dip: number; opacity: number; halfWidth: number }[] = [
  { key: "s0", y: 80, dip: 5, opacity: 0.85, halfWidth: 40 },
  { key: "s1", y: 93, dip: 7, opacity: 0.5, halfWidth: 34 },
  { key: "s2", y: 104, dip: 8, opacity: 0.28, halfWidth: 26 },
];

/** 一条地层线的 path。 */
export function strataPath(y: number, dip: number, halfWidth: number): string {
  const x1 = CENTER - halfWidth;
  const x2 = CENTER + halfWidth;
  return `M${x1} ${y}Q${CENTER} ${y + dip} ${x2} ${y}`;
}

/**
 * 种荚轮廓: 一枚上尖下圆的闭合荚, 中缝把它分成对开的两半。
 * `lean` 让荚体微微偏一侧, 避免完全左右对称带来的呆板。
 */
export const POD = {
  cx: CENTER,
  cy: 62,
  halfWidth: 13,
  top: 44,
  bottom: 78,
} as const;

export function podPath(): string {
  const { cx, halfWidth, top, bottom } = POD;
  const w = halfWidth;
  return (
    `M${cx} ${top}` +
    `C${cx + w} ${top + 8} ${cx + w} ${bottom - 10} ${cx} ${bottom}` +
    `C${cx - w} ${bottom - 10} ${cx - w} ${top + 8} ${cx} ${top}` +
    "Z"
  );
}

/** 须根: 从荚底向下岔开的两条主根 + 各一条侧须。 */
export const ROOT_PATHS = [
  `M${CENTER} ${POD.bottom}C${CENTER - 3} 86 ${CENTER - 9} 92 ${CENTER - 15} 100`,
  `M${CENTER} ${POD.bottom}C${CENTER + 3} 86 ${CENTER + 8} 93 ${CENTER + 13} 102`,
  `M${CENTER - 6} 90q-6 2-10 8`,
  `M${CENTER + 5} 89q6 3 9 9`,
] as const;

// ── 培育完成: 花冠纹章 ────────────────────────────────────────────

/** 完成态花瓣数。外圈刻度也按这个数对齐, 改一处两处都跟着动。 */
export const PETAL_COUNT = 6;

/**
 * 一枚朝上的花瓣(杏仁形), 起点与终点都在中心, 便于整体按 60° 阵列旋转。
 * tipR = 瓣尖到中心的距离; waist = 腰宽; belly = 腰部所在的高度比例。
 */
export function petalPath(tipR: number, waist: number, belly = 0.55): string {
  const tipY = CENTER - tipR;
  const waistY = CENTER - tipR * belly;
  const neckY = CENTER - tipR * 0.16;
  return (
    `M${CENTER} ${CENTER}` +
    `C${CENTER - waist * 0.5} ${neckY} ${CENTER - waist} ${waistY} ${CENTER} ${tipY}` +
    `C${CENTER + waist} ${waistY} ${CENTER + waist * 0.5} ${neckY} ${CENTER} ${CENTER}` +
    "Z"
  );
}

/** 花瓣阵列的旋转角表(度)。 */
export const PETAL_ANGLES = Array.from({ length: PETAL_COUNT }, (_, i) => (i * 360) / PETAL_COUNT);

/** 完成勾记: 托带中央那一笔, 短促、居中、只在完成态出现。 */
export const CHECK_PATH = `M${CENTER - 7} ${CENTER + 38}l5 5 9-11`;
