// 「培育 / 成熟」两枚 BUFF 图标的几何层 —— 纯数据 / 纯函数, 不含 React, 不含样式。
//
// ★ 为什么单独抽一层: 这两枚图标的外环(刻度、未闭合比例)与成熟态的冠层是**算出来的**,
//   手写 12 根刻度线和 6 片花瓣的 path 字面量既改不动也读不懂。
// ⚠ 所有坐标都在 64×64 的画布内(与 luna 塔罗图标同规格), 与最终渲染尺寸无关 ——
//   图标靠 viewBox 缩放, 调用方给多大就多大, 这里不要出现任何真实 px 的假设。

/** 图标画布边长。1:1 的唯一真相: viewBox 恒为 `0 0 64 64`。 */
export const PLATE_VIEWBOX = 64;

/** 画布中心。 */
export const CENTER = PLATE_VIEWBOX / 2;

/** 外环半径。两态共用 —— 并排时边界对得齐, 一眼是同一族 BUFF。 */
export const RING_R = 25.5;

/** 冠层 / 芽尖的汇聚点。两态的"生长顶端"都落在这个高度上。 */
export const CROWN_Y = 27;

const TAU = Math.PI * 2;

const round = (n: number) => Number(n.toFixed(2));

/** 极坐标取点: 0° 指向 12 点方向, 顺时针为正 —— 与图标的阅读方向一致。 */
export function polarPoint(deg: number, radius: number, cx = CENTER, cy = CENTER) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: round(cx + Math.cos(rad) * radius), y: round(cy + Math.sin(rad) * radius) };
}

/**
 * 外环的 dasharray: 让一圈圆只画出 `ratio` 圈。
 * 培育用未闭合(还在长), 成熟用满圈(已完成) —— 两态最核心的语义差就压在这个数上。
 */
export function ringDash(ratio: number, radius = RING_R): string {
  const c = TAU * radius;
  return `${round(c * ratio)} ${round(c)}`;
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

// ── 同源三件: 两态共用的地面 / 中轴 / 刻度 ────────────────────────

/** 土壤剖面: 两条下凹的地层线, 越深越淡。两态都从这条地平线上长出来。 */
export const SOIL_STRATA: { key: string; d: string; opacity: number }[] = [
  { key: "soil0", d: "M11 45q21 5 42 0", opacity: 0.9 },
  { key: "soil1", d: "M16 50.5q16 4 32 0", opacity: 0.46 },
];

/** 地表刻度: 两态共用的 12 根环刻度。 */
export const RING_TICKS = ringTicks(12, RING_R, 1.6, 3, 3);

// ── 培育: 破土幼芽 + 未闭合倒计时环 ──────────────────────────────

/** 培育态外环画到几圈。0.62 圈 = "还差一截", 断口留在右下。 */
export const CULTIVATE_RATIO = 0.62;

/** 断口起始角: 让缺口落在右下方, 不去压顶端的芽尖。 */
export const CULTIVATE_RING_ROTATE = 140;

/** 弧线末端的游标点 —— 倒计时"当前进度"落在哪。 */
export const CULTIVATE_CURSOR = polarPoint(
  CULTIVATE_RING_ROTATE + 360 * CULTIVATE_RATIO - 90,
  RING_R,
);

/** 嫩茎: 从地平线直上到芽颈。 */
export const SPROUT_STEM = `M${CENTER} 45.5V${CROWN_Y}`;

/** 裂土缝: 破土的两道短斜线, 只在培育态出现。 */
export const SOIL_CRACKS = "M28.6 45.2 26 47.8M35.4 45.2 38 47.8";

/** 单片子叶(朝右)。另一片靠镜像同一条路径画出 —— 两片必须完全对称。 */
export const SPROUT_LEAF = "M32 38.4c5.4-.8 8.6-3.8 9.2-9-5.8.4-8.8 3.4-9.2 9Z";

/** 叶脉: 与子叶同源的一条内线。 */
export const SPROUT_VEIN = "M33 37.2c2.8-1 5-3.2 6.4-6.2";

/** 未展开的芽尖: 上尖下平的闭合苞。 */
export const SPROUT_BUD = `M${CENTER} 16.4c3.5 3.1 4.7 6.8 3.6 11.1h-7.2c-1.1-4.3.1-8 3.6-11.1Z`;

/** 苞缝 + 芽心亮片(唯一一处实心)。 */
export const SPROUT_SEAM = `M${CENTER} 18.6v8.9`;
export const SPROUT_SPARK = `m${CENTER} 20 2 3-2 3.4-2-3.4Z`;

// ── 成熟: 绽放冠层 + 闭合完成环 ──────────────────────────────────

/** 成熟态花瓣数。外环的完成刻痕与它同源, 改一处两处都跟着动。 */
export const PETAL_COUNT = 6;

/** 花瓣阵列的旋转角表(度)。 */
export const PETAL_ANGLES = Array.from({ length: PETAL_COUNT }, (_, i) => (i * 360) / PETAL_COUNT);

/**
 * 一枚朝上的花瓣(杏仁形), 起点与终点都在冠心, 便于整体按 60° 阵列旋转。
 * tipR = 瓣尖到冠心的距离; waist = 腰宽。
 */
export function petalPath(tipR: number, waist: number, cx = CENTER, cy = CROWN_Y): string {
  const tipY = round(cy - tipR);
  const waistY = round(cy - tipR * 0.62);
  const neckY = round(cy - tipR * 0.18);
  return (
    `M${cx} ${cy}` +
    `C${round(cx - waist * 0.45)} ${neckY} ${round(cx - waist)} ${waistY} ${cx} ${tipY}` +
    `C${round(cx + waist)} ${waistY} ${round(cx + waist * 0.45)} ${neckY} ${cx} ${cy}` +
    "Z"
  );
}

/** 外冠(大瓣)与内冠(小瓣, 错开 30°)。 */
export const CROWN_OUTER = petalPath(11, 5.4);
export const CROWN_INNER = petalPath(6.6, 3.2);

/** 主干: 成熟态粗一档, 且只露出冠层以下的一小截。 */
export const MATURE_STEM = `M${CENTER} 45.5V${CROWN_Y + 6}`;

/** 托叶: 结果后垂下的两片, 与培育态的上扬子叶正好反向。 */
export const MATURE_SEPALS = "M25.4 40.4c2.8.8 4.8 2.4 6.2 4.8M38.6 40.4c-2.8.8-4.8 2.4-6.2 4.8";

/** 果实轮廓 + 果心亮片(唯一一处实心)。 */
export const FRUIT_R = 4.6;
export const FRUIT_SPARK = `m${CENTER} 24.3 1.9 2.7-1.9 3-1.9-3Z`;

/** 完成勾记: 压在外环底部的一笔, 只在成熟态出现。 */
export const MATURE_CHECK = `m28.4 55.4 2.7 2.7 5.5-6.2`;
