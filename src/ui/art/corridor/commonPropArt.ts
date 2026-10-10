import type { CurioKind } from "@/explore/corridor/types";
import type { CorridorPropArt } from "./corridorArt";
import { COMMON_PROP_ASSETS, type CommonPropAssetId } from "./commonPropAssets";
import { COMMON_PROP_TUNING } from "./commonPropTuning";

/**
 * 设施代号 → 素材 id；设施功能分类见 docs/交互物现状说明.md。
 * 所有交互物(含陷阱、NPC 与生态方舟独有物件)都只用 通用交互物/ 目录的素材；新设施落地时在此补一行。
 */
const PROP_ASSIGNMENT: Record<CurioKind, CommonPropAssetId> = {
  // 搜刮
  supplyCrate: "rustSnailShell",
  toolLocker: "stoppedCuckooClock",
  safe: "sleepCatVault",
  relicCache: "ringLockCase",
  temporaryRelicCache: "stoneShrine",
  // 恢复
  medical: "reverseSakuraSpring",
  // 服务
  modBench: "appraisalAnvil",
  shrine: "miasmaTapir",
  bondWorkbench: "dreamLoom",
  perfectnessWorkbench: "memoryAltar",
  blacksmith: "triPetalLotus",
  merchant: "robotMerchant",
  dispatch: "wingCourier",
  coinExchange: "bottledTown",
  expConverter: "whaleGramophone",
  salvager: "starSandHourglass",
  neonArcade: "neonStall",
  // 导航
  signpost: "oakSignpost",
  waystone: "moonBasin",
  // 陷阱
  collapsedCeiling: "thunderLamp",
  leakingPipe: "sealPillar",
  rogueDrone: "soundBellRack",
  // 生态方舟
  arkGeneConsole: "wishTree",
  arkSporeVent: "vineGrate",
  // 新手关
  tutorialArmory: "mossMailbox",
  tutorialModBench: "appraisalAnvil",
  tutorialMedical: "potionBench",
  tutorialRelicCache: "stoneShrine",
  tutorialCashBox: "travelerPack",
};

function mapKinds<T>(pick: (asset: CommonPropAssetId) => T): Record<CurioKind, T> {
  return Object.fromEntries(
    Object.entries(PROP_ASSIGNMENT).map(([kind, asset]) => [kind, pick(asset)]),
  ) as Record<CurioKind, T>;
}

function tunedArt(asset: CommonPropAssetId): CorridorPropArt {
  const art = COMMON_PROP_ASSETS[asset];
  const tuning = COMMON_PROP_TUNING[asset];
  return tuning ? { ...art, scale: art.scale * tuning.multiplier } : art;
}

/** 全部交互物的场景素材（已叠乘预览页调好的倍率）。 */
export const COMMON_PROP_ART = mapKinds(tunedArt);

/** 全部交互物的场景 Y 轴微调值（设计 px，正值向下）。 */
export const COMMON_PROP_Y_OFFSETS = mapKinds((asset) => COMMON_PROP_TUNING[asset]?.offsetY ?? 0);
