// 卡组面板(苔绿工业温室)的全部几何常量, 单位为 1920×1080 设计画布 px。
// 由设计稿(1672×941)×1.148 换算后取整, 素材外壳按画布 1:1 贴, 各区块按这里的坐标绝对定位。
// 规格与测量表见 docs/换卡面板还原方案.md「布局测量」。

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 面板主体包围盒(素材缺失时的兜底底板也按它画)。 */
export const PANEL: Rect = { x: 118, y: 44, w: 1725, h: 995 };

/** 页眉: 小标签 / 主标题 / 说明的左上角。 */
export const HEADER = { x: 239, y: 70 };

/** 角色页签行(右端是计数)。 */
export const TABS: Rect = { x: 178, y: 232, w: 1019, h: 57 };

/** 卡组柜可视区: 卡牌在此滚动并被裁切。 */
export const DECK: Rect = { x: 166, y: 301, w: 1053, h: 617 };

/** 卡组网格: HandCard 220×308 统一缩放, 两排正好放满可视区。 */
export const GRID = {
  scale: 0.93,
  columns: 4,
  colGap: 34,
  rowGap: 18,
  /** 四周留白: 容纳悬停上浮与选中框辉光。 */
  pad: 12,
};

/** 置换舱列。 */
export const CHAMBER_COLUMN: Rect = { x: 1243, y: 144, w: 562, h: 746 };
/** 舱位标题条。 */
export const CHAMBER_HEAD: Rect = { x: 1268, y: 158, w: 512, h: 72 };
/** 培养舱素材落位(后层与前层同框)。 */
export const CHAMBER_ART: Rect = { x: 1263, y: 235, w: 528, h: 460 };
/** 舱内卡面: 220×308 放大 1.05 倍, 中心对齐舱窗。 */
export const CHAMBER_CARD_SCALE = 1.05;
export const CHAMBER_CENTER = { x: 1521, y: 465 };
/** 置换演出的 GLSL 画布(以舱窗中心为中心, 比卡面四周多留粒子与光环的空间)。 */
export const CHAMBER_FX = { w: 380, h: 480 };
/** 舱位信息表。 */
export const CHAMBER_FACTS: Rect = { x: 1274, y: 709, w: 511, h: 169 };

/** 底栏提示条。 */
export const FOOT_NOTE: Rect = { x: 178, y: 936, w: 1045, h: 77 };
/** 底栏按钮。 */
export const BUTTON_ABANDON: Rect = { x: 1263, y: 941, w: 224, h: 67 };
export const BUTTON_CONFIRM: Rect = { x: 1502, y: 932, w: 272, h: 82 };

/** HandCard 原始尺寸。 */
export const CARD_W = 220;
export const CARD_H = 308;
/** HandCard 左上 / 右下斜切量。 */
export const CARD_CHAMFER = 14;

/** 绝对定位样式。 */
export function rectStyle(rect: Rect) {
  return { left: rect.x, top: rect.y, width: rect.w, height: rect.h };
}
