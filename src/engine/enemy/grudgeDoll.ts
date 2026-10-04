// 咒怨人偶(咒术师被动卡): 在手牌中时, 满足恶毒的敌人发动攻击招式 → 招式改为打它自己;
// 首领不反转, 改为本次招式伤害减半。触发后人偶进入弃牌堆(不计弃牌、不触发弃牌联动)。

import type { BattleState, EffectDescriptor, Enemy } from "../types";
import { log } from "../core/ops";
import { venomMet } from "../hexer/hexGate";
import { moveToDiscard } from "../deck/discard";
import { isBossEnemyDefId } from "@/data";

export const GRUDGE_DOLL_TAG = "reverseEnemyAttack";
const GRUDGE_DOLL_VENOM = 4;
const BOSS_DAMAGE_RATIO = 0.5;

export interface GrudgeOutcome {
  effects: EffectDescriptor[];
  reversed: boolean;
}

function findDoll(state: BattleState, enemyId: string): string | undefined {
  return state.hand.find((uid) => {
    const card = state.cards[uid];
    if (!card?.tags?.includes(GRUDGE_DOLL_TAG)) return false;
    const owner = state.combatants[card.ownerCharId];
    return Boolean(owner?.alive) && venomMet(state, enemyId, GRUDGE_DOLL_VENOM, card.ownerCharId);
  });
}

const FOE_TARGETS: ReadonlySet<EffectDescriptor["target"]> = new Set(["primary", "allFoes", "randomFoe", undefined]);

export function applyGrudgeDoll(
  state: BattleState,
  enemy: Enemy,
  effects: EffectDescriptor[],
): GrudgeOutcome | null {
  const dollUid = findDoll(state, enemy.id);
  if (!dollUid) return null;
  const boss = isBossEnemyDefId(enemy.enemyDefId);
  moveToDiscard(state, dollUid, "passiveEnd");
  if (boss) {
    log(state, `🪆 咒怨人偶替我方承受了一半的${enemy.intent.name}`);
    return {
      reversed: false,
      effects: effects.map((effect) => {
        if (effect.type !== "DAMAGE") return effect;
        return effect.amount != null
          ? { ...effect, amount: effect.amount * BOSS_DAMAGE_RATIO }
          : { ...effect, multiplier: (effect.multiplier ?? 1) * BOSS_DAMAGE_RATIO };
      }),
    };
  }
  log(state, `🪆 咒怨人偶反转了 ${enemy.name} 的${enemy.intent.name}`);
  return {
    reversed: true,
    effects: effects.map((effect) => (FOE_TARGETS.has(effect.target) ? { ...effect, target: "self" } : effect)),
  };
}
