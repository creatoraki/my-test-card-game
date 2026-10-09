// 华丽费用宝石(卡牌三选一)的配色, 全部取自设计稿 三选一卡牌_方案一_全息锻造台.png 缩放到 1920×1080 后的实测像素。
// 渐变 offset 以宝石上顶点为 0、下顶点为 1(纵向)。

export interface GemStop {
  readonly at: number;
  readonly color: string;
}

export interface OrnateGemPalette {
  /** 本体纵向渐变: 上暗下亮。 */
  readonly body: readonly GemStop[];
  /** 亮边纵向渐变。 */
  readonly rim: readonly GemStop[];
  /** 贴着亮边内侧的一圈受光。 */
  readonly inner: string;
  readonly innerOpacity: number;
  /** 宝石外一圈柔光。 */
  readonly glow: string;
  readonly glowOpacity: number;
  /** 右上边亮边压暗(背光面); 缺省则四边同亮。 */
  readonly shadeEdge?: string;
  /** 亮边外侧一圈深色描影(把宝石从亮底上勾出来), 宽度与浓度两色共用 EDGE_SHADOW, 只换色调。 */
  readonly edgeShadow: { readonly color: string; readonly width: number; readonly opacity: number };
}

/** 外侧描影: 外露 3px, 浓度 0.6(0.85 太黑)。 */
const EDGE_SHADOW = { width: 3, opacity: 0.6 } as const;

/** 常规法力: 深蓝顶 → 青蓝底, 亮边青白、右上边背光。 */
const MANA: OrnateGemPalette = {
  body: [
    { at: 0, color: "#0a72d6" },
    { at: 0.08, color: "#0258b0" },
    { at: 0.15, color: "#004e94" },
    { at: 0.25, color: "#025092" },
    { at: 0.33, color: "#03619f" },
    { at: 0.4, color: "#0177c2" },
    { at: 0.46, color: "#0088dc" },
    { at: 0.5, color: "#029ff0" },
    { at: 0.56, color: "#019deb" },
    { at: 0.62, color: "#01a6f2" },
    { at: 0.68, color: "#04b4f8" },
    { at: 0.74, color: "#0cc2fc" },
    { at: 0.8, color: "#0accfe" },
    { at: 0.86, color: "#04d2fd" },
    { at: 0.92, color: "#06dcfc" },
    { at: 1, color: "#12e4f8" },
  ],
  rim: [
    { at: 0, color: "#86e6f2" },
    { at: 0.22, color: "#5ae8fd" },
    { at: 0.5, color: "#b8fcff" },
    { at: 0.78, color: "#a4f8ff" },
    { at: 1, color: "#e2faf4" },
  ],
  inner: "#22b6ff",
  innerOpacity: 0.55,
  glow: "#3cb0e8",
  glowOpacity: 0.8,
  shadeEdge: "#1696dc",
  edgeShadow: { color: "#031a3a", ...EDGE_SHADOW },
};

/** 速攻: 橙红顶 → 暗金腰 → 青柠底, 亮边橙黄转柠黄。 */
const HASTE: OrnateGemPalette = {
  body: [
    { at: 0, color: "#e05a22" },
    { at: 0.08, color: "#cf4a1d" },
    { at: 0.16, color: "#bc401b" },
    { at: 0.26, color: "#b44a18" },
    { at: 0.34, color: "#b0521a" },
    { at: 0.4, color: "#ad6322" },
    { at: 0.45, color: "#ab7326" },
    { at: 0.5, color: "#a7852c" },
    { at: 0.55, color: "#a39434" },
    { at: 0.6, color: "#9ba038" },
    { at: 0.67, color: "#93ac3e" },
    { at: 0.75, color: "#8cbc48" },
    { at: 0.8, color: "#84c650" },
    { at: 0.86, color: "#8ed65c" },
    { at: 0.92, color: "#a4e46e" },
    { at: 1, color: "#c8ec90" },
  ],
  rim: [
    { at: 0, color: "#f4b05a" },
    { at: 0.22, color: "#f89c3c" },
    { at: 0.5, color: "#f0c846" },
    { at: 0.76, color: "#eeee66" },
    { at: 1, color: "#f2dc7c" },
  ],
  inner: "#ffc548",
  innerOpacity: 0.4,
  glow: "#f0a040",
  glowOpacity: 0.25,
  edgeShadow: { color: "#3a1704", ...EDGE_SHADOW },
};

export const ORNATE_GEM_PALETTE = { mana: MANA, haste: HASTE } as const;
