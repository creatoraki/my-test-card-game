import corridorVendingArt from "@/assets/explore-corridor/废弃楼层/可交互物体/贩卖机.webp";
import corridorCompactorArt from "@/assets/explore-corridor/废弃楼层/可交互物体/压缩舱.webp";
import corridorSinkArt from "@/assets/explore-corridor/废弃楼层/可交互物体/净水槽.webp";
import corridorDispatchArt from "@/assets/explore-corridor/公共交互物/羽翼信使.webp";
import corridorFarArt from "@/assets/explore-corridor/废弃楼层/无限远景.webp";
import neonCityNear1Art from "@/assets/explore-corridor/废弃楼层/近景/近景1.webp";
import neonCityNear2Art from "@/assets/explore-corridor/废弃楼层/近景/近景2.webp";
import neonCityNear3Art from "@/assets/explore-corridor/废弃楼层/近景/近景3.webp";
import type { NearMapVariant } from "@/explore/dungeon/types";
import type { CurioKind } from "@/explore/corridor/types";
import { ECO_ARK_SCENERY, ECO_ARK_SCENERY_SOURCES } from "../ecoArk/ecoArkScenery";
import { ECO_ARK_NEAR_ART } from "../ecoArk/ecoArkNearArt";
import { ECO_ARK_PROP_ART } from "../ecoArk/ecoArkPropArt";
import { COMMON_PROP_ART } from "./commonPropArt";
import { sizeCorridorProp } from "./corridorPropSizing";

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
 * 边界为素材不透明区域的上下像素，换图后需重新测量。
 * 通用事件池素材登记在 commonPropArt.ts；这里只保留羽翼信使与废弃楼层专属陷阱。
 * 房间传送门与首领红门由着色器绘制(ui/art/portal)，不在此登记。
 */
const DISPATCH = sizeCorridorProp(corridorDispatchArt, { width: 400, height: 400, top: 4, bottom: 368 }, "medium");
const SINK = sizeCorridorProp(corridorSinkArt, { width: 400, height: 400, top: 101, bottom: 326 }, "small");
const COMPACTOR = sizeCorridorProp(corridorCompactorArt, { width: 400, height: 400, top: 29, bottom: 374 }, "large");
const VENDING = sizeCorridorProp(corridorVendingArt, { width: 400, height: 400, top: 4, bottom: 386 }, "medium");

export const CORRIDOR_PROP_ART: Record<CurioKind, CorridorPropArt> = {
  ...ECO_ARK_PROP_ART,
  ...COMMON_PROP_ART,
  dispatch: DISPATCH,
  // 陷阱仍用废弃楼层的科技风素材。
  collapsedCeiling: COMPACTOR,
  leakingPipe: SINK,
  rogueDrone: VENDING,
};

/** 各交互物独立的场景 Y 轴微调值（设计 px，正值向下）。 */
export const CORRIDOR_PROP_Y_OFFSETS: Record<CurioKind, number> = {
  arkSeedVault: 0,
  arkDewCollector: 0,
  arkComposter: 0,
  arkGeneConsole: 0,
  arkSporeVent: 0,
  equipmentCache: 0,
  bondWorkbench: 0,
  perfectnessWorkbench: 0,
  temporaryRelicCache: 0,
  relicCache: 0,
  safe: 0,
  crystalVein: 0,
  vending: 0,
  remains: 0,
  compactor: 0,
  medical: 0,
  sink: 0,
  repairPod: 0,
  energyStation: 0,
  modBench: 0,
  shrine: 0,
  dispatch: 0,
  merchant: 0,
  blacksmith: 0,
  tutorialArmory: 0,
  tutorialModBench: 0,
  tutorialMedical: 0,
  tutorialRelicCache: 0,
  tutorialCashBox: 0,
  supplyCrate: 0,
  toolLocker: 0,
  courierDrone: 0,
  cashBox: 0,
  moduleCase: 0,
  collapsedCeiling: 0,
  leakingPipe: 0,
  rogueDrone: 0,
};

export const CORRIDOR_ART_SOURCES: readonly string[] = [
  ...ECO_ARK_SCENERY_SOURCES,
  corridorFarArt,
  ...Object.values(CORRIDOR_NEAR_ART),
  ...new Set(Object.values(CORRIDOR_PROP_ART).map((art) => art.src)),
];
