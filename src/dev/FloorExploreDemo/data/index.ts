import type { RoomDef } from "../types";
import { LOBBY } from "./lobby";
import { OFFICE } from "./office";
import { PANTRY } from "./pantry";
import { ARCHIVE } from "./archive";
import { STAIRWELL } from "./stairwell";

export { STRUCTURE, PROP_INFO, PROP_FOOTPRINT, DECOR_FOOTPRINT } from "./footprints";

export const FLOOR_NAME = "十三层";
export const START_ROOM_ID = LOBBY.id;

export const FLOOR_ROOMS: Record<string, RoomDef> = Object.fromEntries(
  [LOBBY, OFFICE, PANTRY, ARCHIVE, STAIRWELL].map((room) => [room.id, room]),
);

export function getRoom(roomId: string): RoomDef {
  return FLOOR_ROOMS[roomId] ?? LOBBY;
}
