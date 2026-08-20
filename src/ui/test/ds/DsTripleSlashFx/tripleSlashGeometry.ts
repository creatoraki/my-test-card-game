// ============================================================================
// 流光·三段斩(triple-strike)的几何表与时间轴锚点 —— ds 专属斩击特效 #3。
//
// 动画设计理念与 opus/NeonCrossFx 相同(那是本页签参考的「斩击动画骨架」):
//   1) 时间轴节奏一致: 起手 → 斩击段 → 静默蓄压 → 爆点 → 收尾, 组件按
//      preset.impactMs 整体平移;
//   2) 随机布局用固定种子在模块加载时烘一次, 重播逐 px 相同, 同屏多实例共用;
//   3) 这里只放「画在哪、飞多远、什么时候动」, 质感(剑光、灼痕、碎屑)留给
//      TripleSlashFx.module.css。
//
// 但动作设计与霓虹交叉斩完全不同 —— 霓虹是**双刀交叉**(对称双线 + 交点凝聚),
// 三段斩是**乱舞连斩**(一「暴」字):
//   · 起手一刀沿 38° 快速劈出并悬停(顿住的一瞬是危险, 不是预兆);
//   · 六道不同轨迹的斩击在 180ms 内爆发, 角度跨 200° 乱舞;
//   · 六连斩完目标上留下六道斩痕, 静默渗光蓄压, 爆点六芒冲击 + 碎片沿六向飞散。
// 想换一套碎裂布局只改 SEED。
// ============================================================================

const SEED = 0x54524950; // "TRIP"

// mulberry32: 32 位定点 PRNG, 与霓虹同源同款, 不引三方依赖。
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

/** 三种剑光色调。刀/火花/斩痕按此取色, 由 CSS 的 [data-tone] 落地。
    起手刀亮金, 六连快刀银白/白炽交替 —— 一重一轻, 一暖一冷。 */
export type TripleTone = "silver" | "gold" | "white";
const TONES: readonly TripleTone[] = ["silver", "silver", "gold", "gold", "white"];

// ── 时间轴(ms, 以 impact 为爆点锚) ─────────────────────────────────────────
export const TRIPLE_TIMELINE = {
  opener: 0, // 起手一刀: 沿 38° 快速劈出, 扫完即悬停
  hold: 150, // 顿住: 刀光悬停的静止时刻 —— 危险的一瞬, 不是预兆
  flurry: 250, // 六连爆发: 六道不同轨迹斩击, 180ms 内乱舞完
  scars: 500, // 斩痕渗光: 六道斩痕缓缓加深(为爆点蓄压的静默段)
  impact: 1700, // 爆点: 六芒冲击 + 碎片沿六向四散(掉血结算点)
  total: 2200, // 收尾: 斩痕余辉熄灭, 火花余烬沉降
} as const;

/** 斩线长度(px)。够长才能斜贯出 1400 见方的图层, 不在画面内看到断头。 */
export const BLADE_LENGTH = 1500;

// ── 斩击表: 起手一刀 + 六连乱舞 ───────────────────────────────────────────
// kind 决定渲染形态: opener 是「决定性的一击」——粗、慢(130ms)、亮金、
// 带拖影, 扫完后悬停(150-250ms)再淡出; flurry 是「乱舞快刀」——细、快
// (50ms/刀, 26ms 间隔, 相互重叠)、银白/白炽, 扫完即灭。
// 六连角度 -58° → 142° 跨 200°, 轨迹各不相同, 覆盖目标大半个圆周。
export interface TripleStrike {
  kind: "opener" | "flurry";
  angle: number;
  tone: TripleTone;
  at: number; // 起手时刻(ms)
  sweepMs: number; // 刀身扫出时长(ms)
  glowHeight: number; // 辉光层厚度(px)
  coreHeight: number; // 刀芯厚度(px)
  trailHeight: number; // 拖影层厚度(px, 只有 opener 渲染拖影)
}

export const SLASHES: readonly TripleStrike[] = [
  { kind: "opener", angle: 38, tone: "gold", at: TRIPLE_TIMELINE.opener, sweepMs: 130, glowHeight: 34, coreHeight: 3, trailHeight: 22 },
  { kind: "flurry", angle: -58, tone: "silver", at: 250, sweepMs: 50, glowHeight: 18, coreHeight: 1.5, trailHeight: 0 },
  { kind: "flurry", angle: -18, tone: "white", at: 276, sweepMs: 50, glowHeight: 18, coreHeight: 1.5, trailHeight: 0 },
  { kind: "flurry", angle: 22, tone: "silver", at: 302, sweepMs: 50, glowHeight: 18, coreHeight: 1.5, trailHeight: 0 },
  { kind: "flurry", angle: 62, tone: "white", at: 328, sweepMs: 50, glowHeight: 18, coreHeight: 1.5, trailHeight: 0 },
  { kind: "flurry", angle: 102, tone: "silver", at: 354, sweepMs: 50, glowHeight: 18, coreHeight: 1.5, trailHeight: 0 },
  { kind: "flurry", angle: 142, tone: "white", at: 380, sweepMs: 50, glowHeight: 18, coreHeight: 1.5, trailHeight: 0 },
];

