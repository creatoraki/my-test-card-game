import type { HeroPose } from "./heroPose";

// 骨骼：把关节角（度，朝右为基准）换算成像素坐标。原点为脚底中心，y 轴向下。
// 角度约定沿用姿态模块：正值顺时针旋转；骨骼初始方向竖直向下。

export interface Pt {
  x: number;
  y: number;
}

export interface LegRig {
  hip: Pt;
  knee: Pt;
  ankle: Pt;
}

export interface ArmRig {
  shoulder: Pt;
  elbow: Pt;
  hand: Pt;
}

export interface HeroRig {
  hip: Pt;
  /** 上半身整体位移（呼吸、跑动起伏、落地挤压），不作用于腿部，保证脚底贴地。 */
  torso: Pt;
  neck: Pt;
  hairRoot: Pt;
  legs: readonly [back: LegRig, front: LegRig];
  arms: readonly [back: ArmRig, front: ArmRig];
}

export const RIG = {
  hipY: -13.5,
  hipHalf: 1.5,
  thigh: 4.5,
  shin: 5,
  shoulderY: -22.5,
  shoulderHalf: 1.2,
  upperArm: 4,
  foreArm: 4.5,
  /** 躯干顶到脖颈的高度。 */
  neckRise: 11.5,
} as const;

const DEG = Math.PI / 180;

/** 从 from 沿顺时针角 deg（0 为竖直向下）伸出 len。 */
function bone(from: Pt, deg: number, len: number): Pt {
  const a = deg * DEG;
  return { x: from.x - Math.sin(a) * len, y: from.y + Math.cos(a) * len };
}

function rotateAround(p: Pt, pivot: Pt, deg: number): Pt {
  const a = deg * DEG;
  const dx = p.x - pivot.x;
  const dy = p.y - pivot.y;
  return { x: pivot.x + dx * Math.cos(a) - dy * Math.sin(a), y: pivot.y + dx * Math.sin(a) + dy * Math.cos(a) };
}

export function buildRig(pose: HeroPose, squash: number): HeroRig {
  const lift = pose.bob / 4 + squash;
  const hip: Pt = { x: 0, y: RIG.hipY };
  const upperHip: Pt = { x: 0, y: RIG.hipY + lift };
  const lean = pose.lean;

  const leg = (side: -1 | 1, hipDeg: number, kneeDeg: number): LegRig => {
    const h = { x: side * RIG.hipHalf, y: RIG.hipY };
    const knee = bone(h, lean - hipDeg, RIG.thigh);
    const ankle = bone(knee, lean - hipDeg + kneeDeg, RIG.shin);
    return { hip: h, knee, ankle };
  };

  const arm = (side: -1 | 1, armDeg: number, elbowDeg: number): ArmRig => {
    const shoulder = rotateAround({ x: side * RIG.shoulderHalf, y: RIG.shoulderY + lift }, upperHip, lean);
    const elbow = bone(shoulder, lean - armDeg, RIG.upperArm);
    const hand = bone(elbow, lean - armDeg - elbowDeg, RIG.foreArm);
    return { shoulder, elbow, hand };
  };

  const neck = rotateAround({ x: 1, y: RIG.hipY - RIG.neckRise + lift }, upperHip, lean * 0.8 + pose.head * 0.3);
  return {
    hip,
    torso: { x: (neck.x - 1) * 0.5, y: lift },
    neck,
    hairRoot: { x: neck.x - 8, y: neck.y - 6 },
    legs: [leg(-1, pose.hipB, pose.kneeB), leg(1, pose.hipF, pose.kneeF)],
    arms: [arm(-1, pose.armB, pose.elbowB), arm(1, pose.armF, pose.elbowF)],
  };
}
