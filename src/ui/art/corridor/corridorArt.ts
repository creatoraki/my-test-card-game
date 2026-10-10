import corridorFarArt from "@/assets/explore-corridor/废弃楼层/无限远景.webp";
import neonCityNear1Art from "@/assets/explore-corridor/废弃楼层/近景/近景1.webp";
import neonCityNear2Art from "@/assets/explore-corridor/废弃楼层/近景/近景2.webp";
import neonCityNear3Art from "@/assets/explore-corridor/废弃楼层/近景/近景3.webp";
import type { NearMapVariant } from "@/explore/dungeon/types";
import type { CurioKind } from "@/explore/corridor/types";
import { ECO_ARK_SCENERY, ECO_ARK_SCENERY_SOURCES } from "../ecoArk/ecoArkScenery";
import { ECO_ARK_NEAR_ART } from "../ecoArk/ecoArkNearArt";
import { COMMON_PROP_ART, COMMON_PROP_Y_OFFSETS } from "./commonPropArt";

export { CORRIDOR_PROP_BASE_SCALE } from "./corridorPropSizing";

export interface CorridorPropArt {
  src: string;
  width: number;
  height: number;
  scale: number;
  /** 透明画布底部留白比例，用于让主体贴住场景地面。 */
  groundTrim: number;
}

/** 废弃楼层专属背景登记；交互物素材见下方 CORRIDOR_PROP_ART。 */
export const CORRIDOR_FAR_ART = corridorFarArt;
export const CORRIDOR_NEAR_ART: Record<NearMapVariant, string> = {
  ...ECO_ARK_NEAR_ART,
  neonCity1: neonCityNear1Art,
  neonCity2: neonCityNear2Art,
  neonCity3: neonCityNear3Art,
};

export function getCorridorFarArt(mapId: string | undefined): string {
  return mapId === "eco-ark" ? ECO_ARK_SCENERY.far : CORRIDOR_FAR_ART;
}

/**
 * 交互物按主体高度对齐角色身高分档(小 70% / 中 135% / 大 170%)。
 * 素材登记在 commonPropAssets.ts，设施到素材的分配在 commonPropArt.ts。
 * 房间传送门与首领红门由着色器绘制(ui/art/portal)，不在此登记。
 */
export const CORRIDOR_PROP_ART: Record<CurioKind, CorridorPropArt> = COMMON_PROP_ART;

/** 各交互物独立的场景 Y 轴微调值（设计 px，正值向下），由 commonPropTuning.ts 按素材登记。 */
export const CORRIDOR_PROP_Y_OFFSETS: Record<CurioKind, number> = COMMON_PROP_Y_OFFSETS;

export const CORRIDOR_ART_SOURCES: readonly string[] = [
  ...ECO_ARK_SCENERY_SOURCES,
  corridorFarArt,
  ...Object.values(CORRIDOR_NEAR_ART),
  ...new Set(Object.values(CORRIDOR_PROP_ART).map((art) => art.src)),
];
