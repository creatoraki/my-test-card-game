import type { ZoneId } from "../../types";
import { ARCADE_ZONE } from "./arcade";
import { CORE_ZONE } from "./core";
import { DOCK_ZONE } from "./dock";
import { PUMP_ZONE } from "./pump";
import { SERVER_ZONE } from "./server";
import type { ZoneShaders } from "./types";

const ZONES: Record<ZoneId, ZoneShaders> = {
  dock: DOCK_ZONE,
  pump: PUMP_ZONE,
  arcade: ARCADE_ZONE,
  server: SERVER_ZONE,
  core: CORE_ZONE,
};

export function getZone(id: ZoneId): ZoneShaders {
  return ZONES[id];
}

export type { ZoneShaders } from "./types";
