import type { MapDef } from "../../types";
import { ARK_DECK_ROOM } from "./deckRoom";
import { ARK_GARDEN_ROOM } from "./gardenRoom";
import { ARK_GROVE_ROOM } from "./groveRoom";

/**
 * 《生态方舟》拓扑:
 * [① 方舟观景台]─[② 空中花园廊桥]─[③ 古树穹顶]
 */
export const ARK_MAP: MapDef = {
  id: "ark",
  name: "生态方舟",
  rooms: [ARK_DECK_ROOM, ARK_GARDEN_ROOM, ARK_GROVE_ROOM],
  start: ARK_DECK_ROOM.id,
};
