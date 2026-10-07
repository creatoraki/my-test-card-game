import type { BattleState, Enemy } from "../types";
import { RULES } from "../core/battleRules";
import { log } from "../core/ops";
import { partyManaPerRound } from "../combat/stats";
import { rngPick } from "../core/rng";
import { ARK, arkEnemy, livingEnemies } from "./shared";
import { syncCollateralBuff } from "./collateralBuff";

export function heldManaTotal(state: BattleState): number {
  return livingEnemies(state).reduce((sum, enemy) => sum + (enemy.ark?.heldMana ?? 0), 0);
}

export function canSeizeMana(state: BattleState, enemy: Enemy): boolean {
  return (state.resources[RULES.resource.name] ?? 0) > 0 &&
    (enemy.ark?.heldMana ?? 0) < 2 && heldManaTotal(state) < 2;
}

function seizeCard(state: BattleState, enemy: Enemy, uid: string): void {
  const held = arkEnemy(enemy);
  if (!enemy.alive || held.heldCards.length >= 3 || !state.hand.includes(uid)) return;
  state.hand = state.hand.filter((id) => id !== uid);
  state.pendingAutoPlays = state.pendingAutoPlays.filter((id) => id !== uid);
  delete state.cards[uid].rooted;
  held.heldCards.push(uid);
  syncCollateralBuff(enemy);
  log(state, `${enemy.name} 扣押了「${state.cards[uid].name}」，击杀后返还`);
}

export function seizeOwnerCard(state: BattleState, enemy: Enemy, targetId: string): void {
  const target = state.combatants[targetId];
  if (target?.team !== "player" || !target.alive) return;
  const candidates = state.hand.filter((uid) => state.cards[uid]?.ownerCharId === target.charId);
  if (candidates.length) seizeCard(state, enemy, rngPick(state, candidates));
}

export function carryRoots(state: BattleState, enemy: Enemy): void {
  for (const uid of [...state.hand]) {
    if (state.cards[uid]?.rooted) seizeCard(state, enemy, uid);
  }
}

export function seizeMana(state: BattleState, enemy: Enemy): void {
  if (!enemy.alive || !canSeizeMana(state, enemy)) return;
  state.resources[RULES.resource.name] -= 1;
  arkEnemy(enemy).heldMana += 1;
  syncCollateralBuff(enemy);
  log(state, `${enemy.name} 扣押 1 枚法力水晶，后续回合自然回复不受影响`);
}

export function returnCollateral(state: BattleState, enemy: Enemy): void {
  if (enemy.enemyDefId !== ARK.crab || !enemy.ark) return;
  const { heldCards, heldMana } = enemy.ark;
  enemy.ark.heldCards = [];
  enemy.ark.heldMana = 0;
  syncCollateralBuff(enemy);
  for (const uid of heldCards) {
    const card = state.cards[uid];
    const owner = state.playerIds.map((id) => state.combatants[id])
      .find((unit) => unit.team === "player" && unit.charId === card?.ownerCharId);
    if (!card || !owner?.alive) continue;
    delete card.rooted;
    // 押品返还是原卡取回，不受抽牌的手牌上限阻挡。
    if (!state.hand.includes(uid)) state.hand.push(uid);
    log(state, `「${card.name}」解除扣押，返回手牌`);
  }
  if (heldMana > 0) {
    const current = state.resources[RULES.resource.name] ?? 0;
    state.resources[RULES.resource.name] = Math.max(current, Math.min(partyManaPerRound(state), current + heldMana));
    const returned = state.resources[RULES.resource.name] - current;
    log(state, `${enemy.name} 解除 ${heldMana} 枚水晶的扣押，当前返还 ${returned} 枚（不超过水晶上限）`);
  }
}

export function clearRoots(state: BattleState): void {
  for (const card of Object.values(state.cards)) delete card.rooted;
}

export function releaseRoot(state: BattleState, uid: string): boolean {
  const resource = RULES.resource.name;
  if (state.phase !== "player" || state.pendingChoice || !state.hand.includes(uid) ||
      !state.cards[uid]?.rooted || (state.resources[resource] ?? 0) < 1) return false;
  state.resources[resource] -= 1;
  delete state.cards[uid].rooted;
  log(state, `支付 1 枚法力水晶，解除「${state.cards[uid].name}」的缠根`);
  return true;
}
