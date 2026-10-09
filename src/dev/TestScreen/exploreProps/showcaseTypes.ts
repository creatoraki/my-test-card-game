import type { CorridorPropArt } from "@/ui/art/corridor/corridorArt";

export interface ShowcasePropDef {
  id: string;
  name: string;
  /** 素材的基础展示缩放，旋钮倍率在此基础上叠乘。 */
  art: CorridorPropArt;
  /** 世界坐标 x（设计 px）。 */
  x: number;
}

export interface ShowcasePageDef {
  id: string;
  series: string;
  name: string;
  props: readonly ShowcasePropDef[];
}
