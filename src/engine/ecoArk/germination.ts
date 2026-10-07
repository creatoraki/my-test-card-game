import type { BattleState } from "../types";
import { getStatus, log, ops } from "../core/ops";
import { rngPick } from "../core/rng";
import { ARK, livingEnemies } from "./shared";

export function germinate(state: BattleState, targetId: string): void {
  const target = state.combatants[targetId];
  if (!target?.alive) return;
  const spore = getStatus(target, ARK.spore);
  if (!spore || spore.stacks <= 0) return;
  target.statuses = target.statuses.filter((status) => status !== spore);
  log(state, `${target.name} 的孢子萌发，孢子清空`);
  if (target.team === "player") {
    const candidates = state.hand.filter((uid) =>
      state.cards[uid]?.ownerCharId === target.charId && !state.cards[uid].rooted,
    );
    if (candidates.length) {
      const card = state.cards[rngPick(state, candidates)];
      card.rooted = true;
      log(state, `「${card.name}」被缠根，下次我方回合开始解除`);
    }
  }
  for (const snail of livingEnemies(state).filter((enemy) => getStatus(enemy, "arkRootReturn"))) {
    const allies = livingEnemies(state);
    const lowest = allies.reduce((best, enemy) =>
      enemy.hp / enemy.maxHp < best.hp / best.maxHp ? enemy : best,
    );
    ops.heal(state, undefined, lowest.id, 8);
    log(state, `${snail.name} 触发根网回灌`);
  }
}
