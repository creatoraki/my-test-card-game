import type { ZoneShaders } from "../../types";
import { GARDEN_FAR } from "./far";
import { GARDEN_FLOOR, GARDEN_FLOOR_LIVE } from "./floor";
import { GARDEN_FORE } from "./fore";
import { GARDEN_WALL, GARDEN_WALL_LIVE } from "./wall";

/** ② 空中花园廊桥: 敞开的廊架、绿篱与垂藤, 远处飞瀑与穹顶。 */
export const ARK_GARDEN_ZONE: ZoneShaders = {
  far: GARDEN_FAR,
  wall: GARDEN_WALL,
  wallLive: GARDEN_WALL_LIVE,
  floor: GARDEN_FLOOR,
  floorLive: GARDEN_FLOOR_LIVE,
  fore: GARDEN_FORE,
  ambient: { ambient: 0x98ad9e, ambientTop: 0xe2eee6, fogColor: 0xd2e8e4, fogDensity: 0.24 },
  grade: { tint: 0xfdfff4, shadowTint: 0x03080a, bloom: 0.32, saturation: 1.04, vignette: 0.28, exposure: 1.0 },
  accent: 0x5cf2d0,
  dust: { color: 0xf0ffc8, count: 160 },
};
