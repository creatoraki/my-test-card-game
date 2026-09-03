import type { Ally, BattleState } from "./types";
import { ops } from "./ops";
import { rngPick } from "./rng";

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
  assembleA: { id: "assembleA", name: "组装 A", emoji: "🜁", desc: "炼金配方的 A 部件。" },
  assembleB: { id: "assembleB", name: "组装 B", emoji: "🜂", desc: "炼金配方的 B 部件。" },
  assembleC: { id: "assembleC", name: "组装 C", emoji: "🜃", desc: "炼金配方的 C 部件。" },
  assembleD: { id: "assembleD", name: "组装 D", emoji: "🜄", desc: "炼金配方的 D 部件。" },
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

export function consumeAllSquadBuffs(state: BattleState): number {
  const count = state.squadBuffs.length;
  state.squadBuffs = [];
  state.lastSquadBuffConsumed = count;
  return count;
}

export function gainSquadBuff(state: BattleState, id: AssembleId): boolean {
  if (hasSquadBuff(state, id)) return false;
  state.squadBuffs.push({ id });
  checkAssembly(state);
  return true;
}

export function checkAssembly(state: BattleState): boolean {
  const current = squadBuffIds(state);
  if (current.length < 3) return false;

  const assembled = current.slice(0, 3);
  state.squadBuffs = state.squadBuffs.filter((entry) => !assembled.includes(entry.id as AssembleId));
  const missing = ASSEMBLE_IDS.find((id) => !assembled.includes(id));
  if (!missing) return false;

  const category = REWARD_CATEGORY_BY_MISSING[missing];
  const pool = state.squadBuffRewardPools[category];
  const allies = aliveAllies(state);
  if (pool.length > 0 && allies.length > 0) {
    ops.addCardToHand(state, rngPick(state, [...pool]), rngPick(state, allies).charId);
  }
  ops.log(state, `组装成功：缺少 ${SQUAD_BUFF_DEFS[missing].name}，获得${REWARD_CATEGORY_NAMES[category]}奖励`);
  ops.firePassive(state, { type: "assembleSuccess" });
  return true;
}
