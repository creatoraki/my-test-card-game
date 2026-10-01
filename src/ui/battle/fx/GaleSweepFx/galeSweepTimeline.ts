// ============================================================================
// 青岚横断(gale-sweep)的时间轴、粒子表与缓动 —— 唯一真相点。
//
// 时间轴(ms, 1 倍速):
//   0 ~ 420     蓄势: 画面压暗染青, 疾风线从四处收拢到斩线, 左端风眼越转越快
//   420 ~ 600   横断: 巨型月牙风刃从风眼射出, 180ms 横贯整排敌人, 身后拖出风痕
//   600 ~ 640   静默: 风痕收成一根细亮线 —— 刻意留的一拍「还没炸」
//   640         爆点: 整条风痕同时迸裂, 每个目标同时落刀痕、爆光、碎风片(全体共用这一拍)
//   640 ~ 1500  余韵: 风痕上下裂开退散, 落叶与风屑顺风吹向右侧, 压暗褪去
// impact 与 animations.ts 的 "gale-sweep".proc.impactMs 同源; 组件按两者比例整体缩放。
//
// 粒子表只存归一化参数(0~1 或相对量), 每帧再按实时布局(目标位置/斩线)映射成像素,
// 镜头震动时刀痕与碎片仍贴着目标。固定种子, 每次重播逐 px 相同。
// ============================================================================

import { mulberry32 } from "@/ui/battle/fx/shared/fxKit";

export const GALE_TIMELINE = {
  eyeIn: 100, // 风眼出现
  launch: 420, // 风刃射出
  sweepEnd: 600, // 风刃出画
  impact: 640, // 整线迸裂
  tintOut: 1150, // 压暗褪尽
  total: 1500,
} as const;

/** 主色: 青岚翠。所有绘制都从这里取色, 换配色只改这一处。 */
export const GALE_RGB = {
  deep: "47, 214, 168",
  jade: "125, 245, 200",
  mist: "200, 255, 235",
  white: "242, 255, 250",
  shade: "3, 22, 20",
} as const;

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
/** t 在 [from, from + dur] 内的归一化进度。 */
export const phase = (t: number, from: number, dur: number) => clamp01((t - from) / dur);
export const easeOut = (p: number, k = 3) => 1 - (1 - p) ** k;
export const easeIn = (p: number, k = 2) => p ** k;
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

const rnd = mulberry32(0x6a1e5);
const range = (min: number, max: number) => min + rnd() * (max - min);

/** 蓄势期的收拢疾风线: 从右侧各处向左掠, 途中纵向被吸向斩线。 */
export interface GatherStreak {
  dy: number; // 起始纵向偏离斩线(px)
  u: number; // 起始横向位置(画面宽度比例)
  travel: number; // 生命周期内向左掠过的距离(px)
  len: number; // 线长(px)
  width: number;
  t0: number;
  dur: number;
}

export const GATHER_STREAKS: GatherStreak[] = Array.from({ length: 44 }, () => ({
  dy: range(-340, 340),
  u: range(0.15, 1.1),
  travel: range(520, 920),
  len: range(90, 260),
  width: range(1.2, 3),
  t0: range(0, 300),
  dur: range(200, 320),
}));

/** 目标爆点的碎风片: 每个目标共用同一张表(按目标序号旋转错开, 避免整齐划一)。 */
export interface BurstShard {
  angle: number; // rad
  speed: number; // px/s 初速
  size: number;
  life: number; // ms
  white: boolean;
}

export const BURST_SHARDS: BurstShard[] = Array.from({ length: 16 }, (_, i) => {
  // 偏向法线两侧(上下)与刀势前方, 少量往回溅。
  const lane = i % 4;
  const base = lane === 0 ? -Math.PI / 2 : lane === 1 ? Math.PI / 2 : lane === 2 ? 0 : range(-Math.PI, Math.PI);
  return {
    angle: base + range(-0.7, 0.7),
    speed: range(320, 760),
    size: range(5, 13),
    life: range(320, 520),
    white: i % 3 === 0,
  };
});

/** 爆点后沿整条斩线吹散的落叶 / 风屑。 */
export interface Leaf {
  u: number; // 沿斩线的位置(0 = 风眼, 1 = 出画点)
  dy: number; // 偏离斩线(px)
  vx: number; // 顺风横向速度(px/s)
  vy: number; // 纵向漂移(px/s)
  wobble: number; // 摆动幅度(px)
  freq: number; // 摆动频率(rad/s)
  spin: number; // 自转(rad/s)
  size: number;
  delay: number; // 相对爆点(ms)
  tone: 0 | 1 | 2;
}

export const LEAVES: Leaf[] = Array.from({ length: 56 }, (_, i) => ({
  u: range(0.02, 1),
  dy: range(-40, 40),
  vx: range(260, 640),
  vy: range(-140, 90),
  wobble: range(6, 22),
  freq: range(6, 14),
  spin: range(-9, 9),
  size: range(5, 11),
  delay: range(0, 120),
  tone: (i % 3) as 0 | 1 | 2,
}));

/** 余韵期顺风掠过的长疾风线。 */
export interface Gust {
  dy: number;
  len: number;
  width: number;
  t0: number; // 相对爆点(ms)
  dur: number;
}

export const GUSTS: Gust[] = Array.from({ length: 16 }, () => ({
  dy: range(-220, 220),
  len: range(260, 620),
  width: range(1, 2.6),
  t0: range(10, 360),
  dur: range(320, 520),
}));
