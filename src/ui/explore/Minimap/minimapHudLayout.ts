import type { DungeonState } from "@/explore/dungeon/types";
import { layoutBoard, type BoardMetrics } from "./minimapLayout";

/** 外框固定 360 高；地图超出正方形时只增加宽度。字号独立保持 18px。 */
export function minimapHudLayout(bounds: DungeonState["bounds"]) {
  const metrics: BoardMetrics = { tile: 32, stepX: 72, stepY: 66, label: 22 };
  const size = layoutBoard([], [], bounds, metrics);
  return { metrics, width: Math.max(360, size.width + 32), height: 360 };
}
