import { getRoom } from "../../data";
import type { BakeCache } from "../bake/bakeCache";
import { BACKGROUND_PACE, FrameBudget, nextFrame, type SurfaceBaker } from "../bake/surfaceBaker";
import { BurstFx } from "../fx/sparks";
import { LightRig } from "../lighting/lightRig";
import { getZone } from "../zones";
import type { ProgramKeeper } from "./programKeeper";
import { renderables } from "./roomLoader";
import { RoomScene } from "./roomScene";

export interface PrebakeContext {
  keeper: ProgramKeeper;
  baker: SurfaceBaker;
  cache: BakeCache;
}

/** 某房间的门通向的全部房间 id(去重)。 */
export function neighborsOf(roomId: string): string[] {
  return [...new Set(getRoom(roomId).doors.map((door) => door.to))];
}

/**
 * 后台预烘焙: 游玩中把当前房间相邻、缓存里还没有的房间逐个烘进缓存, 之后过门只剩极短的加载。
 * 每个房间建一份不上场的场景(临时灯光与特效, 不影响正在玩的房间), 只编译烘焙面片(程序已常驻, 很快),
 * 按后台节奏每帧烘一窄块; canRun 为假(非游玩阶段)时暂停, isStale 为真时中止, 已烘完的工作保留在缓存。
 */
export async function prebakeNeighbors(ctx: PrebakeContext, roomId: string, isStale: () => boolean, canRun: () => boolean): Promise<void> {
  const lights = new LightRig();
  const burst = new BurstFx();
  const budget = new FrameBudget(BACKGROUND_PACE, canRun);
  try {
    for (const id of neighborsOf(roomId)) {
      while (!canRun() && !isStale()) await nextFrame();
      if (isStale()) return;
      const room = getRoom(id);
      const scene = new RoomScene({ room, zone: getZone(room.zone), lights, burst, pixelScale: { value: 1 }, searched: new Set(), retire: ctx.keeper.retire });
      try {
        const pending = scene.pendingJobs(ctx.cache);
        if (pending.length === 0) continue;
        await ctx.keeper.compile(renderables(pending.map((job) => job.mesh)));
        if (isStale()) return;
        await scene.bake(ctx.baker, ctx.cache, budget, isStale);
      } finally {
        scene.dispose();
      }
    }
  } finally {
    burst.dispose();
  }
}
