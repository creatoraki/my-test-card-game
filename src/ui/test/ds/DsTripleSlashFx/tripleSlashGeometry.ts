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
//   · 六道不同轨迹的斩击逐刀爆发, 角度跨 200° 乱舞;
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
  wind: 380, // 压刀蓄力: 刀光回抽压低、亮度沉下 —— 爆发前的预备动作
  shatter: 460, // 崩断退场: 首刀原地碎成数段弹开 + 残影扇开 + 崩断火花 (收束环 = shatter + 10)
  ignite: 850, // 出鞘白闪: 中心骤亮一瞬(50ms), 六连第一刀随后从这枚白闪里劈出
  flurry: 880, // 六连爆发: 崩断后留白 420ms 再爆发 —— 崩断余波散尽、屏息一瞬, 白闪引路、刀再出鞘
  scars: 1800, // 斩痕渗光: 六道斩痕缓缓加深(为爆点蓄压的静默段)
  impact: 2200, // 爆点: 六芒冲击 + 碎片沿六向四散(掉血结算点)
  total: 2700, // 收尾: 斩痕余辉熄灭, 火花余烬沉降
} as const;

/** 斩线长度(px)。够长才能斜贯出 1400 见方的图层, 不在画面内看到断头。 */
export const BLADE_LENGTH = 1500;

// ── 斩击表: 起手一刀 + 六连乱舞 ───────────────────────────────────────────
// kind 决定渲染形态: opener 是「决定性的一击」——粗、慢(130ms)、亮金、
// 带拖影, 扫完后悬停(150-380ms) → 压刀蓄力 → 原地崩断(见文件末尾的
// 「转场段」); flurry 是「乱舞快刀」——细、
// 190ms/刀(扫出 130ms + 渐隐 60ms)、140ms 间隔相互重叠、银白/白炽,
// 扫完即灭。六连角度 -58° → 142° 跨 200°, 轨迹各不相同, 覆盖目标大半个圆周。
export interface TripleStrike {
  kind: "opener" | "flurry";
  angle: number;
  tone: TripleTone;
  at: number; // 起手时刻(ms)
  sweepMs: number; // 刀身扫出时长(ms)
  fadeMs: number; // 扫完后的渐隐时长(ms); flurry 总动画时长 = sweepMs + fadeMs
  glowHeight: number; // 辉光层厚度(px)
  coreHeight: number; // 刀芯厚度(px)
  trailHeight: number; // 拖影层厚度(px, 只有 opener 渲染拖影)
}

export const SLASHES: readonly TripleStrike[] = [
  { kind: "opener", angle: 38, tone: "gold", at: TRIPLE_TIMELINE.opener, sweepMs: 130, fadeMs: 0, glowHeight: 34, coreHeight: 3, trailHeight: 22 },
  { kind: "flurry", angle: -58, tone: "silver", at: 880, sweepMs: 130, fadeMs: 60, glowHeight: 24, coreHeight: 2.2, trailHeight: 0 },
  { kind: "flurry", angle: -18, tone: "white", at: 1020, sweepMs: 130, fadeMs: 60, glowHeight: 21, coreHeight: 1.8, trailHeight: 0 },
  { kind: "flurry", angle: 22, tone: "silver", at: 1160, sweepMs: 130, fadeMs: 60, glowHeight: 18, coreHeight: 1.5, trailHeight: 0 },
  { kind: "flurry", angle: 62, tone: "white", at: 1300, sweepMs: 130, fadeMs: 60, glowHeight: 18, coreHeight: 1.5, trailHeight: 0 },
  { kind: "flurry", angle: 102, tone: "silver", at: 1440, sweepMs: 130, fadeMs: 60, glowHeight: 18, coreHeight: 1.5, trailHeight: 0 },
  { kind: "flurry", angle: 142, tone: "white", at: 1580, sweepMs: 130, fadeMs: 60, glowHeight: 18, coreHeight: 1.5, trailHeight: 0 },
];

