import type { BattleTier, NodeEvent } from "@/explore/types";
import type { CurioKind } from "@/explore/corridor/types";
import { CRAFT_CURIOS } from "./defs/craftCurios";
import { ARK_CURIOS } from "./defs/ecoArk";
import { GROWTH_CURIOS } from "./defs/growthCurios";
import { LOOT_CURIOS } from "./defs/lootCurios";
import { TRAP_CURIOS } from "./defs/trapCurios";
import { SCAVENGE_CURIOS } from "./defs/scavengeCurios";
import { SERVICE_CURIOS } from "./defs/serviceCurios";
import { SUPPLY_CURIOS } from "./defs/supplyCurios";
import { TUTORIAL_CURIOS } from "./defs/tutorialCurios";
import type { CurioDef } from "./types";

export * from "./defs/critters";
export * from "./rules/levelRules";
export * from "./rules/merchantPricing";
export * from "./rules/rewardPools";
export * from "./types";

export const CORRIDOR_CURIOS: Record<CurioKind, CurioDef> = {
  ...ARK_CURIOS,
  ...SCAVENGE_CURIOS,
  ...SUPPLY_CURIOS,
  ...CRAFT_CURIOS,
  ...GROWTH_CURIOS,
  ...SERVICE_CURIOS,
  ...TUTORIAL_CURIOS,
  ...LOOT_CURIOS,
  ...TRAP_CURIOS,
};

/**
 * 普通物件随机投放权重：换金物最常见，其次材料、食品与道具，装备与服务偶尔出现。
 * 治疗与陷阱物件不在这里：治疗由 dungeon/curioPlan.ts 按每房概率投放，陷阱只放进陷阱房。
 *
 * NPC 先占房间名额，剩余名额按本表抽取；锻造师每张地图固定一位。
 * · 苔铃寄存邮筒(装备) ≈ 0.8 件，与战斗掉落(约 2.1 件)合计约 3 件；
 * · 尘封的遗物匣与杂兵掉落共同提供永久遗物。
 */
export const RANDOM_CURIO_WEIGHTS: Readonly<Partial<Record<CurioKind, number>>> = {
  // 换金物 / 材料 / 食品 / 道具
  cashBox: 20,
  supplyCrate: 11,
  toolLocker: 9,
  safe: 8,
  courierDrone: 8,
  vending: 6,
  compactor: 6,
  crystalVein: 5,
  moduleCase: 8,
  remains: 4,
  modBench: 4,
  // 装备、遗物与成长服务
  equipmentCache: 6,
  bondWorkbench: 2,
  perfectnessWorkbench: 1,
  relicCache: 2,
  shrine: 1,
};

/** 治疗与粒子补给交互：每间非起点房按 healChance 概率投放 1 个。 */
export const HEAL_CURIO_KINDS: readonly CurioKind[] = ["medical", "sink", "repairPod", "energyStation"];

/** 陷阱物件：只投放在陷阱房，进房立即触发。 */
export const TRAP_CURIO_KINDS: readonly CurioKind[] = ["collapsedCeiling", "leakingPipe", "rogueDrone"];

export const CORRIDOR_AMBUSH: NodeEvent = {
  id: "corridor-ambush",
  kind: "battle",
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

/** 交互失败拉响警报后赶来的守卫。 */
export function corridorAlarmEvent(tier: BattleTier): NodeEvent {
  return {
    id: `corridor-alarm-${tier}`,
    kind: "battle",
    title: "警报引来的守卫",
    energyDelta: 0,
    description: "刺耳的警报还没停下，循声而来的守卫已经堵住了队伍。",
    choices: [{
      id: "fight",
      label: "迎战守卫",
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
    kind: kind === "merchant" || kind === "blacksmith" ? "merchant" : "loot",
    title: def.name,
    energyDelta: 0,
    description: def.description,
  };
}
