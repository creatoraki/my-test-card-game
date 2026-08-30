// 锐利刀锋斩(keen-edge)的时间轴与几何表。
//
// 时间轴逐拍对齐 src/assets/sounds/音效/锐利刀锋.wav 的实测包络:
//   0–190ms   低幅起势(峰值 0.03→0.34)   → 聚光蓄势
//   190–430ms 刀身加速(峰值 0.5–0.74)    → 刀光横扫
//   430–570ms 撞击峰(峰值 0.82–1.00)     → 爆点
//   570–1000ms 金属颤鸣(峰值 0.30–0.63)  → 刀痕颤动 + 涟漪
//   1000–2000ms 持续嗡鸣缓降             → 颤鸣减弱, 尘屑下沉
//   2000–2450ms 快速衰减                 → 消散
//
// 几何一律烘成固定表(不用 Math.random), 保证重播时布局稳定、也不会触发额外渲染。

export const KEEN_TIMELINE = {
  windup: 0, // 起势: 冷光点沿刀轨自两端汇聚, 预示线浮现
  accel: 190, // 加速: 主刀光横扫, 双残影跟随
  impact: 470, // 爆点: 撞击闪核 + 冲击环 + 火花 + 伤痕(掉血锚点)
  ring: 620, // 余鸣: 刀痕高频颤动, 冷白涟漪一圈圈外推
  decay: 1400, // 缓降: 颤鸣减弱, 尘屑开始下沉
  fade: 2000, // 消散
  total: 2450,
} as const;

/** 正式战斗采用的固定倍速。demo 上 1.4x 档观感最佳, 故烘进特效本身
 * (--fx-rate 是全局倍速/顿帧用的, 不能挪作本特效的固定速率)。
 * 采样侧用 pitch = KEEN_RATE 同步加速, 撞击峰才仍落在爆点上。 */
export const KEEN_RATE = 1.4;

/** KEEN_TIMELINE 按 KEEN_RATE 加速后的实播时间轴。
 * animations.ts / animSfx.ts / camera/shots.ts 的数字都以此为准。 */
export const KEEN_PLAY = {
  windup: 0,
  accel: 136,
  impact: 336,
  ring: 443,
  decay: 1000,
  fade: 1429,
  total: 1750,
} as const;

/** 刀光横扫的世界长度(px), 与 blade-slash 同量级, 保证 demo 与实战舞台观感一致。 */
export const KEEN_BLADE_LENGTH = 900;

/** 主刀光扫过的时长: 覆盖音效 190–430ms 的加速段。 */
export const KEEN_SWIPE_MS = 250;

/** 起势聚光点: t 为起始横向偏移(px), n 为纵向偏移(px)。 */
export const CONVERGE_MOTES = [
  { t: -420, n: 7, size: 5, delay: 0 },
  { t: -352, n: -9, size: 4, delay: 26 },
  { t: -288, n: 11, size: 6, delay: 12 },
  { t: -226, n: -6, size: 4, delay: 44 },
  { t: -164, n: 8, size: 5, delay: 20 },
  { t: -104, n: -11, size: 4, delay: 58 },
  { t: -52, n: 5, size: 6, delay: 34 },
  { t: -20, n: -4, size: 4, delay: 70 },
  { t: 20, n: 6, size: 5, delay: 8 },
  { t: 52, n: -7, size: 4, delay: 50 },
  { t: 104, n: 10, size: 6, delay: 30 },
  { t: 164, n: -5, size: 4, delay: 64 },
  { t: 226, n: 9, size: 5, delay: 16 },
  { t: 288, n: -10, size: 4, delay: 42 },
  { t: 352, n: 6, size: 6, delay: 24 },
  { t: 420, n: -8, size: 4, delay: 54 },
] as const;

