import { seedMessengers } from "../curio/messenger";
import { corridorPortalXFor, corridorSlotsFor } from "../corridor/types";
import type { ExploreState } from "../types";
import { link, makeRoom } from "./roomNode";
import { assignNearMapVariants } from "./nearMapAssignment";
import type { DungeonRoomPlan, DungeonState, RoomNode } from "./types";

function assignTutorialNearMaps(s: ExploreState, rooms: Record<string, RoomNode>, order: string[]): void {
  assignNearMapVariants(s, rooms, order, [
    "neonCity1", "neonCity2", "neonCity3", "neonCity4",
  ]);
}

function middleSlotIndex(index: number, count: number): number {
  return Math.min(7, Math.max(0, Math.floor(((index + 1) * 8) / (count + 1))));
}

function layoutPlannedRoom(room: RoomNode, plan: DungeonRoomPlan): void {
  const middleSlots = corridorSlotsFor(room.nearMapVariant);
  if (room.exits.left) room.portalX.left = corridorPortalXFor(room.nearMapVariant, "left");
  if (room.exits.right) room.portalX.right = corridorPortalXFor(room.nearMapVariant, "right");

  room.curios = plan.curios.map((kind, index) => ({
    id: `${room.id}-curio-${index}`,
    kind,
    x: middleSlots[middleSlotIndex(index, plan.curios.length)],
    used: false,
  }));
  if (room.kind === "boss") room.bossGateX = middleSlots[middleSlots.length - 1];
}

export function generatePlannedDungeon(s: ExploreState, plan: readonly DungeonRoomPlan[]): DungeonState {
  if (!plan.length) throw new Error("固定房间蓝图不能为空");

  const order = plan.map((_, index) => `room-${index}-0`);
  const rooms: Record<string, RoomNode> = {};
  for (const [index, roomPlan] of plan.entries()) {
    const room = makeRoom(index, 0, index + 1);
    room.kind = roomPlan.kind;
    room.depth = index;
    room.guard = roomPlan.guard;
    rooms[room.id] = room;
  }
  for (let index = 1; index < order.length; index += 1) {
    link(rooms[order[index - 1]], rooms[order[index]], "right");
  }
  assignTutorialNearMaps(s, rooms, order);
  const curios = Object.fromEntries(plan.map((room, index) => [order[index], [...room.curios]]));
  seedMessengers(s, curios);
  for (const [index, roomPlan] of plan.entries()) layoutPlannedRoom(rooms[order[index]], { ...roomPlan, curios: curios[order[index]] });

  return {
    rooms,
    order,
    startRoomId: order[0],
    bossRoomId: order[order.length - 1],
    currentRoomId: order[0],
    layoutKnown: false,
    threatsKnown: false,
    bounds: { minX: 0, maxX: order.length - 1, minY: 0, maxY: 0 },
  };
}
