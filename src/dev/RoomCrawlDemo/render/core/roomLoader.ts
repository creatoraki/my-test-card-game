import type * as THREE from "three";
import type { GuardState } from "../../engine/guardBrain";
import type { RoomDef } from "../../types";
import type { BakeCache } from "../bake/bakeCache";
import { FOREGROUND_PACE, FrameBudget, type SurfaceBaker } from "../bake/surfaceBaker";
import type { BurstFx } from "../fx/sparks";
import type { LightRig } from "../lighting/lightRig";
import { getZone } from "../zones";
import type { ProgramKeeper } from "./programKeeper";
import { RoomScene } from "./roomScene";

export interface RoomLoadContext {
  keeper: ProgramKeeper;
  baker: SurfaceBaker;
  cache: BakeCache;
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
 * 异步加载一个房间, 编译与烘焙流水线化:
 * 先只编译缓存未命中的烘焙面片 → 立即按前台预算烘焙, 同时并行编译场景树的实时程序 → 两者都完成后返回。
 * 缓存命中的烘焙直接回填。过期时回收已建内容并返回 null。
 */
export async function loadRoom(ctx: RoomLoadContext, req: RoomLoadRequest): Promise<RoomScene | null> {
  const t0 = performance.now();
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

  const budget = new FrameBudget(FOREGROUND_PACE);
  const jobCount = room.bakeJobs.length;
  const pending = room.pendingJobs(ctx.cache);
  const bakeTargets = renderables(pending.map((job) => job.mesh));
  const liveTargets = renderables([room.group]);
  const tiles = room.bakeTiles(ctx.baker, ctx.cache, budget.pace.tileW);
  const total = bakeTargets.length + liveTargets.length + tiles;
  let done = 0;
  const tick = () => req.onProgress(Math.min(1, ++done / total));

  await ctx.keeper.compile(bakeTargets, tick);
  if (req.isStale()) {
    room.dispose();
    return null;
  }

  let compileEnd = 0;
  const [, baked] = await Promise.all([
    ctx.keeper.compile(liveTargets, tick).then(() => { compileEnd = performance.now(); }),
    room.bake(ctx.baker, ctx.cache, budget, req.isStale, tick),
  ]);
  if (!baked || req.isStale()) {
    room.dispose();
    return null;
  }
  req.onProgress(1);
  if (import.meta.env.DEV) {
    const end = performance.now();
    console.info(`[废弃楼层] 进入「${req.room.name}」: 共 ${Math.round(end - t0)}ms, 编译 ${Math.round(compileEnd - t0)}ms, 烘焙 ${tiles} 块, 缓存命中 ${jobCount - pending.length}/${jobCount}`);
  }
  return room;
}
