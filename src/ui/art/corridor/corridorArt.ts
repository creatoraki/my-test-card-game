import blacksmithArt from "@/assets/explore-corridor/公共NPC/锻造师.webp";
import corridorSafeArt from "@/assets/explore-corridor/废弃楼层/可交互物体/保险箱.webp";
import corridorMerchantArt from "@/assets/explore-corridor/废弃楼层/可交互物体/货商.webp";
import corridorVendingArt from "@/assets/explore-corridor/废弃楼层/可交互物体/贩卖机.webp";
import corridorRemainsArt from "@/assets/explore-corridor/废弃楼层/可交互物体/遗骸.webp";
import corridorCompactorArt from "@/assets/explore-corridor/废弃楼层/可交互物体/压缩舱.webp";
import corridorMedicalArt from "@/assets/explore-corridor/废弃楼层/可交互物体/医疗柜.webp";
import corridorSinkArt from "@/assets/explore-corridor/废弃楼层/可交互物体/净水槽.webp";
import corridorRepairPodArt from "@/assets/explore-corridor/废弃楼层/可交互物体/修复舱.webp";
import corridorModBenchArt from "@/assets/explore-corridor/废弃楼层/可交互物体/改装台.webp";
import corridorShrineArt from "@/assets/explore-corridor/废弃楼层/可交互物体/神龛.webp";
import corridorDispatchArt from "@/assets/explore-corridor/公共交互物/羽翼信使.webp";
import corridorCrystalVeinArt from "@/assets/explore-corridor/废弃楼层/可交互物体/矿脉.webp";
import corridorFarArt from "@/assets/explore-corridor/废弃楼层/无限远景.webp";
import neonCityNear1Art from "@/assets/explore-corridor/废弃楼层/近景/近景1.webp";
import neonCityNear2Art from "@/assets/explore-corridor/废弃楼层/近景/近景2.webp";
import neonCityNear3Art from "@/assets/explore-corridor/废弃楼层/近景/近景3.webp";
import type { NearMapVariant } from "@/explore/dungeon/types";
import type { CurioKind } from "@/explore/corridor/types";
import { ECO_ARK_SCENERY, ECO_ARK_SCENERY_SOURCES } from "../ecoArk/ecoArkScenery";
import { ECO_ARK_NEAR_ART } from "../ecoArk/ecoArkNearArt";
import { ECO_ARK_PROP_ART } from "../ecoArk/ecoArkPropArt";
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

/** 废弃楼层专属背景与物件素材登记；每类交互物使用自己的透明 PNG。 */
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
 * 废弃楼层交互物按主体高度对齐角色身高分档(小 70% / 中 135% / 大 170%)。
 * 边界为素材不透明区域的上下像素，换图后需重新测量。
 * 房间传送门与首领红门由着色器绘制(ui/art/portal)，不在此登记。
 */
const SAFE = sizeCorridorProp(corridorSafeArt, { width: 400, height: 400, top: 26, bottom: 381 }, "medium");
const REMAINS = sizeCorridorProp(corridorRemainsArt, { width: 400, height: 400, top: 11, bottom: 380 }, "medium");
const MEDICAL = sizeCorridorProp(corridorMedicalArt, { width: 400, height: 400, top: 19, bottom: 384 }, "medium");
const VENDING = sizeCorridorProp(corridorVendingArt, { width: 400, height: 400, top: 4, bottom: 386 }, "medium");
const MOD_BENCH = sizeCorridorProp(corridorModBenchArt, { width: 400, height: 400, top: 25, bottom: 380 }, "medium");
const MERCHANT = sizeCorridorProp(corridorMerchantArt, { width: 362, height: 272, top: 3, bottom: 266 }, "medium");
const SHRINE = sizeCorridorProp(corridorShrineArt, { width: 308, height: 308, top: 13, bottom: 280 }, "medium");
const DISPATCH = sizeCorridorProp(corridorDispatchArt, { width: 400, height: 400, top: 4, bottom: 368 }, "medium");
const SINK = sizeCorridorProp(corridorSinkArt, { width: 400, height: 400, top: 101, bottom: 326 }, "small");
const REPAIR_POD = sizeCorridorProp(corridorRepairPodArt, { width: 400, height: 400, top: 81, bottom: 304 }, "small");
const COMPACTOR = sizeCorridorProp(corridorCompactorArt, { width: 400, height: 400, top: 29, bottom: 374 }, "large");
const CRYSTAL_VEIN = sizeCorridorProp(corridorCrystalVeinArt, { width: 400, height: 400, top: 24, bottom: 379 }, "large");

export const CORRIDOR_PROP_ART: Record<CurioKind, CorridorPropArt> = {
  ...ECO_ARK_PROP_ART,
  equipmentCache: SAFE,
  bondWorkbench: MOD_BENCH,
  perfectnessWorkbench: MOD_BENCH,
  temporaryRelicCache: SHRINE,
  relicCache: SHRINE,
  safe: SAFE,
  crystalVein: CRYSTAL_VEIN,
  vending: VENDING,
  remains: REMAINS,
  compactor: COMPACTOR,
  medical: MEDICAL,
  sink: SINK,
  repairPod: REPAIR_POD,
  // 粒子净化站暂无专属素材，复用修复舱图片。
  energyStation: REPAIR_POD,
  modBench: MOD_BENCH,
  shrine: SHRINE,
  dispatch: DISPATCH,
  merchant: MERCHANT,
  blacksmith: { src: blacksmithArt, width: 512, height: 768, scale: 390 / (741 * 0.5), groundTrim: 23 / 768 },
  tutorialArmory: SAFE,
  tutorialModBench: MOD_BENCH,
  tutorialMedical: MEDICAL,
  // 以下物件暂无专属素材，复用已有交互物图片。
  tutorialRelicCache: SHRINE,
  tutorialCashBox: REMAINS,
  supplyCrate: SAFE,
  toolLocker: MOD_BENCH,
  courierDrone: DISPATCH,
  cashBox: REMAINS,
  // 封存的模组箱暂无专属 2D 场景素材，复用保险箱图片(物品图标不能当场景物件)。
  moduleCase: SAFE,
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
