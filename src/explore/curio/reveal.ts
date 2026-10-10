import type { ExploreState } from "../types";
import type { PortalDir, RoomKind } from "../dungeon/types";

export function revealDungeon(s: ExploreState, threats: boolean): void {
  if (!s.dungeon) return;
  s.dungeon.layoutKnown = true;
  if (threats) s.dungeon.threatsKnown = true;
  for (const room of Object.values(s.dungeon.rooms)) room.revealed = true;
}

const DOOR_NAME: Record<PortalDir, string> = { left: "左门", right: "右门", up: "中门", down: "中门" };
const KIND_NAME: Record<RoomKind, string> = {
  start: "起始房间",
  normal: "物资房间",
  battle: "战斗房间",
  trap: "陷阱房间",
  boss: "首领房间",
};

/** 路牌：揭示当前房间所有出口通往的房间及其类型。 */
export function revealAdjacent(s: ExploreState): string {
  const room = s.dungeon?.rooms[s.dungeon.currentRoomId];
  if (!s.dungeon || !room) return "路牌上没有可辨认的记号";
  const lines: string[] = [];
  for (const [dir, id] of Object.entries(room.exits) as [PortalDir, string][]) {
    const target = s.dungeon.rooms[id];
    if (!target) continue;
    target.revealed = true;
    target.kindKnown = true;
    const extras = [
      ...(target.kind === "battle" && target.threatDefeated ? ["已肃清"] : []),
      ...(target.curios.some((curio) => curio.kind === "merchant") ? ["有流浪货商"] : []),
      ...(target.curios.some((curio) => curio.kind === "blacksmith") ? ["有锻造师"] : []),
    ];
    lines.push(`${DOOR_NAME[dir]}通往${KIND_NAME[target.kind]}${extras.length ? `（${extras.join("，")}）` : ""}`);
  }
  return lines.length ? lines.join("；") : "这间房没有其他出口";
}
