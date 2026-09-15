import { OPPOSITE_DIR, roomIdAt, type PortalDir, type RoomNode } from "./types";

export function makeRoom(gx: number, gy: number, label: number): RoomNode {
  return {
    id: roomIdAt(gx, gy), gx, gy, kind: "normal", nearMapVariant: "standard", depth: 0, label,
    curios: [], exits: {}, portalX: {}, visited: false, threatDefeated: false, revealed: false,
  };
}

export function link(a: RoomNode, b: RoomNode, dir: PortalDir): void {
  a.exits[dir] = b.id;
  b.exits[OPPOSITE_DIR[dir]] = a.id;
}
