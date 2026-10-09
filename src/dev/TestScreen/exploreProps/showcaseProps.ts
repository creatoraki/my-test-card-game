import { COMMON_PROP_ART } from "@/ui/art/corridor/commonPropArt";
import { CORRIDOR_PROP_BASE_SCALE, type CorridorPropArt } from "@/ui/art/corridor/corridorArt";

export interface ShowcasePropDef {
  id: string;
  name: string;
  /** 游戏内当前登记的素材与缩放，旋钮倍率在此基础上叠乘。 */
  art: CorridorPropArt;
  /** 世界坐标 x（设计 px）。 */
  x: number;
}

/** 场景里展示的新画风交互物；要多摆几件时往这里追加即可。 */
export const SHOWCASE_PROPS: readonly ShowcasePropDef[] = [
  { id: "glassFurnace", name: "琉璃炼金炉", art: COMMON_PROP_ART.compactor, x: 900 },
];

/** 旋钮倍率范围：以 1 倍为中点的对数刻度。 */
export const SCALE_MIN = 1 / 3;
export const SCALE_MAX = 3;

/** 叠乘旋钮倍率后的最终显示尺寸（设计 px）。 */
export function showcaseSize(art: CorridorPropArt, multiplier: number) {
  const ratio = CORRIDOR_PROP_BASE_SCALE * art.scale * multiplier;
  return { width: art.width * ratio, height: art.height * ratio };
}
