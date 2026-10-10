import type { BattleTier, NodeEvent } from "@/explore/types";
import type { CurioKind } from "@/explore/corridor/types";
import { CRAFT_CURIOS } from "./defs/craftCurios";
import { ARK_CURIOS } from "./defs/ecoArk";
import { GROWTH_CURIOS } from "./defs/growthCurios";
import { LOOT_CURIOS } from "./defs/lootCurios";
import { TRAP_CURIOS } from "./defs/trapCurios";
import { SERVICE_CURIOS } from "./defs/serviceCurios";
import { SUPPLY_CURIOS } from "./defs/supplyCurios";
import { TUTORIAL_CURIOS } from "./defs/tutorialCurios";
import { UTILITY_CURIOS } from "./defs/utilityCurios";
import type { CurioDef } from "./types";

export * from "./defs/critters";
export * from "./rules/curioRules";
export * from "./rules/merchantPricing";
export * from "./rules/rewardPools";
export * from "./rules/serviceBalance";
export * from "./types";

export const CORRIDOR_CURIOS: Record<CurioKind, CurioDef> = {
  ...UTILITY_CURIOS,
  ...ARK_CURIOS,
  ...SUPPLY_CURIOS,
  ...CRAFT_CURIOS,
  ...GROWTH_CURIOS,
  ...SERVICE_CURIOS,
  ...TUTORIAL_CURIOS,
  ...LOOT_CURIOS,
  ...TRAP_CURIOS,
};

/**
 * 普通物件随机投放权重：三种搜刮最常见，改造服务与遗物偶尔出现。
 * 恢复与陷阱物件不在这里：恢复由 dungeon/curioPlan.ts 按每房概率投放，陷阱只放进陷阱房。
 *
 * NPC 先占房间名额，剩余名额按本表抽取；锻造师每张地图固定一位。
 * · 地图里的装备只来自眠猫金库的 2 选 1～2（每次抽中率 75%）；
 * · 尘封的环锁密匣与杂兵掉落共同提供永久遗物。
 */
export const RANDOM_CURIO_WEIGHTS: Readonly<Partial<Record<CurioKind, number>>> = {
  // 搜刮
  supplyCrate: 30,
  toolLocker: 22,
  safe: 10,
  relicCache: 2,
  // 装备、遗物改造服务
  modBench: 3,
  bondWorkbench: 2,
  perfectnessWorkbench: 1,
  shrine: 2,
  // 工具型服务与导航(传送雕像成对投放，不在本表，见 dungeon/waystonePlan.ts)
  signpost: 5,
  coinExchange: 2,
  expConverter: 2,
  salvager: 2,
  neonArcade: 2,
};

/** 恢复物件：每间非起点房按 healChance 概率投放 1 个。 */
export const HEAL_CURIO_KINDS: readonly CurioKind[] = ["medical"];

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
