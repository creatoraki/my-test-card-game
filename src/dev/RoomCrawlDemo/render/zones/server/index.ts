import type { ZoneShaders } from "../types";
import { SERVER_FAR } from "./far";
import { SERVER_FLOOR, SERVER_FLOOR_LIVE } from "./floor";
import { SERVER_FORE } from "./fore";
import { SERVER_WALL, SERVER_WALL_LIVE } from "./wall";

/** ④ 数据机房: 冷蓝。 */
export const SERVER_ZONE: ZoneShaders = {
  far: SERVER_FAR,
  wall: SERVER_WALL,
  wallLive: SERVER_WALL_LIVE,
  floor: SERVER_FLOOR,
  floorLive: SERVER_FLOOR_LIVE,
  fore: SERVER_FORE,
  ambient: { ambient: 0x2e3a52, ambientTop: 0x3c4c6c, fogColor: 0x1a3052, fogDensity: 0.55 },
  grade: { tint: 0xeaf2ff, shadowTint: 0x030814, bloom: 0.85 },
  accent: 0x6ec0ff,
  dust: { color: 0xc8e4ff, count: 180 },
};
