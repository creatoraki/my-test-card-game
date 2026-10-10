import { CORRIDOR_PROP_BASE_SCALE, type CorridorPropArt } from "@/ui/art/corridor/corridorArt";
import { CURIO_VISUAL_PAGES } from "./curioVisualPages";
import type { ShowcasePageDef } from "./showcaseTypes";

export type { ShowcasePageDef, ShowcasePropDef } from "./showcaseTypes";

/** 只展示还没调好游戏内倍率的通用素材。 */
export const SHOWCASE_PAGES: readonly ShowcasePageDef[] = CURIO_VISUAL_PAGES;

export const SHOWCASE_PROPS = SHOWCASE_PAGES.flatMap((page) => page.props);

/** 旋钮倍率范围：以 1 倍为中点的对数刻度。 */
export const SCALE_MIN = 1 / 3;
export const SCALE_MAX = 3;
/** 倍率精度与 ± 按钮步长。 */
export const SCALE_PRECISION = 0.001;
export const SCALE_NUDGE = 0.01;

export function clampScale(value: number) {
  return Math.max(SCALE_MIN, Math.min(SCALE_MAX, Math.round(value / SCALE_PRECISION) * SCALE_PRECISION));
}

/** 叠乘旋钮倍率后的最终显示尺寸（设计 px）。 */
export function showcaseSize(art: CorridorPropArt, multiplier: number) {
  const ratio = CORRIDOR_PROP_BASE_SCALE * art.scale * multiplier;
  return { width: art.width * ratio, height: art.height * ratio };
}
