// runStore 的状态形状 —— 拆出来是为了让 store/run/ 下的编排模块能拿到 set 的类型,
// 又不必反向 import runStore(那会形成依赖环)。

import type { ChallengeRun } from "@/engine";
import type { ItemStack } from "@/items/types";
import type { MapDifficulty } from "@/data/maps/mapDifficulty";
import type { ExpGain } from "../town/townStore";

// ★ "formation"(编队) 是据点的**一级全屏页**, 不是设施内浮层 ——
//   入口是据点全景右下的「编队」按钮(见 ui/town/TownScreen), 医疗室提供「复苏舱」。
//   回据点走 ScreenTransition 的默认淡出淡入。
//   ⚠⚠ **角色详情不是一个 screen**: 它是编队页内部的第二种态, 点卡不跳页, 由
//   ui/character/FormationScreen/formationMorph 做一次同页元素重组。
// ★ "sortie"(出击) 同样是据点的一级全屏页: 入口是据点全景右下的「出击」按钮, 内部分两步
//   (选地图 → 备物资, step 存在 store/sortieStore 里)。
// ★ "elevator" 是纯演出中转页, 没有任何交互与规则; 下行进探索、上行回据点, 探索会话要等下行演出结束后才建立。
export type Screen =
  | "menu"
  | "town"
  | "formation"
  | "sortie"
  | "elevator"
  | "explore"
  | "battle"
  | "victory"
  | "defeat";

export type RunResult = "won" | "lost" | "retreat";

export type ElevatorRide =
  | { dir: "down"; mapId: string; backpack: ItemStack[]; difficulty: MapDifficulty }
  | { dir: "up" };

export interface RunState {
  screen: Screen;
  mapId: string | null; // 当前远征的地图
  difficulty: MapDifficulty;
  expReport: ExpGain[]; // 上一场胜利的经验结算报告(结算页展示)
  lastResult: RunResult | null;
  lastLoot: number; // 上一场战斗的居民积分产出(结算页展示)。⚠ 普通战斗恒为 0, 见 EXPLORE_RULES.loot
  lastDrops: ItemStack[]; // 上一场战斗掉的实物(结算页展示) —— 战斗的正经产出是这个
  lastClearReward: ItemStack[]; // 本趟每日通关奖励, 结算页单独标注来源
  battleSettled: boolean; // 本场战斗已完成结算, 但胜利面板仍留在战斗画布内
  lastDropK: number; // 本场掉落使用的最终倍率
  lastDropTier: { tier: number; name: string; color: string; rewardMultiplier: number } | null;
  lastChallengeBonus: number;
  lastBountyBonus: number;
  lastChallenges: ChallengeRun[];
  elevatorRide: ElevatorRide | null;
}

export type RunSet = (partial: Partial<RunState>) => void;

// 一场战斗的胜利面板数据。离开战斗画布(回探索 / 进结算 / 回城)时整组清空。
export const CLEARED_BATTLE_REPORT = {
  battleSettled: false,
  lastDropK: 0,
  lastDropTier: null,
  lastChallengeBonus: 0,
  lastBountyBonus: 0,
  lastChallenges: [],
} satisfies Partial<RunState>;
