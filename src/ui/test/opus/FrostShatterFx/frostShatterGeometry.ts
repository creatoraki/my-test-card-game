// ============================================================================
// 霜结·碎冰交叉斩(frost-shatter)的几何表与时间轴锚点。
//
// 与同目录 neon-cross 的分层完全一致: 这里只放「画在哪、飞多远、什么时候动」,
// 具体质感(冰色、辉光、模糊)留给 FrostShatterFx.module.css。
//
// 随机布局用固定种子在模块加载时烘一次, 不在渲染期算:
//   1) 重播(key 换新)时布局逐 px 相同, 便于逐帧比对调参;
//   2) 同屏多实例共用一份表, 不额外分配;
//   3) 不需要 useMemo, 组件保持纯映射。
// 想换一套碎裂布局只改 SEED。
// ============================================================================

const SEED = 0x46524f53; // "FROS"

// mulberry32: 32 位定点 PRNG, 够均匀且实现只有几行, 不引三方依赖。
// 刻意不与 neon 的几何表共用工具: 每份几何表自包含, 改一款不牵动另一款。
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

/** 三种寒色调。碎块/霜屑/冰针按此取色, 由 CSS 的 [data-tone] 落地。 */
export type FrostTone = "ice" | "violet" | "white";
const TONES: readonly FrostTone[] = ["ice", "ice", "ice", "violet", "violet", "white"];

// ── 时间轴(ms, 以 impact 为爆点锚) ─────────────────────────────────────────
// 组件按 preset.impactMs 与 impact 的差值整体平移, 所以调节奏只改这一张表。
export const FROST_TIMELINE = {
  frostIn: 0, // 目标区结霜: 放射霜纹自脚下蔓延, 这是「被冻住」的预警
  bladeA: 550, // 第一刀 ↗ 冰蓝刃自左下挑起
  bladeB: 750, // 第二刀 ↘ 淡紫刃反向劈落
  core: 950, // 交点凝聚冰晶核 + 一圈结霜脉冲
  crack: 1400, // 静默后冰面龟裂缓缓撑开(留白是为了给爆点让出对比)
  impact: 1700, // 爆点: 冰晶碎块崩解 + 冰针四散
  total: 2200, // 寒气雾消散收尾
} as const;

/** 斩线长度(px)。够长才能斜贯出 1400 见方的图层, 不在画面内看到断头。 */
export const BLADE_LENGTH = 1500;

// ── 两刀 ────────────────────────────────────────────────────────────────
// angle 为 CSS rotate 角度(正 = 顺时针): -38° 是自左下挑向右上的 ↗,
// 42° 是自左上劈向右下的 ↘。夹角 80° 同样不取正交, 但先挑后劈的顺序与整体镜像
// 让它与 neon-cross 的「先↘后↗」一眼可分。
export interface FrostBlade {
  angle: number;
  tone: Exclude<FrostTone, "white">;
  at: number; // 起手时刻(ms)
}

export const BLADES: readonly FrostBlade[] = [
  { angle: -38, tone: "ice", at: FROST_TIMELINE.bladeA },
  { angle: 42, tone: "violet", at: FROST_TIMELINE.bladeB },
];

// ── 霜纹: 预警段自目标中心向外放射蔓延的结霜细线 ──────────────────────────
// 与 neon 的横向扫描线相对: 那边是「被扫描锁定」, 这边是「寒气从脚下爬上来」,
// 所以取放射构图并让下半圈更密(angle 偏置到 0~360 但长度按朝下加成)。
export interface FrostRime {
  angle: number; // 放射朝向(deg)
  length: number;
  width: number;
  opacity: number;
  delay: number; // 相对 frostIn
  duration: number;
}

export const RIMES: readonly FrostRime[] = Array.from({ length: 16 }, (_, index) => {
  const angle = (index / 16) * 360 + between(-11, 11);
  // sin>0 = 朝下半圈: 霜是从地面爬起来的, 下半圈拉长一截更符合直觉。
  const downward = Math.max(0, Math.sin((angle * Math.PI) / 180));
  return {
    angle: Math.round(angle),
    length: Math.round(between(220, 340) + downward * 140),
    width: Math.round(between(2, 5)),
    opacity: Number(between(0.22, 0.6).toFixed(2)),
    delay: Math.round(index * 24 + between(0, 70)),
    duration: Math.round(between(900, 1500)),
  };
});