/** 爆点火花: x 为沿刀痕的落点, dx/dy 为飞散位移。 */
export const EDGE_SPARKS = [
  { x: -330, dx: -124, dy: -58, size: 5, delay: 0 },
  { x: -330, dx: -72, dy: 66, size: 4, delay: 22 },
  { x: -330, dx: 34, dy: -96, size: 4, delay: 12 },
  { x: -258, dx: -108, dy: 44, size: 5, delay: 30 },
  { x: -258, dx: 62, dy: -78, size: 4, delay: 6 },
  { x: -258, dx: 116, dy: 38, size: 4, delay: 40 },
  { x: -186, dx: -96, dy: -70, size: 6, delay: 16 },
  { x: -186, dx: -28, dy: 104, size: 4, delay: 34 },
  { x: -186, dx: 92, dy: -46, size: 4, delay: 4 },
  { x: -112, dx: -132, dy: 26, size: 5, delay: 26 },
  { x: -112, dx: 18, dy: -118, size: 4, delay: 10 },
  { x: -112, dx: 108, dy: 64, size: 6, delay: 44 },
  { x: -42, dx: -86, dy: -92, size: 4, delay: 18 },
  { x: -42, dx: 46, dy: 112, size: 5, delay: 2 },
  { x: -42, dx: 128, dy: -34, size: 4, delay: 38 },
  { x: 30, dx: -114, dy: 52, size: 4, delay: 14 },
  { x: 30, dx: -12, dy: -126, size: 6, delay: 32 },
  { x: 30, dx: 98, dy: 74, size: 4, delay: 8 },
  { x: 104, dx: -78, dy: -84, size: 5, delay: 42 },
  { x: 104, dx: 56, dy: 98, size: 4, delay: 20 },
  { x: 104, dx: 134, dy: -22, size: 4, delay: 0 },
  { x: 178, dx: -102, dy: 38, size: 4, delay: 28 },
  { x: 178, dx: 24, dy: -110, size: 5, delay: 12 },
  { x: 178, dx: 118, dy: 56, size: 4, delay: 46 },
  { x: 254, dx: -66, dy: -102, size: 4, delay: 24 },
  { x: 254, dx: 88, dy: 82, size: 6, delay: 6 },
  { x: 330, dx: -120, dy: -40, size: 4, delay: 36 },
  { x: 330, dx: 74, dy: 96, size: 4, delay: 16 },
  { x: 330, dx: 126, dy: -60, size: 5, delay: 2 },
] as const;

/** 爆点伤痕: 沿刀痕垂直炸开的短线, 只活一瞬。 */
export const EDGE_WOUNDS = [
  { x: -340, length: 116, delay: 8 },
  { x: -272, length: 148, delay: 26 },
  { x: -196, length: 104, delay: 2 },
  { x: -124, length: 156, delay: 18 },
  { x: -52, length: 122, delay: 36 },
  { x: 14, length: 168, delay: 6 },
  { x: 86, length: 112, delay: 30 },
  { x: 158, length: 142, delay: 14 },
  { x: 232, length: 108, delay: 40 },
  { x: 308, length: 134, delay: 22 },
] as const;

/**
 * 余鸣颤线: 与 blade-slash 最主要的差异元素。
 * 沿刀痕排布的细短线, 在音效颤鸣期(570–1400ms)做高频微颤, 时长各不相同,
 * 交错错位后整条刀痕看起来像还在「嗡」。
 */
export const RESONANCE_LINES = [
  { x: -368, length: 92, offset: -5, delay: 0, duration: 980 },
  { x: -304, length: 128, offset: 6, delay: 70, duration: 860 },
  { x: -238, length: 74, offset: -8, delay: 30, duration: 1120 },
  { x: -172, length: 116, offset: 4, delay: 130, duration: 900 },
  { x: -108, length: 88, offset: -6, delay: 50, duration: 1040 },
  { x: -44, length: 140, offset: 7, delay: 160, duration: 820 },
  { x: 18, length: 96, offset: -4, delay: 20, duration: 1180 },
  { x: 82, length: 124, offset: 5, delay: 100, duration: 940 },
  { x: 146, length: 80, offset: -7, delay: 190, duration: 880 },
  { x: 212, length: 132, offset: 6, delay: 60, duration: 1080 },
  { x: 278, length: 90, offset: -5, delay: 140, duration: 920 },
  { x: 344, length: 112, offset: 8, delay: 10, duration: 1000 },
] as const;

/** 涟漪: 颤鸣期一圈圈外推的冷白环, 对应音效余震的三次起伏。 */
export const RESONANCE_RIPPLES = [
  { delay: 0, duration: 620, scale: 1 },
  { delay: 300, duration: 700, scale: 1.35 },
  { delay: 640, duration: 780, scale: 1.7 },
] as const;

/** 衰减期下沉的光尘: 声音缓降时画面也要慢慢「掉下去」。 */
export const DUST_MOTES = [
  { x: -318, y: -32, drift: 18, size: 4, delay: 0, duration: 900 },
  { x: -244, y: 14, drift: -12, size: 3, delay: 120, duration: 1020 },
  { x: -170, y: -18, drift: 22, size: 4, delay: 40, duration: 960 },
  { x: -96, y: 26, drift: -20, size: 3, delay: 200, duration: 880 },
  { x: -26, y: -30, drift: 14, size: 5, delay: 80, duration: 1040 },
  { x: 40, y: 10, drift: -16, size: 3, delay: 260, duration: 920 },
  { x: 112, y: -22, drift: 24, size: 4, delay: 30, duration: 1000 },
  { x: 186, y: 20, drift: -10, size: 3, delay: 170, duration: 940 },
  { x: 258, y: -28, drift: 16, size: 4, delay: 100, duration: 980 },
  { x: 330, y: 12, drift: -22, size: 3, delay: 230, duration: 900 },
] as const;
