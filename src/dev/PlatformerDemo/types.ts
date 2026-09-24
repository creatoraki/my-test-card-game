// 横版跳跃演示的共享类型。坐标全部为世界设计 px，y 轴向下，实体 y 表示脚底。

export interface Vec {
  x: number;
  y: number;
}

/** 可站立面：y 为顶面高度，ground 为主地面段，float 为可从下方穿过的单向浮空平台。 */
export interface Platform {
  id: string;
  kind: "ground" | "float";
  x: number;
  y: number;
  w: number;
}

export type PickupKind = "seedPod" | "dewFlask" | "sporeLamp" | "geneCase" | "bioCore";

export interface PickupSpawn {
  id: string;
  kind: PickupKind;
  x: number;
  y: number;
}

export interface EnemySpawn {
  id: string;
  x: number;
  y: number;
  minX: number;
  maxX: number;
}

export interface InputState {
  left: boolean;
  right: boolean;
  jumpHeld: boolean;
  /** 本次按下沿，被物理步进消费后清零。 */
  jumpPressed: boolean;
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  grounded: boolean;
  coyote: number;
  jumpBuffer: number;
  jumpCut: boolean;
  /** 奔跑步态相位（弧度），随移动距离推进。 */
  runPhase: number;
  landTimer: number;
  takeoffTimer: number;
  safe: Vec;
}

export type EnemyMode = "patrol" | "alert" | "chase" | "return" | "vanish" | "gone";

export interface EnemyState {
  id: string;
  x: number;
  y: number;
  homeY: number;
  minX: number;
  maxX: number;
  dir: 1 | -1;
  mode: EnemyMode;
  timer: number;
  pause: number;
  lose: number;
}

export type WorldEvent =
  | { type: "enemyMode"; id: string; mode: EnemyMode }
  | { type: "respawn" };
