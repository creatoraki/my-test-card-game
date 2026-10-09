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
 * 面板底的填充轮廓(最外圈, 顺时针): 左上暗页签 → 页签末端两级下沉 → 中段 → 右段回升 → 右上大切角
 * → 右侧主体 → 两级外扩到按钮区 → 右下两级内收 → 底边台阶 → 左下大切角 → 左缘两级内收 → 回到页签。
 * 2026-10-09 第五轮按设计稿逐线量取(峰值检测 + 8 倍放大): 左缘主亮线在 x=13, 页签暗线外凸到 x=-1。
 */
export const PANEL_FILL: readonly Point[] = [
  [-1, 42], [40, 1], [420, 1], [449, 32], [499, 32], [524, 47],
  [1004, 47], [1026, 24], [1307, 24], [1364, 80], [1364, 477], [1373, 477],
  [1401, 504], [1401, 631], [1420, 649], [1420, 820], [1399, 842], [1399, 877], [1357, 919],
  [737, 919], [723, 905], [61, 905], [1, 845], [1, 778], [8, 771], [8, 696], [13, 691],
  [13, 115], [-1, 101],
];

/**
 * 外框描边(折线, 按设计稿分亮度):
 * main = 近白淡紫主线(上亮下淡紫, 渐变在 PickFrame 里); dim = 左上页签与内线的暗灰紫细线;
 * soft = 介于两者之间的内侧辅线。
 */
export const PANEL_STROKES: readonly { tone: "main" | "dim" | "soft"; points: readonly Point[] }[] = [
  // 主线: 中段顶边 → 右段回升 → 右上大切角 → 右缘, 在按钮区上方折进内侧继续下行
  { tone: "main", points: [[459, 47], [1004, 47], [1026, 24], [1307, 24], [1364, 80], [1364, 477], [1372, 485]] },
  // 主线: 按钮区外扩 → 右下两级内收 → 底边台阶 → 左下大切角 → 左缘两级内收 → 左上切角(冰蓝厚条压在上面)
  {
    tone: "main",
    points: [
      [1373, 477], [1401, 504], [1401, 631], [1420, 649], [1420, 820], [1399, 842], [1399, 877], [1357, 919],
      [737, 919], [723, 905], [61, 905], [1, 845], [1, 778], [8, 771], [8, 696], [13, 691], [13, 50], [47, 16],
    ],
  },
  // 左上外凸暗页签: 左缘主线外侧一级 → 大切角 → 顶边 → 页签末端两级下沉, 汇入中段主线
  { tone: "dim", points: [[13, 115], [-1, 101], [-1, 42], [40, 1], [420, 1], [449, 32], [499, 32], [524, 47]] },
  // 页签内线: 左上切角末端 → 顶边 → 斜下汇入中段主线
  { tone: "dim", points: [[47, 15], [431, 15], [459, 47]] },
  // 右上内线: 与右段顶边、右上切角平行
  { tone: "dim", points: [[1033, 38], [1296, 38], [1362, 104]] },
  // 右缘内线: 按钮区外扩后仍沿原右缘下行, 再斜向外汇入(斜段是冰蓝厚条)
  { tone: "soft", points: [[1372, 485], [1372, 602]] },
  // 左下内线: 沿左缘内侧斜下 → 底边内侧一段亮短线
  { tone: "soft", points: [[14, 826], [82, 894], [183, 894]] },
  // 左下外凸内线: 左缘外凸段的内侧竖线
  { tone: "dim", points: [[8, 778], [8, 840]] },
];

/**
 * 外框上的发光厚条(压在描边上)。cyan = 钴蓝, ice = 浅冰蓝, white = 近白亮条。
 */
export const PANEL_ACCENTS: readonly { tone: "cyan" | "ice" | "white"; width: number; points: readonly Point[] }[] = [
  // 左上切角: 主线左缘 → 页签内线
  { tone: "cyan", width: 4, points: [[16, 48], [47, 17]] },
  // 左下: 左缘外凸内侧竖线末端斜下
  { tone: "cyan", width: 4, points: [[9, 840], [50, 881]] },
  // 右下内收切角
  { tone: "cyan", width: 4, points: [[1399, 877], [1357, 919]] },
  // 右缘内线斜向外汇入按钮区外缘
  { tone: "ice", width: 3, points: [[1372, 602], [1420, 650]] },
  // 按钮区上方外扩斜边: 近白亮线
  { tone: "white", width: 2.5, points: [[1373, 477], [1401, 504]] },
  // 按钮区外缘近白竖条(贴外线外侧)
  { tone: "white", width: 3, points: [[1422, 702], [1422, 817]] },
  // 底边左段亮短线
  { tone: "white", width: 2, points: [[82, 894], [183, 894]] },
];

// ── 候选卡 ──
// 卡外缘: 左卡 x 383–737、y 316–799(354×483), 列距 44; 配图/说明分界线在 y=656(说明区 143)。
export const CARD_W = 354;
export const CARD_TEXT_H = 143;
export const CARD_H = 483;
export const CARD_GAP = 44;
/** 归属行高 + 与卡面的间距。 */
export const OWNER_ROW_H = 32;
export const OWNER_GAP = 16;
/** 候选网格左上角(含归属行)。 */
export const GRID_LEFT = 119;
export const GRID_TOP = 200;
export const CARD_TOP = GRID_TOP + OWNER_ROW_H + OWNER_GAP;
export const CARD_BOTTOM = CARD_TOP + CARD_H;
/** 配图与说明区分界线(卡内 y)。 */
export const CARD_SPLIT = CARD_H - CARD_TEXT_H;

export const columnCenter = (index: number) => GRID_LEFT + index * (CARD_W + CARD_GAP) + CARD_W / 2;

/**
 * 卡框四角斜切(左上 / 右上 / 右下 / 左下)。三选一里 HandCard 的 clip-path 也改成同一形状,
 * 卡面边角不会从钢框外露出来。
 */
export const CARD_CORNERS = { tl: 12, tr: 12, br: 16, bl: 8 } as const;
/** 选中霓虹带压在钢框外缘上(不外扩); 顶边比卡缘高出 2.5px(设计稿量取)。 */
export const SELECT_TOP_LIFT = 2.5;

// ── 选中连接线: 选中卡底部小三角 → 下折 → 左行到底栏提示区左端 ──
export const CONNECTOR_START_Y = CARD_BOTTOM + 21;
export const CONNECTOR_BEND_Y = 789;
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

