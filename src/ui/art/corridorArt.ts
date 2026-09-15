import bluePortalArt from "@/assets/explore-corridor/废弃楼层/蓝色传送门.png";
import corridorSafeArt from "@/assets/explore-corridor/废弃楼层/可交互物体/保险箱.png";
import corridorMerchantArt from "@/assets/explore-corridor/废弃楼层/可交互物体/货商.png";
import corridorVendingArt from "@/assets/explore-corridor/废弃楼层/可交互物体/贩卖机.png";
import corridorRemainsArt from "@/assets/explore-corridor/废弃楼层/可交互物体/遗骸.png";
import corridorCompactorArt from "@/assets/explore-corridor/废弃楼层/可交互物体/压缩舱.png";
import corridorMedicalArt from "@/assets/explore-corridor/废弃楼层/可交互物体/医疗柜.png";
import corridorSinkArt from "@/assets/explore-corridor/废弃楼层/可交互物体/净水槽.png";
import corridorRepairPodArt from "@/assets/explore-corridor/废弃楼层/可交互物体/修复舱.png";
import corridorModBenchArt from "@/assets/explore-corridor/废弃楼层/可交互物体/改装台.png";
import corridorCardPrinterArt from "@/assets/explore-corridor/废弃楼层/可交互物体/打印终端.png";
import corridorShrineArt from "@/assets/explore-corridor/废弃楼层/可交互物体/神龛.png";
import corridorDispatchArt from "@/assets/explore-corridor/废弃楼层/可交互物体/传送带.png";
import corridorCrystalVeinArt from "@/assets/explore-corridor/废弃楼层/可交互物体/矿脉.png";
import corridorFarArt from "@/assets/explore-corridor/废弃楼层/无限远景.png";
import corridorNearStandardArt from "@/assets/explore-corridor/废弃楼层/近景/测试.png";
import corridorNearAlternateArt from "@/assets/explore-corridor/废弃楼层/近景/测试2.png";
import corridorNearThirdArt from "@/assets/explore-corridor/废弃楼层/近景/测试3.png";
import type { NearMapVariant } from "@/explore/dungeon/types";
import type { CurioKind } from "@/explore/corridor/types";

export const CORRIDOR_PROP_SCALES = {
  small: 0.5,
  medium: 1,
  large: 1.2,
} as const;

export const CORRIDOR_PROP_BASE_SCALE = 0.5;

interface CorridorPropArt {
  src: string;
  width: number;
  height: number;
  scale: number;
  /** 透明画布底部留白比例，用于让主体贴住场景地面。 */
  groundTrim: number;
}

/** 废弃楼层专属背景与物件素材登记；每类交互物使用自己的透明 PNG。 */
export const CORRIDOR_FAR_ART = corridorFarArt;
/** 房间传送门：四个方向共用蓝色传送门立绘。 */
export const CORRIDOR_PORTAL_ART = bluePortalArt;
export const CORRIDOR_NEAR_ART: Record<NearMapVariant, string> = {
  standard: corridorNearStandardArt,
  alternate: corridorNearAlternateArt,
  third: corridorNearThirdArt,
};

/**
 * 交互物原图按 0.5 作为设计画布基准，再叠加小/中/大三档尺寸。
 * 512px 方图的中档绘制边长为 256px，宽幅素材仍按原始比例绘制。
 */
export const CORRIDOR_PROP_ART: Record<CurioKind, CorridorPropArt> = {
  safe: { src: corridorSafeArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.medium, groundTrim: 86 / 512 },
  crystalVein: { src: corridorCrystalVeinArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.large, groundTrim: 40 / 512 },
  vending: { src: corridorVendingArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.medium, groundTrim: 20 / 512 },
  remains: { src: corridorRemainsArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.small, groundTrim: 37 / 512 },
  compactor: { src: corridorCompactorArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.large, groundTrim: 58 / 512 },
  medical: { src: corridorMedicalArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.medium, groundTrim: 26 / 512 },
  sink: { src: corridorSinkArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.large, groundTrim: 68 / 512 },
  repairPod: { src: corridorRepairPodArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.large, groundTrim: 11 / 512 },
  modBench: { src: corridorModBenchArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.large, groundTrim: 65 / 512 },
  cardPrinter: { src: corridorCardPrinterArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.medium, groundTrim: 19 / 512 },
  shrine: { src: corridorShrineArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.large, groundTrim: 46 / 512 },
  dispatch: { src: corridorDispatchArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.medium, groundTrim: 12 / 512 },
  merchant: { src: corridorMerchantArt, width: 724, height: 543, scale: CORRIDOR_PROP_SCALES.medium, groundTrim: 5 / 543 },
  tutorialArmory: { src: corridorSafeArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.medium, groundTrim: 86 / 512 },
  tutorialModBench: { src: corridorModBenchArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.large, groundTrim: 65 / 512 },
  tutorialForge: { src: corridorCardPrinterArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.medium, groundTrim: 19 / 512 },
  tutorialMedical: { src: corridorMedicalArt, width: 512, height: 512, scale: CORRIDOR_PROP_SCALES.medium, groundTrim: 26 / 512 },
};

/** 蓝色传送门素材的场景 Y 轴偏移（设计 px，正值向下）。 */
export const CORRIDOR_PORTAL_Y_OFFSET = 60;

/** 各交互物独立的场景 Y 轴微调值（设计 px，正值向下）。 */
export const CORRIDOR_PROP_Y_OFFSETS: Record<CurioKind, number> = {
  safe: 0,
  crystalVein: 0,
  vending: 0,
  remains: 0,
  compactor: 0,
  medical: 0,
  sink: 0,
  repairPod: 0,
  modBench: 0,
  cardPrinter: 0,
  shrine: 0,
  dispatch: 0,
  merchant: 0,
  tutorialArmory: 0,
  tutorialModBench: 0,
  tutorialForge: 0,
  tutorialMedical: 0,
};

export const CORRIDOR_ART_SOURCES: readonly string[] = [
  corridorFarArt,
  ...Object.values(CORRIDOR_NEAR_ART),
  bluePortalArt,
  ...Object.values(CORRIDOR_PROP_ART).map((art) => art.src),
];
