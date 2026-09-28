import type { GaitTable } from "../../engine/heroAnimator";

/**
 * 角色切件与骨骼校准表。所有坐标都是「源图像素」: 单帧 180×240, 原点在左上, y 向下,
 * 与图片编辑器里看到的一致。按 F2 可在游戏里叠加显示部件遮罩与骨骼支点, 对照这里调数值。
 *
 * 源素材: assets/人物立绘/站立右移动作帧_透明背景/帧_001~012 为侧面步态, 帧_004 双腿并拢, 作为基准帧。
 * 上半身全部取自基准帧并挂在骨骼上; 下半身(接缝以下)按当前步态帧采样。
 */

export const FRAME_W = 180;
export const FRAME_H = 240;

/** 舞台上的缩放(1 = 源图 1px 对应设计画布 1px)。 */
export const HERO_SCALE = 1.05;

/** 脚底锚点: 角色世界位置对应的源图点。 */
export const FOOT: readonly [number, number] = [80, 239];

export const BASE_FRAME = 4;

/** 上半身与腿部的接缝(源图 y): y0 以上全用基准帧, y1 以下全用步态帧, 中间软过渡。 */
export const SEAM: readonly [number, number] = [168, 184];

export type BoneName = "ground" | "root" | "spine" | "head" | "hairBack" | "hairFront" | "nearArm" | "farArm" | "ribbon";

export interface BoneDef {
  name: BoneName;
  /** 父骨骼下标; -1 为无父。 */
  parent: number;
  pivot: readonly [number, number];
}

/** 骨骼表(顺序即着色器中的下标, 父骨骼必须排在前面)。 */
export const BONES: readonly BoneDef[] = [
  { name: "ground", parent: -1, pivot: [80, 239] },
  { name: "root", parent: 0, pivot: [80, 166] },
  { name: "spine", parent: 1, pivot: [78, 162] },
  { name: "head", parent: 2, pivot: [82, 86] },
  { name: "hairBack", parent: 3, pivot: [58, 50] },
  { name: "hairFront", parent: 3, pivot: [106, 76] },
  { name: "nearArm", parent: 2, pivot: [66, 98] },
  { name: "farArm", parent: 2, pivot: [99, 104] },
  { name: "ribbon", parent: 2, pivot: [46, 148] },
];

export const BONE_INDEX = Object.fromEntries(BONES.map((b, i) => [b.name, i])) as Record<BoneName, number>;

export type MaskShape =
  | { kind: "capsule"; a: readonly [number, number]; b: readonly [number, number]; r: number }
  | { kind: "ellipse"; c: readonly [number, number]; r: readonly [number, number] };

export interface PartDef {
  bone: BoneName;
  label: string;
  shapes: readonly MaskShape[];
  /** 遮罩边缘羽化(px), 越大过渡越柔。 */
  feather: number;
  /** 这些部件在接缝以下也必须取基准帧(否则会被步态帧的腿覆盖)。 */
  keepUpper: boolean;
  /** F2 叠层颜色。 */
  debug: number;
}

/**
 * 部件遮罩, 按优先级从高到低: 前面的部件先「占走」权重, 剩下的交给后面。
 * 没被任何部件覆盖的区域: 接缝以上归躯干(spine), 以下归地面(ground, 即不动)。
 */
export const PARTS: readonly PartDef[] = [
  { bone: "nearArm", label: "近侧手臂", shapes: [{ kind: "capsule", a: [66, 100], b: [75, 170], r: 13 }], feather: 5, keepUpper: true, debug: 0xff4a4a },
  { bone: "farArm", label: "远侧手臂", shapes: [{ kind: "capsule", a: [99, 106], b: [109, 152], r: 9 }], feather: 4, keepUpper: true, debug: 0xffa030 },
  {
    bone: "ribbon",
    label: "飘带挂件",
    shapes: [
      { kind: "capsule", a: [46, 150], b: [45, 193], r: 8 },
      { kind: "capsule", a: [60, 166], b: [62, 188], r: 5 },
    ],
    feather: 4,
    keepUpper: true,
    debug: 0xffe040,
  },
  { bone: "hairFront", label: "前发", shapes: [{ kind: "capsule", a: [108, 82], b: [117, 120], r: 9 }], feather: 5, keepUpper: false, debug: 0xff50e0 },
  { bone: "head", label: "头部", shapes: [{ kind: "ellipse", c: [82, 47], r: [47, 43] }], feather: 8, keepUpper: false, debug: 0x40e0ff },
  { bone: "hairBack", label: "后发", shapes: [{ kind: "capsule", a: [50, 60], b: [33, 154], r: 22 }], feather: 8, keepUpper: false, debug: 0x4a70ff },
];

export const TORSO_DEBUG = 0x50e070;
export const GROUND_DEBUG = 0x808080;

/** 眼睛区域(源图 px)与眨眼用的眼睑 / 睫毛颜色(线性空间近似)。 */
export const EYE = {
  x0: 87,
  x1: 100,
  y0: 56,
  y1: 67,
  skin: [0.78, 0.55, 0.5] as const,
  lash: [0.05, 0.03, 0.035] as const,
};

/**
 * 步态校准: 胯部偏移由逐帧与基准帧做区域配准求得(源图 px, x 向右, y 向下)。
 * 源帧里站立脚每帧向后滑约 10px, 12 帧一个循环 ≈ 120px。
 */
export const GAIT: GaitTable = {
  frames: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  idleFrame: BASE_FRAME,
  airRiseFrame: 7,
  airFallFrame: 4,
  hipOffset: [
    [0, 0], [2, 5], [1, 5], [0, 2], [0, 0], [0, 1], [0, 3], [1, 4], [4, 1], [4, 1], [4, 3], [2, 4], [2, 5],
  ],
  cycleLength: 120 * HERO_SCALE,
};
