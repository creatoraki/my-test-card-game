import bluePortalArt from "@/assets/explore-corridor/废弃楼层/蓝色传送门.png";
import defaultChestArt from "@/assets/explore-corridor/废弃楼层/默认宝箱素材.png";
import corridorFarArt from "@/assets/explore-corridor/废弃楼层/无限远景.png";
import corridorNearStandardArt from "@/assets/explore-corridor/废弃楼层/近景/测试.png";
import corridorNearAlternateArt from "@/assets/explore-corridor/废弃楼层/近景/测试2.png";
import corridorNearThirdArt from "@/assets/explore-corridor/废弃楼层/近景/测试3.png";
import type { NearMapVariant } from "@/explore/dungeon/types";
import type { CurioKind } from "@/explore/corridor/types";

/** 废弃楼层专属背景与物件素材登记；所有交互物共用默认宝箱图。 */
export const CORRIDOR_FAR_ART = corridorFarArt;
/** 房间传送门：四个方向共用蓝色传送门立绘。 */
export const CORRIDOR_PORTAL_ART = bluePortalArt;
export const CORRIDOR_NEAR_ART: Record<NearMapVariant, string> = {
  standard: corridorNearStandardArt,
  alternate: corridorNearAlternateArt,
  third: corridorNearThirdArt,
};

export const CORRIDOR_PROP_ART: Record<CurioKind, string> = {
  safe: defaultChestArt,
  crystalVein: defaultChestArt,
  vending: defaultChestArt,
  remains: defaultChestArt,
  compactor: defaultChestArt,
  medical: defaultChestArt,
  sink: defaultChestArt,
  repairPod: defaultChestArt,
  modBench: defaultChestArt,
  cardPrinter: defaultChestArt,
  shrine: defaultChestArt,
  dispatch: defaultChestArt,
  merchant: defaultChestArt,
};

/**
 * 各物件素材的底部透明留白比例；每种物件可独立调整，正好补偿透明画布与地面线之间的距离。
 */
export const CORRIDOR_PROP_GROUND_TRIM: Record<CurioKind, number> = {
  safe: 20 / 148,
  crystalVein: 20 / 148,
  vending: 20 / 148,
  remains: 20 / 148,
  compactor: 20 / 148,
  medical: 20 / 148,
  sink: 20 / 148,
  repairPod: 20 / 148,
  modBench: 20 / 148,
  cardPrinter: 20 / 148,
  shrine: 20 / 148,
  dispatch: 20 / 148,
  merchant: 20 / 148,
};

/** 默认宝箱素材宽高比；物件组件按该比例显示，避免拉伸原图。 */
export const CORRIDOR_PROP_ASPECT_RATIO = 256 / 148;

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
};

export const CORRIDOR_ART_SOURCES: readonly string[] = [
  corridorFarArt,
  ...Object.values(CORRIDOR_NEAR_ART),
  bluePortalArt,
  defaultChestArt,
];
