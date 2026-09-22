import supplyArt from "@/assets/explore-corridor/事件背景/事件背景1.png";
import dangerArt from "@/assets/explore-corridor/事件背景/前方危险.png";
import medicalArt from "@/assets/explore-corridor/事件背景/医疗.png";
import mineralArt from "@/assets/explore-corridor/事件背景/矿石.png";
import shrineArt from "@/assets/explore-corridor/事件背景/神龛.png";
import terminalArt from "@/assets/explore-corridor/事件背景/终端.png";

/** 事件档案面板插图的分类。素材统一 1205×904(面板在 1080P 下的显示高度)。 */
export type DossierArtKind = "supply" | "danger" | "medical" | "mineral" | "shrine" | "terminal";

export const EVENT_DOSSIER_ART: Record<DossierArtKind, string> = {
  supply: supplyArt,
  danger: dangerArt,
  medical: medicalArt,
  mineral: mineralArt,
  shrine: shrineArt,
  terminal: terminalArt,
};

export const EVENT_DOSSIER_ART_SOURCES: readonly string[] = Object.values(EVENT_DOSSIER_ART);
