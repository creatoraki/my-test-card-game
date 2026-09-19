import type { BattleTier, NodeEvent } from "@/explore/types";
import type { CurioKind } from "@/explore/corridor/types";
import { CRAFT_CURIOS } from "./craftCurios";
import { LOOT_CURIOS } from "./lootCurios";
import { RISK_CURIOS } from "./riskCurios";
import { SCAVENGE_CURIOS } from "./scavengeCurios";
import { SERVICE_CURIOS } from "./serviceCurios";
import { SUPPLY_CURIOS } from "./supplyCurios";
import { TUTORIAL_CURIOS } from "./tutorialCurios";
import type { CurioDef } from "./types";

export * from "./critters";
export * from "./merchantPricing";
export * from "./rewardPools";
export * from "./types";

export const CORRIDOR_CURIOS: Record<CurioKind, CurioDef> = {
  ...SCAVENGE_CURIOS,
  ...SUPPLY_CURIOS,
  ...CRAFT_CURIOS,
  ...SERVICE_CURIOS,
  ...TUTORIAL_CURIOS,
  ...LOOT_CURIOS,
  ...RISK_CURIOS,
};

/**
 * 普通物件随机投放权重：偏向获取物品的交互。
 * 治疗与风险物件不在这里，由 dungeon/curioPlan.ts 按房间配额单独投放。
 */
export const RANDOM_CURIO_WEIGHTS: Readonly<Partial<Record<CurioKind, number>>> = {
  safe: 3,
  crystalVein: 3,
  vending: 3,
  remains: 3,
  compactor: 3,
  supplyCrate: 3,
  toolLocker: 3,
  courierDrone: 3,
  cashBox: 3,
  moduleCase: 3,
  modBench: 2,
  cardPrinter: 2,
  shrine: 1,
};

/** 治疗交互：约每 roomsPerHeal 间房投放 1 个。 */
export const HEAL_CURIO_KINDS: readonly CurioKind[] = ["medical", "sink", "repairPod"];

/** 风险房物件：约每 roomsPerRisk 间房投放 1 间，进房立即触发。 */
export const RISK_CURIO_KINDS: readonly CurioKind[] = ["collapsedCeiling", "leakingPipe", "rogueDrone"];

export const CORRIDOR_AMBUSH: NodeEvent = {
  id: "corridor-ambush",
  kind: "battle",
  category: "battle",
  title: "地底黑影",
  energyDelta: 0,
  description: "地面的黑斑忽然鼓起，无声的轮廓挡住了去路。",
  choices: [{
    id: "fight",
    label: "迎战黑影",
    desc: "准备战斗。",
    story: "准备战斗。",
    energyDelta: 0,
    effects: [{ type: "START_NODE_BATTLE" }],
  }],
};

export function corridorGuardEvent(tier: BattleTier, encounterId: string): NodeEvent {
  return {
    id: `corridor-guard-${encounterId}`,
    kind: "battle",
    category: "battle",
    title: "地底黑影",
    energyDelta: 0,
    description: "地面的黑斑忽然鼓起，无声的轮廓挡住了去路。",
    choices: [{
      id: "fight",
      label: "迎战黑影",
      desc: "准备战斗。",
      story: "准备战斗。",
      energyDelta: 0,
      effects: [{ type: "START_NODE_BATTLE", tier, encounterId }],
    }],
  };
}

export function corridorWandererEvent(tier: BattleTier): NodeEvent {
  return {
    id: `corridor-wanderer-${tier}`,
    kind: "battle",
    category: "battle",
    title: "游荡杂兵",
    energyDelta: 0,
    description: "走廊深处的杂兵循着粒子波动现身，挡住了前路。",
    choices: [{
      id: "fight",
      label: "迎战杂兵",
      desc: "准备战斗。",
      story: "准备战斗。",
      energyDelta: 0,
      effects: [{ type: "START_NODE_BATTLE", tier }],
    }],
  };
}

export function curioEvent(kind: CurioKind): NodeEvent {
  const def = CORRIDOR_CURIOS[kind];
  return {
    id: `corridor-${kind}`,
    kind: kind === "merchant" ? "merchant" : "loot",
    category: kind === "merchant" ? "economy" : "growth",
    title: def.name,
    energyDelta: 0,
    description: def.description,
  };
}
