import type { ZoneShaders } from "../types";
import { PUMP_FAR } from "./far";
import { PUMP_FLOOR, PUMP_FLOOR_LIVE } from "./floor";
import { PUMP_FORE } from "./fore";
import { PUMP_WALL, PUMP_WALL_LIVE } from "./wall";

/** ② 泵站管廊: 青绿水光。 */
export const PUMP_ZONE: ZoneShaders = {
  far: PUMP_FAR,
  wall: PUMP_WALL,
  wallLive: PUMP_WALL_LIVE,
  floor: PUMP_FLOOR,
  floorLive: PUMP_FLOOR_LIVE,
  fore: PUMP_FORE,
  ambient: { ambient: 0x2c4642, ambientTop: 0x3a5a56, fogColor: 0x10302c, fogDensity: 0.5 },
  grade: { tint: 0xeafff8, shadowTint: 0x020e0c, bloom: 0.8 },
  accent: 0x5cf5d0,
  dust: { color: 0xb8fff0, count: 220 },
};
