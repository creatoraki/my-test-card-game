import type { ZoneShaders } from "../../types";
import { DECK_FAR } from "./far";
import { DECK_FLOOR, DECK_FLOOR_LIVE } from "./floor";
import { DECK_FORE } from "./fore";
import { DECK_WALL, DECK_WALL_LIVE } from "./wall";

/** ① 方舟观景台: 晴空日光、白色结构、青色灯带。 */
export const ARK_DECK_ZONE: ZoneShaders = {
  far: DECK_FAR,
  wall: DECK_WALL,
  wallLive: DECK_WALL_LIVE,
  floor: DECK_FLOOR,
  floorLive: DECK_FLOOR_LIVE,
  fore: DECK_FORE,
  ambient: { ambient: 0x93a6b4, ambientTop: 0xdce8f2, fogColor: 0xcfe4ee, fogDensity: 0.22 },
  grade: { tint: 0xfffaf2, shadowTint: 0x03070a, bloom: 0.32, saturation: 1.02, vignette: 0.28, exposure: 1.0 },
  accent: 0x4ff0e0,
  dust: { color: 0xf4ffd0, count: 140 },
};
