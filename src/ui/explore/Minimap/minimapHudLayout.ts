import type { BoardMetrics } from "./minimapLayout";

/** HUD 缩略图方块尺寸固定; 外框固定 360×360(见 Minimap.module.css 的 .map), 只显示当前房间周边。 */
export const MINIMAP_HUD_METRICS: BoardMetrics = { tile: 32, stepX: 72, stepY: 66, label: 22 };
