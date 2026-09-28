import type { ZoneShaders } from "../../types";
import { GROVE_FAR } from "./far";
import { GROVE_FLOOR, GROVE_FLOOR_LIVE } from "./floor";
import { GROVE_FORE } from "./fore";
import { GROVE_WALL, GROVE_WALL_LIVE } from "./wall";

/** ③ 古树穹顶: 穹顶内的巨树、苔石与浅潭, 树冠下的柔和绿光。 */
export const ARK_GROVE_ZONE: ZoneShaders = {
  far: GROVE_FAR,
  wall: GROVE_WALL,
  wallLive: GROVE_WALL_LIVE,
  floor: GROVE_FLOOR,
  floorLive: GROVE_FLOOR_LIVE,
  fore: GROVE_FORE,
  ambient: { ambient: 0x7f9a88, ambientTop: 0xcfe4d4, fogColor: 0xc4e0d6, fogDensity: 0.3 },
  grade: { tint: 0xf8fff2, shadowTint: 0x02080a, bloom: 0.36, saturation: 1.04, vignette: 0.34, exposure: 1.0 },
  accent: 0x6cf0c0,
  dust: { color: 0xeaffc0, count: 200 },
};
