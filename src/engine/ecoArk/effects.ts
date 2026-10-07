import type { BattleState, EffectDescriptor } from "../types";
import { getStatus, log, ops } from "../core/ops";
import { rngPick } from "../core/rng";
import { germinate } from "./germination";
import { markGardenOwner } from "./guard";
import { carryRoots, seizeMana, seizeOwnerCard } from "./resources";
import { startBarrage } from "./sentry";
import { livingPlayers } from "./shared";

export const ARK_EFFECT_TYPES = new Set([
  "ARK_SEIZE_CARD", "ARK_SEIZE_MANA", "ARK_CARRY_ROOTS", "ARK_GERMINATE",
  "ARK_MARK_GUARD", "ARK_TRANSPLANT", "ARK_BARRAGE",
]);

export function applyArkEffect(state: BattleState, effect: EffectDescriptor, sourceId: string, targetIds: string[]): void {
  const enemy = state.combatants[sourceId];
  if (enemy?.team !== "enemy" || !enemy.alive) return;
  switch (effect.type) {
    case "ARK_SEIZE_CARD":
      for (const id of targetIds) seizeOwnerCard(state, enemy, id);
      break;
    case "ARK_SEIZE_MANA": seizeMana(state, enemy); break;
    case "ARK_CARRY_ROOTS": carryRoots(state, enemy); break;
    case "ARK_GERMINATE": for (const id of targetIds) germinate(state, id); break;
    case "ARK_MARK_GUARD":
      if (targetIds[0]) markGardenOwner(state, targetIds[0]);
      break;
    case "ARK_TRANSPLANT": {
      const source = targetIds[0];
      const poison = source ? getStatus(state.combatants[source], "poison") : undefined;
      if (!poison) break;
      const targets = livingPlayers(state).filter((unit) => unit.id !== source);
      if (!targets.length) break;
      const receiver = targets.find((unit) => unit.id === enemy.intent.secondaryId) ?? rngPick(state, targets);
      ops.applyStatus(state, receiver.id, "poison", Math.ceil(poison.stacks / 2), 3, undefined, enemy.id);
      log(state, `${enemy.name} 将 ${state.combatants[source].name} 的中毒移栽到 ${receiver.name}，病株层数不减少`);
      break;
    }
    case "ARK_BARRAGE": startBarrage(state, enemy); break;
  }
}
