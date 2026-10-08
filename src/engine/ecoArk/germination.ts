import type { BattleState } from "../types";
import { getStatus, log, ops } from "../core/ops";
import { shuffle } from "../core/rng";
import { ARK, livingEnemies } from "./shared";

// 孢子萌发：缠根张数与附带中毒（层数 / 持续拍数）。
export const GERMINATE_ROOTS = 2;
export const GERMINATE_POISON = { stacks: 2, duration: 3 } as const;

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
    for (const uid of shuffle(state, candidates).slice(0, GERMINATE_ROOTS)) {
      const card = state.cards[uid];
      card.rooted = true;
      log(state, `「${card.name}」被缠根，下次我方回合开始解除`);
    }
    ops.applyStatus(state, target.id, "poison", GERMINATE_POISON.stacks, GERMINATE_POISON.duration);
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
