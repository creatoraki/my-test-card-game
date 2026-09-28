import type { ZoneShaders } from "../types";
import { CORE_FAR } from "./far";
import { CORE_FLOOR, CORE_FLOOR_LIVE } from "./floor";
import { CORE_FORE } from "./fore";
import { CORE_WALL, CORE_WALL_LIVE } from "./wall";

/** ⑤ 冷却核心: 红 × 黑。 */
export const CORE_ZONE: ZoneShaders = {
  far: CORE_FAR,
  wall: CORE_WALL,
  wallLive: CORE_WALL_LIVE,
  floor: CORE_FLOOR,
  floorLive: CORE_FLOOR_LIVE,
  fore: CORE_FORE,
  ambient: { ambient: 0x442c2a, ambientTop: 0x563634, fogColor: 0x3a0c08, fogDensity: 0.42 },
  grade: { tint: 0xffece6, shadowTint: 0x0c0204, bloom: 0.9 },
  accent: 0xff4a32,
  dust: { color: 0xff9a80, count: 200 },
};
