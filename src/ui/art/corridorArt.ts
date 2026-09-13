import portalArt from "@/assets/explore-corridor/废弃楼层/传送门.png";
import vendingArt from "@/assets/explore-corridor/废弃楼层/售货机.png";
import chestArt from "@/assets/explore-corridor/废弃楼层/宝箱.png";
import statueArt from "@/assets/explore-corridor/废弃楼层/雕像.png";
import corridorFarArt from "@/assets/explore-corridor/废弃楼层/无限远景.png";
import corridorNearLeftArt from "@/assets/explore-corridor/废弃楼层/无限近景-左.png";
import corridorNearRightArt from "@/assets/explore-corridor/废弃楼层/无限近景-右.png";
import type { CurioKind } from "@/explore/corridor/types";

/** 废弃楼层专属背景与物件素材登记。没有单独美术的物件使用宝箱图。 */
export const CORRIDOR_FAR_ART = corridorFarArt;
export const CORRIDOR_NEAR_LEFT_ART = corridorNearLeftArt;
export const CORRIDOR_NEAR_RIGHT_ART = corridorNearRightArt;

export const CORRIDOR_PROP_ART: Record<CurioKind, string> = {
  chest: chestArt,
  medical: chestArt,
  terminal: chestArt,
  vending: vendingArt,
  purifier: statueArt,
  scrap: chestArt,
  dispatch: portalArt,
  camp: chestArt,
};

/**
 * 各物件所用素材的底部透明留白占整格高度的比例（由 scripts/alpha-bbox.mjs 实测）。
 * 精灵格底边并不等于物件底边，渲染时要减掉这段留白才能让物件真正踩在地面线上。
 */
export const CORRIDOR_PROP_GROUND_TRIM: Record<CurioKind, number> = {
  chest: 0.1684,
  medical: 0.1684,
  terminal: 0.1684,
  vending: 0.0439,
  purifier: 0.0366,
  scrap: 0.1684,
  dispatch: 0.1523,
  camp: 0.1684,
};

export const CORRIDOR_ART_SOURCES: readonly string[] = [
  corridorFarArt,
  corridorNearLeftArt,
  corridorNearRightArt,
  portalArt,
  vendingArt,
  chestArt,
  statueArt,
];
