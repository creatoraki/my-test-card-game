import type { RoomDef } from "../../types";
import { GuardActor } from "../actors/guardActor";
import { BurstFx } from "../fx/sparks";
import { LightRig } from "../lighting/lightRig";
import { getZone } from "../zones";
import { Disposer } from "./disposer";
import type { ProgramKeeper } from "./programKeeper";
import { renderables } from "./roomLoader";
import { RoomScene } from "./roomScene";

/**
 * 后台预编译: 首个房间就绪后, 逐个为当前地图的其余房间建一份不烘焙的场景(用临时灯光与特效, 不影响正在玩的房间),
 * 异步编译全部程序后回收(ProgramKeeper 保留程序), 之后进入这些房间只剩烘焙。
 * 另外预编译一次守卫(首个房间可能没有守卫)。isStale 为真时中止。
 */
export async function warmOtherRooms(keeper: ProgramKeeper, rooms: readonly RoomDef[], currentRoomId: string, isStale: () => boolean): Promise<void> {
  const lights = new LightRig();
  const burst = new BurstFx();
  const pixelScale = { value: 1 };
  const disposer = new Disposer(keeper.retire);
  try {
    const guard = new GuardActor("warm", lights.uniforms, 1);
    await keeper.compile(renderables([guard.group]));
    disposer.disposeObjects(guard.group);

    for (const room of rooms) {
      if (isStale()) return;
      if (room.id === currentRoomId) continue;
      const scene = new RoomScene({ room, zone: getZone(room.zone), lights, burst, pixelScale, searched: new Set(), retire: keeper.retire });
      await keeper.compile(renderables(scene.compileTargets()));
      scene.dispose();
    }
  } finally {
    burst.dispose();
  }
}
