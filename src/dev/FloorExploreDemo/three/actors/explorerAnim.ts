import type { ExplorerRig } from "./explorer";

const WALK_SPEED = 3.1;

export interface ExplorerPose {
  phase: number;
  walk: number;
}

export function createExplorerPose(): ExplorerPose {
  return { phase: 0, walk: 0 };
}

/**
 * 程序化步行 / 待机: 腿前后摆、膝盖在后摆时弯曲、手臂反向摆动、
 * 身体上下起伏并略微前倾; 停下后回到带呼吸的待机姿态, 头灯随头部轻晃。
 */
export function animateExplorer(rig: ExplorerRig, pose: ExplorerPose, speed: number, t: number, dt: number): void {
  const target = Math.min(1, speed / WALK_SPEED);
  pose.walk += (target - pose.walk) * Math.min(1, dt * 10);
  const w = pose.walk;
  pose.phase += dt * (1.2 + speed * 2.35);
  const p = pose.phase;

  for (let i = 0; i < 2; i += 1) {
    // 骨架第 0 侧在 -x(左), 手臂向外张开需要同号的 z 旋转。
    const side = i === 0 ? -1 : 1;
    const swing = Math.sin(p + (i ? Math.PI : 0));
    rig.hips[i].rotation.x = -swing * 0.6 * w;
    rig.knees[i].rotation.x = Math.max(0, Math.sin(p + (i ? Math.PI : 0) - 1.2)) * 1.0 * w + 0.04;
    rig.shoulders[i].rotation.x = swing * 0.5 * w + 0.05;
    rig.shoulders[i].rotation.z = side * (0.1 + (1 - w) * 0.04);
    rig.elbows[i].rotation.x = -(0.3 + w * 0.35 + Math.max(0, swing) * 0.3 * w);
  }

  const breathe = Math.sin(t * 1.7) * (1 - w);
  rig.body.position.y = Math.abs(Math.cos(p)) * 0.045 * w - 0.02 * w;
  rig.torso.rotation.x = 0.1 * w + breathe * 0.02;
  rig.torso.rotation.y = Math.sin(p) * 0.09 * w;
  rig.torso.position.y = 0.95 + breathe * 0.006;
  rig.head.rotation.x = -0.06 * w + Math.sin(t * 0.6) * 0.03 * (1 - w) + Math.sin(p * 2) * 0.02 * w;
  rig.head.rotation.y = -rig.torso.rotation.y * 0.8 + Math.sin(t * 0.37) * 0.18 * (1 - w);
  rig.shaft.material.uniforms.uTime.value = t;
}
