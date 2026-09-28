import type { ZoneShaders } from "../types";
import { ARCADE_FAR } from "./far";
import { ARCADE_FLOOR, ARCADE_FLOOR_LIVE } from "./floor";
import { ARCADE_FORE } from "./fore";
import { ARCADE_WALL, ARCADE_WALL_LIVE } from "./wall";

/** ③ 霓虹旧商场: 品红 × 青色。 */
export const ARCADE_ZONE: ZoneShaders = {
  far: ARCADE_FAR,
  wall: ARCADE_WALL,
  wallLive: ARCADE_WALL_LIVE,
  floor: ARCADE_FLOOR,
  floorLive: ARCADE_FLOOR_LIVE,
  fore: ARCADE_FORE,
  ambient: { ambient: 0x3e3448, ambientTop: 0x4c4060, fogColor: 0x24122e, fogDensity: 0.3 },
  grade: { tint: 0xfff0fc, shadowTint: 0x08040e, bloom: 0.95 },
  accent: 0xff5ad2,
  dust: { color: 0xffc8f0, count: 200 },
};
