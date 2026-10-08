// 卡牌三选一面板的几何常量(设计 px, 1920×1080 固定画布)。
// 外框轮廓、选中框、连接线、各区块落位全部从这里取 —— 改尺寸只动这一个文件。
// 坐标原点 = 面板左上角; 布局测量见 docs/卡牌三选一面板还原方案.md「布局测量」。

export type Point = readonly [number, number];

export const PANEL_W = 1400;
export const PANEL_H = 916;

/** 面板外轮廓(顺时针): 左上页签 → 台阶下沉 → 右侧主体 → 右下为按钮外扩 → 底边在按钮区下沉一级。 */
export const PANEL_OUTLINE: readonly Point[] = [
  [0, 38], [38, 0], [500, 0], [544, 44], [1336, 44], [1360, 68],
  [1360, 720], [1400, 760], [1400, 892], [1376, 916],
  [700, 916], [680, 896], [38, 896], [0, 858],
];

/** 内层暗线与面板底图的内缩量。 */
export const PANEL_INSET = 8;

/** 外框上加粗发光的折角段(沿外轮廓取的几段折线)。cyan = 冰青, violet = 主紫。 */
export const PANEL_ACCENTS: readonly { tone: "cyan" | "violet"; points: readonly Point[] }[] = [
  { tone: "cyan", points: [[0, 190], [0, 38], [38, 0], [360, 0]] },
  { tone: "violet", points: [[1180, 44], [1336, 44], [1360, 68], [1360, 170]] },
  { tone: "cyan", points: [[0, 740], [0, 858], [38, 896], [170, 896]] },
  { tone: "violet", points: [[1360, 600], [1360, 720], [1400, 760], [1400, 892], [1376, 916], [1180, 916]] },
];

// ── 候选卡 ──
export const CARD_W = 350;
export const CARD_TEXT_H = 140;
export const CARD_H = CARD_W + CARD_TEXT_H;
export const CARD_GAP = 46;
/** 归属行高 + 与卡面的间距。 */
export const OWNER_ROW_H = 32;
export const OWNER_GAP = 14;
/** 候选网格左上角(含归属行); 三卡总宽 1142 在主体宽 1360 内居中。 */
export const GRID_LEFT = 109;
export const GRID_TOP = 218;
export const CARD_TOP = GRID_TOP + OWNER_ROW_H + OWNER_GAP;
export const CARD_BOTTOM = CARD_TOP + CARD_H;

export const columnCenter = (index: number) => GRID_LEFT + index * (CARD_W + CARD_GAP) + CARD_W / 2;

/** 卡面自身 clip-path 的斜切量(HandCard 固定 14px, 不随放大变化)。 */
export const CARD_CHAMFER = 14;

/** 选中框相对卡面的外扩量与斜切量: 设计稿里霓虹框紧贴卡缘(卡自己的钢框同时转紫), 只外扩 4px。 */
export const SELECT_OUTSET = 4;
export const SELECT_CHAMFER = CARD_CHAMFER + SELECT_OUTSET;

// ── 选中连接线: 选中卡底部中点 → 下折 → 左行到底栏提示区左端 ──
export const CONNECTOR_START_Y = CARD_BOTTOM + SELECT_OUTSET + 12;
export const CONNECTOR_BEND_Y = 806;
export const CONNECTOR_END_X = 78;

export const connectorPoints = (index: number): readonly Point[] => {
  const x = columnCenter(index);
  return [[x, CONNECTOR_START_Y], [x, CONNECTOR_BEND_Y], [CONNECTOR_END_X, CONNECTOR_BEND_Y]];
};

// ── 底栏 ──
export interface Rect { x: number; y: number; w: number; h: number }

/** 提示行与「放弃」按钮竖向居中对齐(中线 y = 848)。 */
export const FOOTER_HINT: Rect = { x: 95, y: 830, w: 560, h: 36 };
export const SKIP_BUTTON: Rect = { x: 753, y: 808, w: 272, h: 80 };
export const CONFIRM_BUTTON: Rect = { x: 1054, y: 798, w: 322, h: 94 };
/** 按钮左上/右下斜切量(与 PickButton.module.css 的 .face clip-path 同步)。 */
export const BUTTON_CHAMFER = 22;

export const chamferBox = (w: number, h: number, c: number, inset = 0): Point[] => [
  [c + inset, inset], [w - inset, inset], [w - inset, h - c - inset],
  [w - c - inset, h - inset], [inset, h - inset], [inset, c + inset],
];

// ── 工具 ──
export const toSvgPoints = (points: readonly Point[]) => points.map(([x, y]) => `${x},${y}`).join(" ");

export const toClipPolygon = (points: readonly Point[]) =>
  `polygon(${points.map(([x, y]) => `${x}px ${y}px`).join(", ")})`;

/**
 * 顺时针多边形整体内缩 d(斜接): 每条边沿内法线平移 d, 相邻两条平移线求交即新顶点。
 * 屏幕坐标 y 向下, 顺时针时边向量 (dx, dy) 的内法线为 (-dy, dx)。
 */
export function insetPolygon(points: readonly Point[], d: number): Point[] {
  const n = points.length;
  const lines = points.map((p, i) => {
    const q = points[(i + 1) % n];
    const dx = q[0] - p[0];
    const dy = q[1] - p[1];
    const len = Math.hypot(dx, dy);
    const nx = -dy / len;
    const ny = dx / len;
    return { x: p[0] + nx * d, y: p[1] + ny * d, dx, dy };
  });
  return lines.map((cur, i) => {
    const prev = lines[(i - 1 + n) % n];
    const cross = prev.dx * cur.dy - prev.dy * cur.dx;
    const t = ((cur.x - prev.x) * cur.dy - (cur.y - prev.y) * cur.dx) / cross;
    return [Math.round((prev.x + prev.dx * t) * 10) / 10, Math.round((prev.y + prev.dy * t) * 10) / 10] as const;
  });
}

export const PANEL_INNER = insetPolygon(PANEL_OUTLINE, PANEL_INSET);
