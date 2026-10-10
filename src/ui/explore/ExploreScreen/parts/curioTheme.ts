import type { CurioKind } from "@/explore/corridor/types";
import type { DossierThemeId } from "@/ui/explore/EventDossier";

/**
 * 物件事件 → 事件档案主题。
 * 物资搜刮走默认青色; 陷阱红色; 恢复绿色; 研究员工作站紫晶; 神龛暖金; 成长/改造终端电蓝。
 */
const CURIO_THEME: Record<CurioKind, DossierThemeId> = {
  arkGeneConsole: "terminal",
  arkSporeVent: "danger",
  supplyCrate: "supply",
  toolLocker: "mineral",
  safe: "supply",
  relicCache: "supply",
  dispatch: "supply",
  merchant: "supply",
  blacksmith: "blacksmith",
  tutorialArmory: "supply",
  tutorialRelicCache: "supply",
  tutorialCashBox: "supply",

  collapsedCeiling: "danger",
  leakingPipe: "danger",
  rogueDrone: "danger",

  medical: "medical",
  tutorialMedical: "medical",

  shrine: "shrine",
  temporaryRelicCache: "shrine",

  modBench: "terminal",
  bondWorkbench: "terminal",
  perfectnessWorkbench: "terminal",
  tutorialModBench: "terminal",
  coinExchange: "terminal",
  expConverter: "shrine",
  salvager: "mineral",
  neonArcade: "blacksmith",
  signpost: "supply",
  waystone: "shrine",
};

export function curioTheme(kind: CurioKind): DossierThemeId {
  return CURIO_THEME[kind];
}
