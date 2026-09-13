import portalArt from "@/assets/explore-corridor/废弃楼层/传送门.png";
import vendingArt from "@/assets/explore-corridor/废弃楼层/售货机.png";
import chestArt from "@/assets/explore-corridor/废弃楼层/宝箱.png";
import corridorBackdropArt from "@/assets/explore-corridor/废弃楼层/背景.png";
import statueArt from "@/assets/explore-corridor/废弃楼层/雕像.png";
import type { CurioKind } from "@/explore/corridor/types";

/** 废弃楼层专属背景与物件素材登记。没有单独美术的物件使用宝箱图。 */
export const CORRIDOR_BACKDROP_ART = corridorBackdropArt;

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

export const CORRIDOR_ART_SOURCES: readonly string[] = [
  corridorBackdropArt,
  portalArt,
  vendingArt,
  chestArt,
  statueArt,
];
