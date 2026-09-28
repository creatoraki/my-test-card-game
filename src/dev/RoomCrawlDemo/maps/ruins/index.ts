import type { MapDef } from "../../types";
import { ARCADE_ROOM } from "./arcadeRoom";
import { CORE_ROOM } from "./coreRoom";
import { DOCK_ROOM } from "./dockRoom";
import { PUMP_ROOM } from "./pumpRoom";
import { SERVER_ROOM } from "./serverRoom";

/**
 * 《废弃楼层》拓扑:
 *           [④ 数据机房]
 *                │
 * [① 货运入口]─[② 泵站管廊]─[③ 霓虹旧商场]
 *                               │
 *                         [⑤ 冷却核心]
 */
export const RUINS_MAP: MapDef = {
  id: "ruins",
  name: "废弃楼层",
  rooms: [DOCK_ROOM, PUMP_ROOM, ARCADE_ROOM, SERVER_ROOM, CORE_ROOM],
  start: DOCK_ROOM.id,
};
