import type { MutableRefObject, RefObject } from "react";
import { cameraCss, CAMERA_REST, CAMERA_REST_EPS, type Camera } from "./camera";
import { unitPlaneMatrix, type WorldFx } from "./planeProjection";
import { planeUnitAnchor } from "./worldBox";

// 相机 rig 的 DOM 写入端: rAF 循环只算数, 落到哪些元素、怎么写都在这里。
//
// 三类目标:
// - scene / world: 透视容器里的纵深层(背景、粒子), 写 3D cameraCss 与世界层 2D 效果;
// - plane units: 脱离透视的敌人单位包裹层, 每个写一个线性化后的 2D matrix()。
//   ⚠ plane units 刻意不设 will-change —— 那会让浏览器按设值瞬间的倍率锁死位图, 推镜即糊。

export interface RigTargets {
  sceneTargetsRef: MutableRefObject<Set<HTMLElement>>;
  worldTargetsRef: MutableRefObject<Set<HTMLElement>>;
  planeRef: RefObject<HTMLElement>;
  planeUnitsRef: MutableRefObject<Set<HTMLElement>>;
}

export const FX_REST: WorldFx = { x: 0, y: 0, k: 1 };

const isRestCamera = (camera: Camera) =>
  (Object.keys(CAMERA_REST) as (keyof Camera)[]).every(
    (key) => Math.abs(camera[key] - CAMERA_REST[key]) < CAMERA_REST_EPS,
  );

const isRestFx = (fx: WorldFx) =>
  Math.abs(fx.x) < CAMERA_REST_EPS && Math.abs(fx.y) < CAMERA_REST_EPS && Math.abs(fx.k - 1) < CAMERA_REST_EPS;

export function setDepthWillChange(targets: RigTargets, on: boolean): void {
  const value = on ? "transform" : "auto";
  for (const el of targets.sceneTargetsRef.current) el.style.willChange = value;
  for (const el of targets.worldTargetsRef.current) el.style.willChange = value;
}

export function worldFxCss(fx: WorldFx): string {
  return isRestFx(fx) ? "" : `translate(${fx.x}px, ${fx.y}px) scale(${fx.k})`;
}

/** 敌人平面: 先批量读布局、再批量写 transform, 避免读写交错引发强制同步布局。 */
export function writePlane(targets: RigTargets, camera: Camera, fx: WorldFx): void {
  const units = targets.planeUnitsRef.current;
  if (units.size === 0) return;
  if (isRestCamera(camera) && isRestFx(fx)) {
    for (const el of units) el.style.transform = "";
    return;
  }
  const root = targets.planeRef.current;
  if (!root) return;
  const plans = Array.from(units, (el) => ({ el, ...planeUnitAnchor(root, el) }));
  for (const { el, origin, anchor } of plans) {
    el.style.transform = unitPlaneMatrix(camera, fx, origin, anchor);
  }
}

export function writeFrame(targets: RigTargets, camera: Camera, fx: WorldFx): void {
  const scene = cameraCss(camera);
  const world = worldFxCss(fx);
  for (const el of targets.sceneTargetsRef.current) el.style.transform = scene;
  for (const el of targets.worldTargetsRef.current) el.style.transform = world;
  writePlane(targets, camera, fx);
}

export function writeDof(targets: Set<HTMLElement>, dof: string): void {
  for (const el of targets) el.style.setProperty("--dof", dof);
}