// ── 霜屑: 沿斩线迸出的细碎冰粒 ───────────────────────────────────────────
export interface FrostMote {
  blade: number; // 归属第几刀(索引到 BLADES)
  along: number; // 沿刀身的位置(px, 以刀身中点为 0)
  dx: number;
  dy: number;
  size: number;
  delay: number; // 相对该刀起手时刻
}

export const MOTES: readonly FrostMote[] = BLADES.flatMap((_, blade) =>
  Array.from({ length: 15 }, (_, index) => {
    const along = -420 + index * 60 + between(-18, 18);
    return {
      blade,
      along: Math.round(along),
      dx: Math.round(between(-80, 80)),
      // +40 的重力偏置: 霜屑是「掉」下去的, 不像火花那样纯放射。
      dy: Math.round(between(-60, 100) + 40),
      size: Math.round(between(3, 8)),
      // 霜屑跟着刀锋走: 越靠右的位置越晚亮, 视觉上就是「刀扫到哪冻到哪」。
      delay: Math.round(((along + 450) / 900) * 150 + between(0, 50)),
    };
  }),
);

// ── 结霜脉冲环: 冰晶核成形那一帧, 一圈圈寒气向外推 ───────────────────────
// 对应 neon 的横向色差坏帧 —— 那是数码故障, 这里换成同心脉冲, 质感不撞。
export interface FrostPulse {
  scale: number; // 终点缩放倍率
  width: number; // 环线粗细(px)
  delay: number; // 相对 core
  tone: FrostTone;
}

export const FROST_RINGS: readonly FrostPulse[] = Array.from({ length: 6 }, (_, index) => ({
  scale: Number((1.2 + index * 0.42 + between(-0.1, 0.1)).toFixed(2)),
  width: Math.round(between(1, 4)),
  delay: Math.round(index * 55 + between(0, 40)),
  tone: pickOne(TONES),
}));

// ── 冰晶碎块: 爆点时目标区整块炸开 ───────────────────────────────────────
// 与 neon 的像素网格相对: 那边刻意对齐网格才像「像素崩解」, 这边用极坐标环形
// 分布 + 多边形轮廓, 才像「实体冰块崩碎」。
export interface FrostChunk {
  x: number;
  y: number;
  size: number;
  dx: number; // 飞散位移(px), 方向自中心向外
  dy: number;
  rotate: number; // 飞散过程中的自转(deg)
  tone: FrostTone;
  shape: 0 | 1 | 2; // clip-path 轮廓变体(三角 / 菱形 / 不规则五边形)
  delay: number; // 相对 impact
}

export const ICE_CHUNKS: readonly FrostChunk[] = Array.from({ length: 64 }, (_, index) => {
  const angle = (index / 64) * 360 * 3 + between(-20, 20); // 绕三圈铺开, 疏密自然
  const radius = between(20, 250);
  const rad = (angle * Math.PI) / 180;
  const x = Math.round(Math.cos(rad) * radius);
  const y = Math.round(Math.sin(rad) * radius);
  const speed = between(180, 520);
  return {
    x,
    y,
    size: Math.round(between(10, 46)),
    dx: Math.round(Math.cos(rad) * speed + between(-40, 40)),
    // 碎冰同样带一点下坠, 与霜屑一致。
    dy: Math.round(Math.sin(rad) * speed + between(-20, 70)),
    rotate: Math.round(between(-220, 220)),
    tone: pickOne(TONES),
    shape: Math.floor(rnd() * 3) as 0 | 1 | 2,
    delay: Math.round((radius / 250) * 100 + between(0, 90)), // 由内向外逐圈解体
  };
});

// ── 冰针: 爆点时四散的细长条, 补足碎块之外的方向感 ────────────────────────
export interface FrostSplinter {
  angle: number; // 冰针自身朝向(deg)
  length: number;
  distance: number; // 沿朝向飞出的距离(px)
  offset: number; // 出生点距中心的距离(px)
  tone: FrostTone;
  delay: number; // 相对 impact
}

export const SPLINTERS: readonly FrostSplinter[] = Array.from({ length: 30 }, (_, index) => ({
  angle: Math.round((index / 30) * 360 + between(-14, 14)),
  length: Math.round(between(40, 150)),
  distance: Math.round(between(220, 560)),
  offset: Math.round(between(20, 120)),
  tone: pickOne(TONES),
  delay: Math.round(between(0, 130)),
}));
