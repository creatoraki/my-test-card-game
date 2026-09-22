import type { CurioKind } from "@/explore/corridor/types";
import type { DossierThemeId } from "@/ui/explore/EventDossier";

/**
 * 物件事件 → 事件档案主题。
 * 物资搜刮走默认青色; 陷阱红色; 治疗补给绿色; 采掘拾荒紫晶; 神龛暖金; 成长/改造终端电蓝。
 */
const CURIO_THEME: Record<CurioKind, DossierThemeId> = {
  arkSeedVault: "supply",
  arkComposter: "mineral",
  arkDewCollector: "medical",
  arkGeneConsole: "terminal",
  arkSporeVent: "danger",
  supplyCrate: "supply",
  toolLocker: "supply",
  courierDrone: "supply",
  cashBox: "supply",
  moduleCase: "supply",
  safe: "supply",
  vending: "supply",
  equipmentCache: "supply",
  relicCache: "supply",
  dispatch: "supply",
  merchant: "supply",
  tutorialArmory: "supply",
  tutorialRelicCache: "supply",

  collapsedCeiling: "danger",
  leakingPipe: "danger",
  rogueDrone: "danger",

  medical: "medical",
  sink: "medical",
  repairPod: "medical",
  energyStation: "medical",
  tutorialMedical: "medical",

  crystalVein: "mineral",
  remains: "mineral",
  compactor: "mineral",

  shrine: "shrine",
  temporaryRelicCache: "shrine",

  modBench: "terminal",
  cardPrinter: "terminal",
  fieldTraining: "terminal",
  cardExchange: "terminal",
  bondWorkbench: "terminal",
  perfectnessWorkbench: "terminal",
  cardArchive: "terminal",
  tutorialModBench: "terminal",
  tutorialForge: "terminal",
};

export function curioTheme(kind: CurioKind): DossierThemeId {
  return CURIO_THEME[kind];
}
