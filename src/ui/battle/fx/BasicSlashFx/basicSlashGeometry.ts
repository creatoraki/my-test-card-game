// ============================================================================
// 快斩·单刀弧斩(basic-slash)的几何表与时间轴锚点。
//
// 这是「基础档位」特效: 对标 animations.ts 里 slash 的 emoji, 每回合都要放,
// 所以设计目标不是华丽而是 —— 短、读得懂、砸得实。分层沿用同目录
// frost-shatter / neon-cross 的三段式(几何表 → 纯映射组件 → 质感 CSS),
// 这里只放「画在哪、飞多远、什么时候动」, 质感留给 BasicSlashFx.module.css。
//
// 随机布局用固定种子在模块加载时烘一次, 不在渲染期算:
//   1) 重播(key 换新)时布局逐 px 相同, 便于逐帧比对调参;
//   2) 同屏多实例共用一份表, 不额外分配;
//   3) 不需要 useMemo, 组件保持纯映射。
// 想换一套迸射布局只改 SEED。
// ============================================================================

const SEED = 0x51534c48; // "QSLH"

// mulberry32: 32 位定点 PRNG。每份几何表自包含一份, 改一款不牵动另一款。
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

/** 两级冷钢色。刃芯与近爆点的东西取 white, 外围余韵取 steel, 由 CSS 的 [data-tone] 落地。 */
export type BasicTone = "steel" | "white";

// ── 时间轴(ms, 以 impact 为爆点锚) ─────────────────────────────────────────
// 组件按 preset.impactMs 与 impact 的差值整体平移, 所以调节奏只改这一张表。
//
// ★ 打击感的关键是 blade→impact 之间那 60ms: 刀扫完**不立刻**炸。
//   这一小段留白是冲击读数的唯一来源, 压掉它整个特效就会糊成一团光。
export const BASIC_TIMELINE = {
  telegraph: 0, // 刀路预兆: 一条极细白线沿斩线收紧, 让眼睛先知道刀从哪来
  blade: 140, // 刃出: 弧形斩痕自左上向右下贯出, 60ms 走完
  impact: 200, // 爆点: 白核过冲 + 楔形冲击 + 火花扇(掉血结算点)
  decay: 260, // 余韵: 斩痕自中段撕细消散, 火花带重力下坠
  total: 560, // 收尾
} as const;

// ── 单刀 ────────────────────────────────────────────────────────────────
// angle 为 CSS rotate 角度(正 = 顺时针): 28° 即自左上劈向右下 ↘,
// 与施法者站在左侧的读数一致。长度够长才能斜贯出 1400 见方的图层不露断头。
export const BLADE = {
  angle: 28,
  length: 1200,
  thickness: 26, // 刀芯最厚处(px); 辉光层与拖影层按倍率放大
} as const;

/** 火花/碎屑迸射的中轴 = 斩线法线。方向感是快特效唯一撑得住的信息量。 */
const NORMAL = BLADE.angle + 90;
const FAN = 35; // 双扇区半角(deg): 只往斩线两侧炸, 不做 360° 均匀放射

// ── 火花: 爆点时沿斩线法线两侧扇形迸出的细长条 ────────────────────────────
export interface BasicSpark {
  angle: number; // 迸射朝向(deg)
  length: number;
  distance: number; // 沿朝向飞出的距离(px)
  offset: number; // 出生点距中心的距离(px)
  drop: number; // 末端重力下坠(px), 让火花不是纯直线放射
  tone: BasicTone;
  delay: number; // 相对 impact
}

export const SPARKS: readonly BasicSpark[] = Array.from({ length: 18 }, (_, index) => {
  // 偶数走法线正向扇区, 奇数走反向扇区 —— 两片对称的扇, 中间留出刀身。
  const side = index % 2 === 0 ? 0 : 180;
  const spread = between(-FAN, FAN);
  return {
    angle: Math.round(NORMAL + side + spread),
    length: Math.round(between(40, 130)),
    distance: Math.round(between(150, 420)),
    offset: Math.round(between(10, 90)),
    drop: Math.round(between(10, 46)),
    tone: rnd() > 0.62 ? "white" : "steel",
    // 越贴近中轴的越早亮: 冲击是从刀口正面推开的。
    delay: Math.round((Math.abs(spread) / FAN) * 60 + between(0, 30)),
  };
});

// ── 碎屑: 沿刀身迸出的小方块, 补足火花之外的「削下来一块」的实体感 ─────────
export interface BasicDebris {
  along: number; // 沿刀身的位置(px, 以刀身中点为 0)
  size: number;
  dx: number;
  dy: number; // 已含 +34 重力偏置: 碎屑是「掉」下去的
  rotate: number;
  tone: BasicTone;
  delay: number; // 相对 impact
}

export const DEBRIS: readonly BasicDebris[] = Array.from({ length: 10 }, (_, index) => {
  const along = -160 + index * 36 + between(-14, 14);
  return {
    along: Math.round(along),
    size: Math.round(between(5, 13)),
    dx: Math.round(between(-120, 120)),
    dy: Math.round(between(-90, 60) + 34),
    rotate: Math.round(between(-260, 260)),
    tone: rnd() > 0.75 ? "white" : "steel",
    delay: Math.round(between(0, 60)),
  };
});

// ── 冲击环: 沿斩线方向拉长的扁椭圆, 不是正圆 ──────────────────────────────
// 正圆读作「原地爆炸」, 拉扁才读作「一刀划过去」—— 快特效里这条比任何辉光都值钱。
export const SHOCK = {
  size: 260, // 基准直径(px)
  stretch: 2.2, // 沿斩线方向的拉伸倍率
  scale: 2.6, // 终点扩张倍率
} as const;