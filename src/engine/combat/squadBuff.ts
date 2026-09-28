import type { Ally, BattleState } from "../types";
import { ops } from "../core/ops";
import { rngPick } from "../core/rng";

export const ASSEMBLE_IDS = ["assembleA", "assembleB", "assembleC", "assembleD"] as const;
export type AssembleId = (typeof ASSEMBLE_IDS)[number];
export type AssembleRewardCategory = "attack" | "defense" | "support" | "passive";

export interface SquadBuffDef {
  id: AssembleId;
  name: string;
  emoji: string;
  desc: string;
}

export const SQUAD_BUFF_DEFS: Record<AssembleId, SquadBuffDef> = {
  assembleA: { id: "assembleA", name: "组装 A", emoji: "🜁", desc: "炼金配方的 A 部件。释放：对一名随机敌人施加灼烧。" },
  assembleB: { id: "assembleB", name: "组装 B", emoji: "🜂", desc: "炼金配方的 B 部件。释放：生命最低的队友获得护盾。" },
  assembleC: { id: "assembleC", name: "组装 C", emoji: "🜃", desc: "炼金配方的 C 部件。释放：对所有敌人施加中毒。" },
  assembleD: { id: "assembleD", name: "组装 D", emoji: "🜄", desc: "炼金配方的 D 部件。释放：手牌中所有共鸣牌各获得 1 次共鸣强化。" },
};

const REWARD_CATEGORY_BY_MISSING: Record<AssembleId, AssembleRewardCategory> = {
  assembleA: "attack",
  assembleB: "defense",
  assembleC: "support",
  assembleD: "passive",
};

const REWARD_CATEGORY_NAMES: Record<AssembleRewardCategory, string> = {
  attack: "攻击",
  defense: "防御",
  support: "功能",
  passive: "被动",
};

// 缺少某字母时获得的奖励分类名(提纯选择弹窗展示用)。
export function assembleRewardCategoryName(missing: AssembleId): string {
  return REWARD_CATEGORY_NAMES[REWARD_CATEGORY_BY_MISSING[missing]];
}

function aliveAllies(state: BattleState): Ally[] {
  return state.playerIds
    .map((id) => state.combatants[id])
    .filter((combatant): combatant is Ally => combatant.alive && combatant.team === "player");
}

export function squadBuffIds(state: BattleState): AssembleId[] {
  return state.squadBuffs.map((entry) => entry.id as AssembleId);
}

export function hasSquadBuff(state: BattleState, id: AssembleId): boolean {
  return state.squadBuffs.some((entry) => entry.id === id);
}

export function missingAssembleIds(state: BattleState): AssembleId[] {
  const current = new Set(squadBuffIds(state));
  return ASSEMBLE_IDS.filter((id) => !current.has(id));
}

export function removeSquadBuff(state: BattleState, id: AssembleId): boolean {
  const index = state.squadBuffs.findIndex((entry) => entry.id === id);
  if (index < 0) return false;
  state.squadBuffs.splice(index, 1);
  return true;
}

export function removeRandomSquadBuff(state: BattleState): AssembleId | undefined {
  const ids = squadBuffIds(state);
  if (ids.length === 0) return undefined;
  const id = rngPick(state, ids);
  removeSquadBuff(state, id);
  return id;
}

export function consumeAllSquadBuffs(state: BattleState): AssembleId[] {
  const consumed = squadBuffIds(state);
  state.squadBuffs = [];
  state.lastSquadBuffConsumed = consumed.length;
  return consumed;
}

export function gainSquadBuff(state: BattleState, id: AssembleId): boolean {
  if (hasSquadBuff(state, id)) return false;
  state.squadBuffs.push({ id });
  checkAssembly(state);
  return true;
}

// 直接放回一个组装 BUFF, 不触发组装检查(贤者之石保留用)。
export function restoreSquadBuff(state: BattleState, id: AssembleId): boolean {
  if (hasSquadBuff(state, id)) return false;
  state.squadBuffs.push({ id });
  ops.log(state, `保留 ${SQUAD_BUFF_DEFS[id].name}`);
  return true;
}

function hasPhilosophersStone(state: BattleState): boolean {
  return aliveAllies(state).some((ally) =>
    ally.statuses.some((status) => status.id === "philosophersStone" && status.stacks > 0),
  );
}

function grantAssembleReward(state: BattleState, missing: AssembleId): void {
  const category = REWARD_CATEGORY_BY_MISSING[missing];
  const pool = state.squadBuffRewardPools[category];
  const allies = aliveAllies(state);
  if (pool.length > 0 && allies.length > 0) {
    ops.addCardToHand(state, rngPick(state, [...pool]), rngPick(state, allies).charId);
  }
  ops.log(state, `组装成功：缺少 ${SQUAD_BUFF_DEFS[missing].name}，获得${REWARD_CATEGORY_NAMES[category]}奖励`);
}

// 组装成功的收尾: 发奖励、分发事件, 贤者之石生效时让玩家从本次消耗的字母里保留 1 种。
export function finishAssembly(state: BattleState, consumed: AssembleId[], missing: AssembleId): void {
  grantAssembleReward(state, missing);
  ops.firePassive(state, { type: "assembleSuccess" });
  if (consumed.length === 0 || !hasPhilosophersStone(state)) return;
  if (state.pendingChoice) {
    // 已有其它待选操作时不覆盖, 随机保留一种。
    restoreSquadBuff(state, rngPick(state, consumed));
    return;
  }
  state.pendingChoice = { kind: "pickSquadBuff", options: [...consumed], mode: "keep" };
}

export function checkAssembly(state: BattleState): boolean {
  const current = squadBuffIds(state);
  if (current.length < 3) return false;

  const assembled = current.slice(0, 3);
  state.squadBuffs = state.squadBuffs.filter((entry) => !assembled.includes(entry.id as AssembleId));
  const missing = ASSEMBLE_IDS.find((id) => !assembled.includes(id));
  if (!missing) return false;
  finishAssembly(state, assembled, missing);
  return true;
}

// 提纯: 恰好持有 2 种时消耗它们并让玩家从 2 个缺失字母中选择奖励分类; 否则随机补 1 个缺少的组装 BUFF。
export function purifyAssembly(state: BattleState): void {
  const owned = squadBuffIds(state);
  if (owned.length !== 2) {
    const missing = missingAssembleIds(state);
    if (missing.length > 0) gainSquadBuff(state, rngPick(state, missing));
    return;
  }
  const missing = missingAssembleIds(state);
  state.squadBuffs = [];
  ops.log(state, "提纯：以 2 种部件完成组装");
  if (state.pendingChoice) {
    finishAssembly(state, owned, rngPick(state, missing));
    return;
  }
  state.pendingChoice = { kind: "pickSquadBuff", options: [...missing], mode: "purify" };
}

// 提纯选择落定: 选中的缺失字母决定奖励分类; 本次消耗的是另外两种字母。
export function resolvePurify(state: BattleState, missing: AssembleId, options: string[]): void {
  const consumed = ASSEMBLE_IDS.filter((id) => !options.includes(id));
  finishAssembly(state, consumed, missing);
}