// ── 火花: 沿刀锋迸出的短促亮点 ────────────────────────────────────────────
// 起手刀 4 颗跟刀锋, 六连每刀 2 颗。收刀瞬间的火花不在这里 —— 那是转场演出的
// 一部分, 归 SHATTER_SPARKS(见文件末尾的「转场段」)。
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
  const sparks = Array.from({ length: count }, (_, i) => {
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
  return sparks;
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

// ── 转场段: 首刀退场 → 六连爆发的衔接 ─────────────────────────────────────
// 首刀不是「消失」而是「被崩碎」: 压刀蓄力(wind) → 原地崩断成数段、各段沿垂直
// 于刀身的方向弹开(shatter), 崩断的同时留下三道扇向六连角度的残影, 光环塌缩
// 把视线收回目标中心, 中心出鞘白闪(ignite)炸开, 六连第一刀正好从白闪里劈出。
//
// ★ 这一段的硬约束: **所有位移必须钳在可见区(± 320px)内, 且不能沿刀身方向**。
//   刀身长 1500px, 横跨中心 ± 750px —— 两端本来就在画面外, 所以
//   「沿刀身平移」在画面里等于没动, 「沿刀身收缩」则是一两帧就掠过中心的闪。
//   这套几何下只有三种运动真正看得见: 绕中心旋转、垂直于刀身的位移、原地的
//   厚度/亮度变化。之前的抽刃退场就是踩了这个坑, 别再写回去。
//
// 注意: 以下几张表刻意放在文件末尾 —— rnd() 是顺序敏感的定点流, 插在中间会
// 把 SCARS / SPLINTERS / FRAGMENTS / ASHES 的既有布局整体挪位。

// ── 残影: 首刀甩出时分裂出的半透明弧刃, 各自旋到六连前三刀的角度并淡出 ────
// 「一刀化多刀」—— 让观众先看到首刀的轨迹**扇开成**六连的轨迹, 实刀再沿着
// 这些轨迹劈实。残影是弱层(低不透明度 + 大模糊), 不与实刀抢视觉权重。
// fadeMs 280: 残影在六连第一刀劈出(880ms)前约 100ms 就淡尽 —— 六连起手时
// 画面必须是干净的, 观众才看得清六连每一刀的扫出; 残影和实刀同框会互相
// 抢读, 变成一屏横线而不是「扇开 → 劈实」的接力。
export interface TripleAfterimage {
  toAngle: number; // 扇开到的角度(deg) = 六连对应刀的角度
  delay: number; // 相对 shatter
  fadeMs: number;
  opacity: number; // 峰值不透明度, 逐道递减
}

export const AFTERIMAGES: readonly TripleAfterimage[] = SLASHES.slice(1, 4).map((blade, index) => ({
  toAngle: blade.angle,
  delay: index * 26,
  fadeMs: 280,
  opacity: Number((0.34 - index * 0.07).toFixed(2)),
}));

// ── 崩断火花: 刀身碎开的那一刻从断口迸出的亮点, 沿可见区四散 ───────────────
// dx/dy 是**世界坐标**(CSS 里 rotate 之后又转了回来), 所以这里就该四散,
// 不该带方向性 —— 方向性交给碎段自己的垂直弹开。
export interface TripleShatterSpark {
  along: number; // 沿首刀刀身的位置(px, 以刀身中点为 0, 钳在可见区内)
  dx: number;
  dy: number;
  size: number;
  tone: TripleTone;
  delay: number; // 相对 shatter
}

export const SHATTER_SPARKS: readonly TripleShatterSpark[] = Array.from({ length: 8 }, (_, index) => ({
  along: Math.round(-300 + index * 86 + between(-22, 22)),
  dx: Math.round(between(-95, 95)),
  dy: Math.round(between(-95, 95)),
  size: Math.round(between(4, 8)),
  tone: pickOne(TONES),
  delay: Math.round((index / 8) * 60 + between(0, 16)),
}));

// ── 碎段: 首刀崩断后的刀身残片, 各段沿垂直于刀身的方向弹开并翻转淡出 ───────
// 5 段首尾略有重叠地铺满可见区(± 320px), 断口从中段先裂、向两端扩散 ——
// 「刀是从被挡住的那一点崩开的」。垂直弹开是这套几何里最扎实的可见运动。
export interface TripleShard {
  along: number; // 沿刀身的位置(px, 以刀身中点为 0)
  length: number; // 碎段长度(px)
  height: number; // 碎段厚度(px)
  side: 1 | -1; // 往刀身的哪一侧弹
  push: number; // 垂直于刀身的弹开距离(px)
  spin: number; // 弹开时的翻转角(deg)
  delay: number; // 相对 shatter
  fadeMs: number;
}

export const OPENER_SHARDS: readonly TripleShard[] = Array.from({ length: 5 }, (_, index) => {
  const along = Math.round(-320 + index * 160 + between(-14, 14));
  return {
    along,
    // 段长 > 段距(160): 相邻碎段留一点重叠, 崩断的第一帧才没有缝。
    length: Math.round(between(172, 196)),
    height: Math.round(between(20, 32)),
    side: (index % 2 === 0 ? 1 : -1) as 1 | -1,
    push: Math.round(between(38, 82)),
    spin: Math.round(between(-10, 10)),
    delay: Math.round((Math.abs(along) / 320) * 46 + between(0, 12)),
    // fadeMs 220-260: 碎段最晚 ~780ms 散尽, 给六连第一刀(880ms)留足 100ms 的
    // 干净空档 —— 碎段是完整的不透明刀段, 若活到六连起手, 会盖住六连辉光
    // (z-index 9 vs 2), 六连看起来就是一堆横线而不是逐刀扫出。
    fadeMs: Math.round(between(220, 260)),
  };
});
