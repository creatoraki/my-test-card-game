// ============================================================================
// 霓虹数据·交叉斩(neon-cross)的几何表与时间轴锚点。
//
// 与 blade-slash / blood-slash 的分工一致: 这里只放「画在哪、飞多远、什么时候动」,
// 具体质感(发光、混色、模糊)留给 NeonCrossFx.module.css。
//
// 随机布局用固定种子在模块加载时烘一次, 不在渲染期算:
//   1) 重播(key 换新)时布局逐 px 相同, 便于逐帧比对调参;
//   2) 同屏多实例共用一份表, 不额外分配;
//   3) 不需要 useMemo, 组件保持纯映射。
// 想换一套碎裂布局只改 SEED。
// ============================================================================

const SEED = 0x4e454f4e; // "NEON"

// mulberry32: 32 位定点 PRNG, 够均匀且实现只有几行, 不引三方依赖。
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rnd = mulberry32(SEED);
const between = (min: number, max: number) => min + rnd() * (max - min);
const pickOne = <T,>(list: readonly T[]) => list[Math.floor(rnd() * list.length)]!;

/** 三种霓虹色调。碎片/火花/像素块按此取色, 由 CSS 的 [data-tone] 落地。 */
export type NeonTone = "cyan" | "magenta" | "white";
const TONES: readonly NeonTone[] = ["cyan", "cyan", "magenta", "magenta", "white"];

// ── 时间轴(ms, 以 impact 为爆点锚) ─────────────────────────────────────────
// 组件按 preset.impactMs 与 impact 的差值整体平移, 所以调节奏只改这一张表。
export const NEON_TIMELINE = {
  scanIn: 0, // 目标区浮现扫描线 + 轻微色差, 这是「被锁定」的预警
  bladeA: 550, // 第一刀 ↘ 青蓝刃贯穿
  bladeB: 750, // 第二刀 ↗ 品红刃反向贯穿
  core: 950, // 交点凝聚白核 + 全屏色差错位一帧
  crack: 1400, // 静默后十字裂痕缓缓张开(留白是为了给爆点让出对比)
  impact: 1700, // 爆点: 像素方块崩解 + 数据碎片四散
  total: 2200, // 扫描线消散收尾
} as const;

/** 斩线长度(px)。够长才能斜贯出 1400 见方的图层, 不在画面内看到断头。 */
export const BLADE_LENGTH = 1500;

// ── 两刀 ────────────────────────────────────────────────────────────────
// angle 为 CSS rotate 角度(正 = 顺时针): 34° 是自左上砍向右下的 ↘,
// -46° 是自左下挑向右上的 ↗。两者夹角 80°, 刻意不取正交 —— 略微失衡的十字
// 比标准的 + 字更有手感, 也和 blade-slash 的单斜线拉开构图差异。
export interface NeonBlade {
  angle: number;
  tone: Exclude<NeonTone, "white">;
  at: number; // 起手时刻(ms)
}

export const BLADES: readonly NeonBlade[] = [
  { angle: 34, tone: "cyan", at: NEON_TIMELINE.bladeA },
  { angle: -46, tone: "magenta", at: NEON_TIMELINE.bladeB },
];

// ── 扫描线: 预警段铺在目标区上的横向霓虹细线 ──────────────────────────────
export interface NeonScanline {
  y: number; // 相对图层中心的纵向偏移(px)
  width: number;
  opacity: number;
  delay: number; // 相对 scanIn
  duration: number;
}

export const SCANLINES: readonly NeonScanline[] = Array.from({ length: 16 }, (_, index) => {
  const y = -300 + index * 40 + between(-6, 6);
  return {
    y: Math.round(y),
    width: Math.round(between(360, 620)),
    opacity: Number(between(0.18, 0.55).toFixed(2)),
    delay: Math.round(index * 26 + between(0, 60)),
    duration: Math.round(between(900, 1500)),
  };
});

// ── 刀锋火花: 沿斩线迸出的短促亮点 ───────────────────────────────────────
export interface NeonSpark {
  blade: number; // 归属第几刀(索引到 BLADES)
  along: number; // 沿刀身的位置(px, 以刀身中点为 0)
  dx: number;
  dy: number;
  size: number;
  delay: number; // 相对该刀起手时刻
}

export const SPARKS: readonly NeonSpark[] = BLADES.flatMap((_, blade) =>
  Array.from({ length: 14 }, (_, index) => {
    const along = -420 + index * 65 + between(-18, 18);
    return {
      blade,
      along: Math.round(along),
      dx: Math.round(between(-90, 90)),
      dy: Math.round(between(-90, 90)),
      size: Math.round(between(4, 9)),
      // 火花跟着刀锋走: 越靠右的位置越晚亮, 视觉上就是「刀扫到哪炸到哪」。
      delay: Math.round(((along + 450) / 900) * 150 + between(0, 40)),
    };
  }),
);

// ── 色差错位条: 白核成形那一帧, 画面被撕成几条横向错位的「坏帧」 ─────────
export interface NeonGlitchBar {
  y: number;
  height: number;
  dx: number; // 横向错位量(px), 正负都有
  delay: number; // 相对 core
}

export const GLITCH_BARS: readonly NeonGlitchBar[] = Array.from({ length: 9 }, (_, index) => ({
  y: Math.round(-320 + index * 78 + between(-10, 10)),
  height: Math.round(between(14, 58)),
  dx: Math.round(between(-70, 70)),
  delay: Math.round(between(0, 90)),
}));

// ── 像素方块: 爆点时目标区按网格崩解 ─────────────────────────────────────
export interface NeonPixel {
  x: number;
  y: number;
  size: number;
  dx: number; // 飞散位移(px), 方向自中心向外
  dy: number;
  rotate: number; // 飞散过程中的自转(deg)
  tone: NeonTone;
  delay: number; // 相对 impact
}

const PIXEL_GRID = 22; // 对齐到网格, 崩解才像「像素」而不是随机噪点

export const PIXELS: readonly NeonPixel[] = Array.from({ length: 78 }, () => {
  const x = Math.round(between(-11, 11)) * PIXEL_GRID;
  const y = Math.round(between(-11, 11)) * PIXEL_GRID;
  const dist = Math.hypot(x, y) || 1;
  const speed = between(150, 460);
  return {
    x,
    y,
    size: PIXEL_GRID * (rnd() < 0.22 ? 2 : 1) - Math.round(between(2, 8)),
    dx: Math.round((x / dist) * speed + between(-40, 40)),
    dy: Math.round((y / dist) * speed + between(-40, 40)),
    rotate: Math.round(between(-180, 180)),
    tone: pickOne(TONES),
    delay: Math.round((dist / 340) * 90 + between(0, 90)), // 由内向外逐圈解体
  };
});

// ── 数据碎片: 爆点时四散的细长条, 补足像素块之外的方向感 ──────────────────
export interface NeonShard {
  angle: number; // 碎片自身朝向(deg)
  length: number;
  distance: number; // 沿朝向飞出的距离(px)
  offset: number; // 出生点距中心的距离(px)
  tone: NeonTone;
  delay: number; // 相对 impact
}

export const SHARDS: readonly NeonShard[] = Array.from({ length: 30 }, (_, index) => ({
  angle: Math.round((index / 30) * 360 + between(-14, 14)),
  length: Math.round(between(46, 168)),
  distance: Math.round(between(220, 560)),
  offset: Math.round(between(20, 120)),
  tone: pickOne(TONES),
  delay: Math.round(between(0, 130)),
}));
