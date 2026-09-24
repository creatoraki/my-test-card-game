import type * as THREE from "three";
import type { RoomDef } from "../../types";
import type { Disposer } from "../core/disposer";
import type { MaterialKit } from "../materials/materialKit";
import type { Rng } from "../textures/canvasNoise";

/** 逐帧动画钩子: 闪烁、漂浮、粒子。t 为累计秒数。 */
export interface Animated {
  update(t: number, dt: number): void;
}

export interface PickInfo {
  kind: "prop" | "door";
  id: string;
}

/** 各个构建函数共用的上下文。 */
export interface BuildContext {
  room: RoomDef;
  kit: MaterialKit;
  disposer: Disposer;
  animated: Animated[];
  /** 可被射线拾取的隐形碰撞体, userData.pick 为 PickInfo。 */
  pickables: THREE.Object3D[];
  rng: Rng;
}
