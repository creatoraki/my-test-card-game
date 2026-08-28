// ============================================================================
// 疾锋·快斩(fast-slash)的几何表与时间轴锚点。
//
// 与 blade-slash / blood-slash / neon-cross 的分工一致: 这里只放「画在哪、
// 飞多远、什么时候动」, 具体质感(发光、拖影、模糊)留给 DsFastSlashFx.module.css。
//
// 布局全部手写成固定常量表(模块加载时烘死), 渲染期不产生任何随机:
//   1) 重播(key 换新)时布局逐 px 相同, 便于逐帧比对调参;
//   2) 同屏多实例共用一份表, 不额外分配;
//   3) 不需要 useMemo, 组件保持纯表 → DOM 映射。
// ============================================================================

/** 时间轴(ms, 以 impact 为爆点锚)。组件按 preset.impactMs 与 impact 的差值整体
    平移, 所以调节奏只改这一张表。
    基础快斩的定位: 起手短(直觉微光)、刀刃快(160ms 走完全程)、爆点即掉血,
    全线压在 0.72s 内 —— 比刀光斩(950ms 爆点)都快, 是三连斩之前的基础形态。 */
export const FAST_TIMELINE = {
  charge: 0, // 起手微光聚点: 出刀前的直觉, 130ms 内从暗到最亮
  strike: 80, // 刀刃扫出: 160ms 走完全程(80 → 240), 全程无中途减速
  impact: 280, // 爆点: 刀刃扫离目标后 40ms —— 冲击环/白爆/白点飞溅/刀痕闪都在这一拍
  fade: 460, // 刀痕余辉开始快速熄灭
  total: 720, // 全部收尾(余烬落定)
} as const;

/** 斩线长度(px)。够长才能斜贯出 1200 见方的图层, 不在画面内看到断头。 */
export const BLADE_LENGTH = 1400;

/** 斩击角度(deg, CSS rotate 正 = 顺时针)。35° = 自左上向右下的斜劈, 基础攻击的
    标准落刀方向; 与 blade-slash 的 -62°(蓄力长斩)刻意区分开。 */
export const BLADE_ANGLE = 35;

// ── 白点飞溅: 爆点时沿刀锋方向为主、两侧为辅地弹开 ────────────────────────
// 方向按刀锋朝角(35°)基准手写: 前方 ±32° 喷得最远(刀是「带出」它们的),
// 与刀锋垂直的两侧只做短距小溅射(刀身擦过目标的碎屑)。
export interface FastDot {
  dx: number; // 相对图层中心的飞散位移(px)
  dy: number;
  size: number; // 直径(px)
  delay: number; // 相对 impact 的错峰(ms)
}

export const DOTS: readonly FastDot[] = [
  // 刀锋方向向前喷(主溅射, 距离 250 ~ 460)
  { dx: 416, dy: 58, size: 6, delay: 0 },
  { dx: 310, dy: 113, size: 5, delay: 14 },
  { dx: 398, dy: 230, size: 7, delay: 6 },
  { dx: 267, dy: 241, size: 5, delay: 22 },
  { dx: 172, dy: 246, size: 4, delay: 12 },
  { dx: 182, dy: 356, size: 6, delay: 30 },
  { dx: 245, dy: 52, size: 4, delay: 26 },
  { dx: 174, dy: 193, size: 5, delay: 40 },
  // 与刀锋垂直的两侧(短距小溅射)
  { dx: -109, dy: 156, size: 4, delay: 6 },
  { dx: -113, dy: 212, size: 5, delay: 24 },
  { dx: 120, dy: -172, size: 4, delay: 10 },
  { dx: 122, dy: -230, size: 5, delay: 34 },
  { dx: -106, dy: 106, size: 4, delay: 44 },
  { dx: 53, dy: -162, size: 4, delay: 50 },
];

// ── 刀痕亮点: 沿斩线均匀落一串, 爆点时依次闪亮 —— 「这一刀留下的口子」 ────
export interface FastWound {
  x: number; // 沿斩线相对中心的偏移(px)
  length: number; // 亮点长度(px)
  delay: number; // 相对 impact 的错峰(ms)
}

export const WOUNDS: readonly FastWound[] = [
  { x: -320, length: 130, delay: 0 },
  { x: -210, length: 100, delay: 12 },
  { x: -100, length: 150, delay: 26 },
  { x: 0, length: 170, delay: 6 },
  { x: 110, length: 120, delay: 36 },
  { x: 220, length: 150, delay: 20 },
  { x: 320, length: 100, delay: 44 },
];
