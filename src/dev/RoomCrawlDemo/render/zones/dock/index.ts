import type { ZoneShaders } from "../types";
import { DOCK_FAR } from "./far";
import { DOCK_FLOOR, DOCK_FLOOR_LIVE } from "./floor";
import { DOCK_FORE } from "./fore";
import { DOCK_WALL, DOCK_WALL_LIVE } from "./wall";

/** ① 货运入口: 琥珀钠灯 × 冷蓝夜色。 */
export const DOCK_ZONE: ZoneShaders = {
  far: DOCK_FAR,
  wall: DOCK_WALL,
  wallLive: DOCK_WALL_LIVE,
  floor: DOCK_FLOOR,
  floorLive: DOCK_FLOOR_LIVE,
  fore: DOCK_FORE,
  ambient: { ambient: 0x3a4250, ambientTop: 0x4a5670, fogColor: 0x1c2636, fogDensity: 0.32 },
  grade: { tint: 0xfff2e2, shadowTint: 0x030a0e, bloom: 0.78 },
  accent: 0xffb45a,
  dust: { color: 0xffd6a0, count: 260 },
};
