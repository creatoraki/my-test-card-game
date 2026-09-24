import type { PlayerState } from "../../../types";
import { PLAYER_PHYSICS as P } from "../../../engine/playerPhysics";

// 角色关节姿态。角度单位为度，统一以「朝右」为基准：
// hip/arm 正值 = 向前摆；knee 正值 = 小腿向后折；elbow 正值 = 前臂向前抬；
// hair/coat 正值 = 向身后飘；hairLift < 1 表示头发被气流托起变短。
export interface HeroPose {
  bob: number;
  lean: number;
  head: number;
  hipF: number;
  kneeF: number;
  hipB: number;
  kneeB: number;
  armF: number;
  elbowF: number;
  armB: number;
  elbowB: number;
  hair: number;
  hairLift: number;
  coat: number;
}

type Joint = Exclude<keyof HeroPose, "bob">;
const JOINTS: readonly Joint[] = ["lean", "head", "hipF", "kneeF", "hipB", "kneeB", "armF", "elbowF", "armB", "elbowB", "hair", "hairLift", "coat"];

export function createPose(): HeroPose {
  return { bob: 0, lean: 0, head: 0, hipF: 0, kneeF: 0, hipB: 0, kneeB: 0, armF: 0, elbowF: 10, armB: 0, elbowB: 10, hair: 3, hairLift: 1, coat: 0 };
}

function idlePose(t: number): HeroPose {
  const breathe = Math.sin(t * 2.2);
  const drift = Math.sin(t * 1.6);
  return {
    bob: -1.2 - breathe * 1.2,
    lean: 0,
    head: Math.sin(t * 1.1) * 1.5,
    hipF: 2,
    kneeF: 2,
    hipB: -2,
    kneeB: 2,
    armF: 4 + breathe * 2,
    elbowF: 12,
    armB: -5 - breathe * 2,
    elbowB: 10,
    hair: 3 + drift * 2.5,
    hairLift: 1,
    coat: drift * 1.5,
  };
}

function runPose(phase: number, k: number): HeroPose {
  const s = Math.sin(phase);
  const c = Math.cos(phase);
  return {
    bob: -Math.abs(c) * 7 * k,
    lean: 8 * k,
    head: -3 * k,
    hipF: 34 * s * k,
    kneeF: (8 + 58 * Math.max(0, c)) * k,
    hipB: -34 * s * k,
    kneeB: (8 + 58 * Math.max(0, -c)) * k,
    armF: -32 * s * k,
    elbowF: 20 + 45 * k,
    armB: 32 * s * k,
    elbowB: 20 + 45 * k,
    hair: 8 + 14 * k + Math.abs(c) * 4,
    hairLift: 1,
    coat: 6 * k + Math.abs(c) * 5,
  };
}

const RISE_POSE: HeroPose = {
  bob: 0, lean: 4, head: -4, hipF: 42, kneeF: 80, hipB: -16, kneeB: 26,
  armF: -35, elbowF: 35, armB: 70, elbowB: 45, hair: 2, hairLift: 1, coat: -4,
};

const FALL_POSE: HeroPose = {
  bob: 0, lean: -3, head: 5, hipF: 14, kneeF: 30, hipB: -12, kneeB: 55,
  armF: 115, elbowF: 25, armB: -80, elbowB: 20, hair: -10, hairLift: 0.84, coat: -14,
};

function targetPose(p: PlayerState, t: number): HeroPose {
  if (p.grounded) {
    const speed = Math.min(1, Math.abs(p.vx) / P.runSpeed);
    return speed > 0.06 ? runPose(p.runPhase, speed) : idlePose(t);
  }
  return p.vy < -120 ? RISE_POSE : FALL_POSE;
}

/** 关节向目标姿态指数逼近，落地/起跳的挤压拉伸不走平滑，保证瞬间反馈。 */
export function advancePose(pose: HeroPose, p: PlayerState, dt: number, t: number): { sx: number; sy: number } {
  const target = targetPose(p, t);
  const rate = 1 - Math.exp(-dt * (p.grounded ? 22 : 12));
  for (const joint of JOINTS) pose[joint] += (target[joint] - pose[joint]) * rate;
  pose.bob = target.bob;

  const land = p.landTimer / P.landTime;
  const takeoff = p.takeoffTimer / P.takeoffTime;
  if (land > 0) {
    pose.bob += 6 * land;
    pose.kneeF += 34 * land;
    pose.kneeB += 34 * land;
    pose.hipF += 16 * land;
    pose.hipB += 16 * land;
  }
  const air = p.grounded ? 0 : Math.min(1, Math.abs(p.vy) / P.jumpSpeed) * 0.06;
  const sy = 1 - 0.12 * land + 0.1 * takeoff + air;
  const sx = 1 + 0.09 * land - 0.06 * takeoff - air * 0.6;
  return { sx, sy };
}
