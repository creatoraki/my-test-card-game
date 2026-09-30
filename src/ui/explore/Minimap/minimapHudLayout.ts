import type { BoardMetrics } from "./minimapLayout";

/** HUD 缩略图方块尺寸固定; 外框固定 360×360(见 Minimap.module.css 的 .map), 只显示当前房间周边。
 *  纵向步长 = 方块 32 + 序号 22 + 道路 26, 让十字的竖臂和横臂(72 − 32 = 40)长度相近。 */
export const MINIMAP_HUD_METRICS: BoardMetrics = { tile: 32, stepX: 72, stepY: 80, label: 22 };
