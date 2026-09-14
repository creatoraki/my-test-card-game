import bluePortalArt from "@/assets/explore-corridor/废弃楼层/蓝色传送门.png";
import defaultChestArt from "@/assets/explore-corridor/废弃楼层/默认宝箱素材.png";
import corridorFarArt from "@/assets/explore-corridor/废弃楼层/无限远景.png";
import corridorNearLeftArt from "@/assets/explore-corridor/废弃楼层/无限近景-左.png";
import corridorNearRightArt from "@/assets/explore-corridor/废弃楼层/无限近景-右.png";
import type { CurioKind } from "@/explore/corridor/types";

/** 废弃楼层专属背景与物件素材登记；所有交互物共用默认宝箱图。 */
export const CORRIDOR_FAR_ART = corridorFarArt;
/** 房间传送门：四个方向共用蓝色传送门立绘。 */
export const CORRIDOR_PORTAL_ART = bluePortalArt;
export const CORRIDOR_NEAR_LEFT_ART = corridorNearLeftArt;
export const CORRIDOR_NEAR_RIGHT_ART = corridorNearRightArt;

export const CORRIDOR_PROP_ART: Record<CurioKind, string> = {
  chest: defaultChestArt,
  medical: defaultChestArt,
  terminal: defaultChestArt,
  vending: defaultChestArt,
  purifier: defaultChestArt,
  scrap: defaultChestArt,
  dispatch: defaultChestArt,
  camp: defaultChestArt,
};

/**
 * 各物件素材的底部透明留白比例；每种物件可独立调整，正好补偿透明画布与地面线之间的距离。
 */
export const CORRIDOR_PROP_GROUND_TRIM: Record<CurioKind, number> = {
  chest: 20 / 148,
  medical: 20 / 148,
  terminal: 20 / 148,
  vending: 20 / 148,
  purifier: 20 / 148,
  scrap: 20 / 148,
  dispatch: 20 / 148,
  camp: 20 / 148,
};

/** 默认宝箱素材宽高比；物件组件按该比例显示，避免拉伸原图。 */
export const CORRIDOR_PROP_ASPECT_RATIO = 256 / 148;

/** 蓝色传送门素材的场景 Y 轴偏移（设计 px，正值向下）。 */
export const CORRIDOR_PORTAL_Y_OFFSET = 60;

/** 各交互物独立的场景 Y 轴微调值（设计 px，正值向下）。 */
export const CORRIDOR_PROP_Y_OFFSETS: Record<CurioKind, number> = {
  chest: 0,
  medical: 0,
  terminal: 0,
  vending: 0,
  purifier: 0,
  scrap: 0,
  dispatch: 0,
  camp: 0,
};

export const CORRIDOR_ART_SOURCES: readonly string[] = [
  corridorFarArt,
  corridorNearLeftArt,
  corridorNearRightArt,
  bluePortalArt,
  defaultChestArt,
];
