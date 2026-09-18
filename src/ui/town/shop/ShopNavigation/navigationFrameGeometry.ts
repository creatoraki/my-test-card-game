// 导航牌几何（按 1920 设计像素实测）：
// 每个导航项占一个固定槽位；选中态是槽位上部 (h - NAV_SLOT_INSET) 高的切角玻璃卡，
// 未选中态没有底板，只有槽位顶部下移 NAV_SLOT_INSET 的分隔线 + 左右竖线，末行再补底线与右下切角。
import { chamferPath, type Chamfer } from "@/ui/common/NeonPlate/plateGeometry";

/** 未选中行分隔线相对槽位顶部的下移量；选中卡同样短出这段，形成卡与下一行的空隙。 */
export const NAV_SLOT_INSET = 6;
/** 选中态左侧亮条宽度。 */
export const NAV_BAR = 6.5;
/** 未选中行左竖线 x（与侧栏主竖线重合）。 */
export const NAV_LINE_X = 4;
export const NAV_CARD_CHAMFER: Chamfer = { tl: 0, tr: 16, br: 13, bl: 0 };
/** 末行（整组）右下切角。 */
export const NAV_LAST_CHAMFER = 15;

export type NavTone = "accent" | "hot" | "flare" | "white";

export interface NavStroke {
  d: string;
  tone: NavTone;
  opacity: number;
  width: number;
}

export interface NavCardPaths {
  /** 选中卡高度。 */
  height: number;
  outline: string;
  sheen: string;
  strokes: NavStroke[];
  /** 右下热光 L 形（右边下段 + 切角 + 底边末段），用于叠模糊辉光。 */
  hot: string;
  /** 右下切角本身（近白热核）。 */
  flare: string;
}

export interface NavIdlePaths {
  strokes: NavStroke[];
  /** 左竖线的起止 y。 */
  lineTop: number;
  lineBottom: number;
  /** 末行右下切角（主色细线 + 小辉光）；非末行为空。 */
  chamfer?: string;
}

const r = (value: number) => Math.round(value * 100) / 100;
const s = (d: string, tone: NavTone, opacity: number, width = 1.5): NavStroke => ({ d, tone, opacity, width });

export function navigationCardPaths(w: number, slotHeight: number): NavCardPaths {
  const h = slotHeight - NAV_SLOT_INSET;
  const { tr, br } = NAV_CARD_CHAMFER;
  const e = 0.75;
  const y = (design: number) => r((design / 99) * h);
  const bottom = r(h - 0.9);
  const hotTop = y(64);
  return {
    height: h,
    outline: chamferPath(w, h, NAV_CARD_CHAMFER),
    sheen: `M${r(w * 0.12)} 0H${r(w * 0.2)}L${r(w * 0.07)} ${h}H${NAV_BAR}V${r(h * 0.55)}Z`,
    strokes: [
      // 上边：左端亮段，向右迅速衰减为暗线，一路接右上切角和右边上段。
      s(`M${NAV_BAR} ${e}H25`, "accent", 0.9),
      s(`M25 ${e}H42`, "accent", 0.32),
      s(`M42 ${e}H60`, "accent", 0.2),
      s(`M60 ${e}H${w - tr}L${w - e} ${tr}V${y(40)}`, "accent", 0.15),
      // 右边：亮红短刻度 → 中亮段 → 热粉段（热粉段并入 hot）。
      s(`M${w - e} ${y(40)}V${y(50)}`, "accent", 0.85),
      s(`M${w - e} ${y(50)}V${hotTop}`, "accent", 0.38),
      // 下边：左端亮段 → 主体 → 末端暗缺口 → 热粉段接切角。
      s(`M${NAV_BAR} ${bottom}H25`, "accent", 0.85, 1.8),
      s(`M25 ${bottom}H${w - 36}`, "accent", 0.62, 1.8),
      s(`M${w - 36} ${bottom}H${w - 23}`, "accent", 0.45, 1.8),
      s(`M${w - e} ${hotTop}V${h - br}`, "hot", 0.9),
      s(`M${w - 23} ${bottom}H${w - br}`, "hot", 0.85, 1.8),
    ],
    hot: `M${w - e} ${hotTop}V${h - br}L${w - br} ${bottom}H${w - 23}`,
    flare: `M${w - e} ${h - br}L${w - br} ${bottom}`,
  };
}

export function navigationIdlePaths(w: number, h: number, last: boolean): NavIdlePaths {
  const top = NAV_SLOT_INSET + 0.5;
  const c = NAV_LAST_CHAMFER;
  const x0 = NAV_LINE_X;
  const strokes: NavStroke[] = [
    // 分隔线：主体极淡，右端一截提亮，末端短刻度最亮，与右竖线之间留空。
    s(`M${x0} ${top}H${w - 45}`, "white", 0.07, 1),
    s(`M${w - 45} ${top}H${w - 31}`, "white", 0.11, 1),
    s(`M${w - 31} ${top}H${w - 20}`, "white", 0.07, 1),
    s(`M${w - 20} ${top}H${w - 17}`, "white", 0.2, 1),
    s(`M${w - 0.75} ${top}V${last ? h - c : h}`, "white", 0.09),
  ];
  if (last) strokes.push(s(`M${x0} ${h - 0.5}H${w - c}`, "white", 0.07, 1));
  return {
    strokes,
    lineTop: NAV_SLOT_INSET,
    lineBottom: h,
    chamfer: last ? `M${w - 0.75} ${h - c}L${w - c} ${h - 0.5}` : undefined,
  };
}
