// 羁绊运行态的读写小工具: 档位查询、回合重置、通用的「重攻 / 攻击牌」判定与随机挑选。

import type {
  BattleBond,
  BattleState,
  BondRoundState,
  BondRuntime,
  Card,
  Combatant,
} from "../types";
import { activeEffectsOf } from "../cards/cardEffects";
import { rngPick } from "../core/rng";
import { STATUS_DEFS } from "../core/hookRegistry";

export function emptyBondRound(): BondRoundState {
  return {
    strengthHeavyUsed: false,
    chariotHits: {},
    chariotFastPending: false,
    chariotFastUsed: false,
    priestessUsed: false,
    emperorAoeUsed: false,
    wheelDraw: false,
    wheelMana: false,
    wheelGift: false,
    starReturnUsed: false,
    hangedSuspendUsed: false,
    hermitPeekUsed: false,
    hermitPeekPending: false,
    hermitManualUsed: false,
    moonSpreadUsed: false,
    sunSpreadUsed: false,
    deathDraws: 0,
    devilBloodUsed: false,
    devilFreePlays: 0,
    temperanceDot: [],
  };
}

export function createBondRuntime(list: BattleBond[] = []): BondRuntime {
  return {
    list: list.filter((bond) => bond.tier > 0).map((bond) => ({ ...bond })),
    round: emptyBondRound(),
    battle: { deathSaveUsed: false, hermitExtraDraw: 0 },
    play: { touched: [], healAll: false },
    suspended: [],
  };
}

/** 某条羁绊达到的档位; 未激活为 0。 */
export function bondTier(state: BattleState, id: string): number {
  return state.bond?.list.find((bond) => bond.id === id)?.tier ?? 0;
}

export function hasBondTier(state: BattleState, id: string, tier: number): boolean {
  return bondTier(state, id) >= tier;
}

export function isAttackCard(card: Card): boolean {
  return activeEffectsOf(card).some((effect) => effect.type === "DAMAGE");
}

/** 重攻: 基础费用 ≥ 2 的攻击牌(读卡牌定义的费用, 不受降费 / 模组影响)。 */
export function isHeavyAttack(card: Card | undefined): boolean {
  return Boolean(card && card.cardType !== "passive" && card.cost >= 2 && isAttackCard(card));
}

/** 当前正在结算的那张牌(出牌期间有效)。 */
export function activeCard(state: BattleState): Card | undefined {
  return state.activeCardUid ? state.cards[state.activeCardUid] : undefined;
}

export function isAlly(state: BattleState, id: string | undefined): boolean {
  return Boolean(id && state.combatants[id]?.team === "player");
}

export function isFoe(state: BattleState, id: string | undefined): boolean {
  return Boolean(id && state.combatants[id]?.team === "enemy");
}

export function aliveAllies(state: BattleState): Combatant[] {
  return state.playerIds.map((id) => state.combatants[id]).filter((unit) => unit?.alive);
}

export function aliveFoes(state: BattleState): Combatant[] {
  return state.enemyIds.map((id) => state.combatants[id]).filter((unit) => unit?.alive);
}

export function hpRatio(unit: Combatant): number {
  return unit.maxHp > 0 ? unit.hp / unit.maxHp : 0;
}

export function pickRandom<T>(state: BattleState, items: T[]): T | undefined {
  return items.length ? rngPick(state, items) : undefined;
}

/** 单位身上某一类状态的种类数(按 id 去重, 标记类不计)。 */
export function statusKindCount(unit: Combatant, kind: "buff" | "debuff"): number {
  const kinds = new Set<string>();
  for (const status of unit.statuses) {
    const def = STATUS_DEFS[status.id];
    if (status.stacks > 0 && def?.kind === kind && !def.mark) kinds.add(status.id);
  }
  return kinds.size;
}

export function addDamageFlags(flags: string[], ...extra: string[]): void {
  for (const flag of extra) if (!flags.includes(flag)) flags.push(flag);
}
