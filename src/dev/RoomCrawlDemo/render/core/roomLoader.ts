import type * as THREE from "three";
import type { GuardState } from "../../engine/guardBrain";
import type { RoomDef } from "../../types";
import type { SurfaceBaker } from "../bake/surfaceBaker";
import type { BurstFx } from "../fx/sparks";
import type { LightRig } from "../lighting/lightRig";
import { getZone } from "../zones";
import type { ProgramKeeper } from "./programKeeper";
import { RoomScene } from "./roomScene";

/** 编译阶段在总进度里的占比, 其余为烘焙。 */
const COMPILE_SHARE = 0.6;

export interface RoomLoadContext {
  keeper: ProgramKeeper;
  baker: SurfaceBaker;
  lights: LightRig;
  burst: BurstFx;
  pixelScale: THREE.IUniform<number>;
}

export interface RoomLoadRequest {
  room: RoomDef;
  searched: ReadonlySet<string>;
  guards: readonly GuardState[];
  /** 为真时放弃本次加载(运行时已销毁或又开始了新的加载)。 */
  isStale(): boolean;
  /** 进度 0~1。 */
  onProgress(progress: number): void;
}

/** 场景里所有可渲染的叶子对象(逐个编译, 进度更细)。 */
export function renderables(roots: readonly THREE.Object3D[]): THREE.Object3D[] {
  const list: THREE.Object3D[] = [];
  for (const root of roots) {
    root.traverse((obj) => {
      const o = obj as THREE.Mesh;
      if ((o.isMesh || (obj as THREE.Points).isPoints) && o.material) list.push(obj);
    });
  }
  return list;
}

/**
 * 异步加载一个房间: 建网格与材质 → 并行编译全部程序(不阻塞主线程) → 分帧烘焙 → 返回可上场的房间。
 * 过期时回收已建内容并返回 null。
 */
export async function loadRoom(ctx: RoomLoadContext, req: RoomLoadRequest): Promise<RoomScene | null> {
  const zone = getZone(req.room.zone);
  const room = new RoomScene({
    room: req.room,
    zone,
    lights: ctx.lights,
    burst: ctx.burst,
    pixelScale: ctx.pixelScale,
    searched: req.searched,
    retire: ctx.keeper.retire,
  });
  // 守卫渲染体按需创建, 先建出来一起编译
  room.syncGuards(req.guards, 0);

  const targets = renderables(room.compileTargets());
  let compiled = 0;
  await ctx.keeper.compile(targets, () => req.onProgress((++compiled / targets.length) * COMPILE_SHARE));
  if (req.isStale()) {
    room.dispose();
    return null;
  }

  const tiles = room.bakeTiles(ctx.baker);
  let baked = 0;
  const done = await room.bake(ctx.baker, req.isStale, () => req.onProgress(COMPILE_SHARE + (++baked / tiles) * (1 - COMPILE_SHARE)));
  if (!done || req.isStale()) {
    room.dispose();
    return null;
  }
  req.onProgress(1);
  return room;
}
