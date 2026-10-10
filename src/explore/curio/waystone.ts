// ============================================================================
// 月光传送盆(传送雕像) —— 每图至多一对，常驻、不计入清房。
// · 点亮：走普通交互结算(收服务粒子)，同时在小地图上点亮另一座所在的房间；
// · 传送：两座都点亮后，在任一座旁直接传送到另一座身边，每次 WAYSTONE_RULES.travelEnergy 粒子。
// 点亮状态存在房间图的 RoomCurio.lit 上，换房、战斗后都不会丢。
// ============================================================================

import { WAYSTONE_RULES } from "@/data/curios/rules/serviceBalance";
import { clampCorridorX } from "../corridor/corridorSession";
import { currentRoom, enterRoom, syncRoomFromScene } from "../dungeon/dungeonSession";
import type { RoomCurio, RoomNode } from "../dungeon/types";
import { changeEnergy } from "../resources/energy";
import type { ExploreState } from "../types";

interface WaystoneRef {
  room: RoomNode;
  curio: RoomCurio;
}

/** 落地时站在能量盆旁边的距离，避免一落地就压在能量盆上。 */
const LANDING_OFFSET = 200;

function allWaystones(s: ExploreState): WaystoneRef[] {
  if (!s.dungeon) return [];
  return s.dungeon.order.flatMap((id) => {
    const room = s.dungeon?.rooms[id];
    return room ? room.curios.filter((curio) => curio.kind === "waystone").map((curio) => ({ room, curio })) : [];
  });
}

/** 当前打开的那座能量盆。 */
function activeWaystone(s: ExploreState): WaystoneRef | null {
  const room = currentRoom(s);
  const id = s.corridor?.activeObjectId;
  const curio = id ? room?.curios.find((candidate) => candidate.id === id && candidate.kind === "waystone") : undefined;
  return room && curio ? { room, curio } : null;
}

function partnerOf(s: ExploreState, ref: WaystoneRef): WaystoneRef | null {
  return allWaystones(s).find((other) => other.curio.id !== ref.curio.id) ?? null;
}

export function activeWaystoneLit(s: ExploreState): boolean {
  return Boolean(activeWaystone(s)?.curio.lit);
}

/** 传送不可用的原因；可用时返回 null。 */
export function waystoneTravelReason(s: ExploreState): string | null {
  const here = activeWaystone(s);
  if (!here?.curio.lit) return "这座能量盆尚未点亮";
  const there = partnerOf(s, here);
  if (!there) return "没有找到另一座能量盆";
  if (!there.curio.lit) return "另一座能量盆尚未点亮";
  return null;
}

/** 点亮当前能量盆，并让另一座所在的房间出现在小地图上。 */
export function lightWaystone(s: ExploreState): string {
  const here = activeWaystone(s);
  if (!here) return "没有可点亮的能量盆";
  here.curio.lit = true;
  const there = partnerOf(s, here);
  if (!there) return "能量盆已点亮";
  there.room.revealed = true;
  return there.curio.lit
    ? "两座能量盆都已点亮，现在可以互相传送"
    : "能量盆已点亮，小地图上标出了另一座能量盆的位置";
}

/** 传送到另一座能量盆旁边。由界面在黑场过渡中调用，不经过普通交互结算。 */
export function travelByWaystone(s: ExploreState): boolean {
  if (s.phase !== "landed" || !s.corridor || waystoneTravelReason(s)) return false;
  const here = activeWaystone(s);
  const there = here ? partnerOf(s, here) : null;
  if (!there) return false;
  syncRoomFromScene(s);
  s.corridor.activeObjectId = null;
  s.landedIndex = null;
  s.phase = "atNode";
  changeEnergy(s, -WAYSTONE_RULES.travelEnergy);
  s.log.push(`月光传送：前往 ${there.room.label} 号房间 · 净化粒子 −${WAYSTONE_RULES.travelEnergy}`);
  if (!enterRoom(s, there.room.id, null)) return false;
  const corridor = s.corridor;
  if (corridor?.roomId === there.room.id && s.phase === "atNode") {
    const side = there.curio.x < corridor.width / 2 ? 1 : -1;
    corridor.playerX = clampCorridorX(corridor, there.curio.x + side * LANDING_OFFSET);
    corridor.facing = side === 1 ? -1 : 1;
  }
  return true;
}
