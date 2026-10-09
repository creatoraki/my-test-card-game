// 卡牌三选一面板的几何常量(设计 px, 1920×1080 固定画布)。
// 外框轮廓、卡框、选中框、按钮、连接线、各区块落位全部从这里取 —— 改尺寸只动这一个文件。
// 坐标原点 = 面板左上角(画布 264, 68); 全部按设计稿缩放到 1920×1080 后逐角量取。

export type Point = readonly [number, number];

/** 面板在画布上的落位(设计稿面板略偏左上, 不是严格居中)。 */
export const PANEL_X = 264;
export const PANEL_Y = 68;
export const PANEL_W = 1420;
export const PANEL_H = 919;

/**
 * 面板外轮廓(顺时针):
 * 左上页签(大切角) → 页签末端两级下沉 → 中段 → 右段回升一级 → 右上大切角 → 右侧主体
 * → 按钮区向外扩 → 右下两级内收 → 底边 → 底边在放弃按钮左侧上台阶 → 左下大切角。
 */
export const PANEL_OUTLINE: readonly Point[] = [
  [0, 38], [38, 0], [424, 0], [456, 32], [498, 32], [513, 47],
  [1008, 47], [1031, 24], [1306, 24], [1371, 89],
  [1371, 600], [1420, 649], [1420, 820], [1397, 843], [1397, 880], [1358, 919],
  [728, 919], [714, 905], [60, 905], [0, 845],
];

/** 内层暗线与面板底图的内缩量。 */
export const PANEL_INSET = 9;

/**
 * 外框上的发光厚条(折线, 画在内外两道线之间或贴外线)。
 * cyan = 冰蓝, violet = 主紫, white = 白紫亮条(右侧按钮区外缘)。
 */
export const PANEL_ACCENTS: readonly { tone: "cyan" | "violet" | "white"; width: number; points: readonly Point[] }[] = [
  // 左上大切角内侧的冰蓝厚条
  { tone: "cyan", width: 6, points: [[8, 39], [36, 11]] },
  // 左下大切角内侧的冰蓝厚条
  { tone: "cyan", width: 6, points: [[13, 845], [51, 883]] },
  // 右下内收切角上的冰蓝厚条
  { tone: "cyan", width: 5, points: [[1393, 884], [1364, 913]] },
  // 右上切角一段紫色亮边
  { tone: "violet", width: 3, points: [[1236, 24], [1306, 24], [1371, 89], [1371, 170]] },
  // 右侧按钮区外缘的白紫竖条(贴外线外侧 3px)
  { tone: "white", width: 4, points: [[1423, 702], [1423, 818]] },
  // 底边左段一道短亮线(压在内线上)
  { tone: "white", width: 2, points: [[78, 896], [180, 896]] },
];

// ── 候选卡 ──
export const CARD_W = 350;
export const CARD_TEXT_H = 132;
export const CARD_H = CARD_W + CARD_TEXT_H;
export const CARD_GAP = 46;
/** 归属行高 + 与卡面的间距。 */
export const OWNER_ROW_H = 32;
export const OWNER_GAP = 16;
/** 候选网格左上角(含归属行)。 */
export const GRID_LEFT = 121;
export const GRID_TOP = 220;
export const CARD_TOP = GRID_TOP + OWNER_ROW_H + OWNER_GAP;
export const CARD_BOTTOM = CARD_TOP + CARD_H;

export const columnCenter = (index: number) => GRID_LEFT + index * (CARD_W + CARD_GAP) + CARD_W / 2;

/**
 * 卡框四角斜切(左上 / 右上 / 右下 / 左下)。三选一里 HandCard 的 clip-path 也改成同一形状,
 * 卡面边角不会从钢框外露出来。
 */
export const CARD_CORNERS = { tl: 16, tr: 8, br: 22, bl: 8 } as const;
/** 银色钢框厚度。 */
export const CARD_RIM = 7;

/** 选中霓虹框相对卡面的外扩量: 设计稿里霓虹框直接压在卡的钢框外缘上。 */
export const SELECT_OUTSET = 5;

// ── 选中连接线: 选中卡底部小三角 → 下折 → 左行到底栏提示区左端 ──
export const CONNECTOR_START_Y = CARD_BOTTOM + SELECT_OUTSET + 16;
export const CONNECTOR_BEND_Y = 809;
export const CONNECTOR_END_X = 70;

export const connectorPoints = (index: number): readonly Point[] => {
  const x = columnCenter(index);
  return [[x, CONNECTOR_START_Y], [x, CONNECTOR_BEND_Y], [CONNECTOR_END_X, CONNECTOR_BEND_Y]];
};

// ── 底栏 ──
export interface Rect { x: number; y: number; w: number; h: number }

/** 提示行: 图标中心 (109, 852)。 */
export const FOOTER_HINT: Rect = { x: 94, y: 834, w: 560, h: 36 };
export const SKIP_BUTTON: Rect = { x: 755, y: 810, w: 276, h: 82 };
export const CONFIRM_BUTTON: Rect = { x: 1059, y: 806, w: 316, h: 83 };

/** 任意四角斜切的矩形(顺时针); inset 为整体内缩(负数即外扩)。 */
export function cornerBox(
  w: number,
  h: number,
  c: { tl: number; tr: number; br: number; bl: number },
  inset = 0,
): Point[] {
  // 45° 切角内缩 d 时, 切口沿边方向的长度要减去 d·(√2 − 1), 才能保持与外框等距。
  const k = inset * (Math.SQRT2 - 1);
  const t = (v: number) => Math.max(0, v - k);
  const l = inset;
  const r = w - inset;
  const top = inset;
  const b = h - inset;
  return [
    [l + t(c.tl), top], [r - t(c.tr), top], [r, top + t(c.tr)], [r, b - t(c.br)],
    [r - t(c.br), b], [l + t(c.bl), b], [l, b - t(c.bl)], [l, top + t(c.tl)],
  ];
}

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
