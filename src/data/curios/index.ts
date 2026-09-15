import type { BattleTier, NodeEvent } from "@/explore/types";
import type { CurioKind } from "@/explore/corridor/types";
import { CRAFT_CURIOS } from "./craftCurios";
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
};

export const RANDOM_CURIO_KINDS: readonly CurioKind[] = [
  "safe",
  "crystalVein",
  "vending",
  "remains",
  "compactor",
  "medical",
  "sink",
  "repairPod",
  "modBench",
  "cardPrinter",
  "shrine",
];

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
