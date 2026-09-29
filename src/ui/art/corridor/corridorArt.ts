import corridorSafeArt from "@/assets/explore-corridor/废弃楼层/可交互物体/保险箱.webp";
import corridorMerchantArt from "@/assets/explore-corridor/废弃楼层/可交互物体/货商.webp";
import corridorVendingArt from "@/assets/explore-corridor/废弃楼层/可交互物体/贩卖机.webp";
import corridorRemainsArt from "@/assets/explore-corridor/废弃楼层/可交互物体/遗骸.webp";
import corridorCompactorArt from "@/assets/explore-corridor/废弃楼层/可交互物体/压缩舱.webp";
import corridorMedicalArt from "@/assets/explore-corridor/废弃楼层/可交互物体/医疗柜.webp";
import corridorSinkArt from "@/assets/explore-corridor/废弃楼层/可交互物体/净水槽.webp";
import corridorRepairPodArt from "@/assets/explore-corridor/废弃楼层/可交互物体/修复舱.webp";
import corridorModBenchArt from "@/assets/explore-corridor/废弃楼层/可交互物体/改装台.webp";
import corridorCardPrinterArt from "@/assets/explore-corridor/废弃楼层/可交互物体/打印终端.webp";
import corridorShrineArt from "@/assets/explore-corridor/废弃楼层/可交互物体/神龛.webp";
import corridorDispatchArt from "@/assets/explore-corridor/废弃楼层/可交互物体/传送带.webp";
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

export const CORRIDOR_PROP_SCALES = {
  small: 0.7,
  medium: 1,
  large: 1.2,
} as const;

export const CORRIDOR_PROP_BASE_SCALE = 0.5;

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
 * 交互物原图按 0.35 作为设计画布基准，再叠加小/中/大三档尺寸。
 * 512px 方图的中档绘制边长约为 179px，宽幅素材仍按原始比例绘制。
 * 房间传送门与首领红门由着色器绘制(ui/art/portal)，不在此登记。
 */
export const CORRIDOR_PROP_ART: Record<CurioKind, CorridorPropArt> = {
  ...ECO_ARK_PROP_ART,
  equipmentCache: { src: corridorSafeArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.small, groundTrim: 0 / 400 },
  fieldTraining: { src: corridorCardPrinterArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.medium, groundTrim: 14 / 400 },
  cardExchange: { src: corridorCardPrinterArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.medium, groundTrim: 14 / 400 },
  cardArchive: { src: corridorCardPrinterArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.medium, groundTrim: 14 / 400 },
  bondWorkbench: { src: corridorModBenchArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.large, groundTrim: 18 / 400 },
  perfectnessWorkbench: { src: corridorModBenchArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.large, groundTrim: 18 / 400 },
  temporaryRelicCache: { src: corridorShrineArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.large, groundTrim: 46 / 512 },
  relicCache: { src: corridorShrineArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.large, groundTrim: 46 / 512 },
  safe: { src: corridorSafeArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.small, groundTrim: 0 / 400 },
  crystalVein: { src: corridorCrystalVeinArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.large, groundTrim: 18 / 400 },
  vending: { src: corridorVendingArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.medium, groundTrim: 7 / 400 },
  remains: { src: corridorRemainsArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.small, groundTrim: 19 / 400 },
  compactor: { src: corridorCompactorArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.large, groundTrim: 25 / 400 },
  medical: { src: corridorMedicalArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.medium, groundTrim: 14 / 400 },
  sink: { src: corridorSinkArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.large, groundTrim: 18 / 400 },
  repairPod: { src: corridorRepairPodArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.large, groundTrim: 58 / 400 },
  // 粒子净化站暂无专属素材，复用修复舱图片。
  energyStation: { src: corridorRepairPodArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.large, groundTrim: 58 / 400 },
  modBench: { src: corridorModBenchArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.large, groundTrim: 18 / 400 },
  cardPrinter: { src: corridorCardPrinterArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.medium, groundTrim: 14 / 400 },
  shrine: { src: corridorShrineArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.large, groundTrim: 46 / 512 },
  dispatch: { src: corridorDispatchArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.medium, groundTrim: 27 / 400 },
  merchant: { src: corridorMerchantArt, width: 724, height: 543, scale: CORRIDOR_PROP_SCALES.medium, groundTrim: 5 / 543 },
  tutorialArmory: { src: corridorSafeArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.small, groundTrim: 0 / 400 },
  tutorialModBench: { src: corridorModBenchArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.large, groundTrim: 18 / 400 },
  tutorialForge: { src: corridorCardPrinterArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.medium, groundTrim: 14 / 400 },
  tutorialMedical: { src: corridorMedicalArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.medium, groundTrim: 14 / 400 },
  // 以下物件暂无专属素材，复用已有交互物图片。
  tutorialRelicCache: { src: corridorShrineArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.large, groundTrim: 46 / 512 },
  supplyCrate: { src: corridorSafeArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.small, groundTrim: 0 / 400 },
  toolLocker: { src: corridorModBenchArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.large, groundTrim: 18 / 400 },
  courierDrone: { src: corridorDispatchArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.medium, groundTrim: 27 / 400 },
  cashBox: { src: corridorRemainsArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.small, groundTrim: 19 / 400 },
  moduleCase: { src: corridorCardPrinterArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.medium, groundTrim: 14 / 400 },
  collapsedCeiling: { src: corridorCompactorArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.large, groundTrim: 25 / 400 },
  leakingPipe: { src: corridorSinkArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.large, groundTrim: 18 / 400 },
  rogueDrone: { src: corridorVendingArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.medium, groundTrim: 7 / 400 },
};

/** 各交互物独立的场景 Y 轴微调值（设计 px，正值向下）。 */
export const CORRIDOR_PROP_Y_OFFSETS: Record<CurioKind, number> = {
  arkSeedVault: 0,
  arkDewCollector: 0,
  arkComposter: 0,
  arkGeneConsole: 0,
  arkSporeVent: 0,
  equipmentCache: 0,
  fieldTraining: 0,
  cardExchange: 0,
  cardArchive: 0,
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
  energyStation: 12,
  modBench: 0,
  cardPrinter: 0,
  shrine: 0,
  dispatch: 0,
  merchant: 0,
  tutorialArmory: 0,
  tutorialModBench: 0,
  tutorialForge: 0,
  tutorialMedical: 0,
  tutorialRelicCache: 0,
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