// ── 火花: 沿刀锋迸出的短促亮点 ────────────────────────────────────────────
// 起手刀 4 颗, 六连每刀 2 颗(刀太快要不了太多); 全部跟着刀锋走。
export interface TripleSpark {
  blade: number; // 归属第几刀(索引到 SLASHES)
  along: number; // 沿刀身的位置(px, 以刀身中点为 0)
  dx: number;
  dy: number;
  size: number;
  tone: TripleTone;
  delay: number; // 相对该刀起手时刻
}

export const SPARKS: readonly TripleSpark[] = SLASHES.flatMap((blade, index) => {
  const count = blade.kind === "opener" ? 4 : 2;
  return Array.from({ length: count }, (_, i) => {
    const along = -320 + i * 200 + between(-24, 24);
    return {
      blade: index,
      along: Math.round(along),
      dx: Math.round(between(-80, 80)),
      dy: Math.round(between(-80, 80)),
      size: Math.round(between(3, 7)),
      tone: pickOne(TONES),
      delay: Math.round(between(0, 34)),
    };
  });
});

// ── 斩痕: 六连在目标上留下的灼痕, 静默段依次渗光加深, 爆点一起炸亮 ────────
// 对应六连的六道轨迹, 长度随机错落; 毛刺由 SPLINTERS 提供「刀口撕裂」毛边。
export interface TripleScar {
  blade: number; // 归属第几刀(索引到 SLASHES, 只用六连的 1..6)
  length: number; // 斩痕长度(px), 比刀身短, 落在目标身上
  delay: number; // 相对 scars
}

export const SCARS: readonly TripleScar[] = SLASHES.slice(1).map((_, index) => ({
  blade: index + 1,
  length: Math.round(480 + between(0, 200)),
  delay: Math.round(index * 38 + between(0, 24)),
}));

// ── 毛刺: 从斩痕两侧伸出的细短裂线, 让斩痕有「刀口撕裂」的毛边 ────────────
export interface TripleSplinter {
  blade: number;
  along: number; // 沿斩痕的位置(px, 以斩痕中点为 0)
  side: 1 | -1; // 垂直方向哪一侧
  length: number;
  delay: number; // 相对 scars
}

export const SPLINTERS: readonly TripleSplinter[] = SCARS.flatMap((scar, sIndex) =>
  Array.from({ length: 3 }, (_, index) => ({
    blade: scar.blade,
    along: Math.round(-220 + index * 220 + between(-28, 28)),
    side: (index % 2 === 0 ? 1 : -1) as 1 | -1,
    length: Math.round(between(24, 68)),
    delay: Math.round(scar.delay + index * 40 + between(0, 30)),
  })),
);

// ── 六芒: 爆点时沿六连方向射出的光芒, 给爆点「乱斩方向」的收束感 ───────────
export interface TripleMantle {
  blade: number;
  distance: number; // 射出距离(px)
  width: number; // 根部宽度(px)
}

export const MANTLES: readonly TripleMantle[] = SLASHES.slice(1).map((_, index) => ({
  blade: index + 1,
  distance: Math.round(260 + between(0, 160)),
  width: Math.round(8 + index * 1.6),
}));

// ── 碎片: 爆点时沿各自归属刀向四散的细长残片 ───────────────────────────────
// 与霓虹的网格崩解不同: 每片碎片记着自己是被哪一刀劈下来的, 沿该刀角度
// ± 18° 的锥形范围飞出 —— 「顺着刀的方向飞」, 六向各有碎片。
export interface TripleFragment {
  blade: number; // 归属第几刀(索引到 SLASHES, 只用六连的 1..6)
  angle: number; // 碎片自身朝向(deg) = 刀角 + 锥内偏移
  length: number;
  distance: number; // 沿朝向飞出的距离(px)
  offset: number; // 出生点距中心的距离(px)
  tone: TripleTone;
  delay: number; // 相对 impact
}

export const FRAGMENTS: readonly TripleFragment[] = SLASHES.slice(1).flatMap((blade, index) =>
  Array.from({ length: 8 }, (_, i) => ({
    blade: index + 1,
    angle: Math.round(blade.angle + between(-18, 18)),
    length: Math.round(between(30, 88)),
    distance: Math.round(between(180, 440)),
    offset: Math.round(between(16, 96)),
    tone: pickOne(TONES),
    delay: Math.round((i / 8) * 110 + between(0, 30)),
  })),
);

// ── 余烬: 爆点后散落的小亮点, 短暂上浮后沉降熄灭 ──────────────────────────
export interface TripleAsh {
  dx: number;
  dy: number;
  size: number;
  delay: number; // 相对 impact
}

export const ASHES: readonly TripleAsh[] = Array.from({ length: 12 }, () => ({
  dx: Math.round(between(-170, 170)),
  dy: Math.round(between(-40, 150)),
  size: Math.round(between(2, 5)),
  delay: Math.round(between(140, 340)),
}));
