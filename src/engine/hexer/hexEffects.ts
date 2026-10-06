// 咒术师效果分发 —— 出牌改写(回手 / 视为速攻 / 额外推进 / 伤害 flags)在这里直接写入 hexPlay,
// 行动点与操纵类转 hexEffectsEnemy, 状态搬运类转 hexEffectsStatus, 痛楚提前结算转 hexTorment。

import type { BattleState, EffectDescriptor } from "../types";
import { applyHexEnemyEffect } from "./hexEffectsEnemy";
import { applyHexStatusEffect } from "./hexEffectsStatus";
import { settleTorment } from "./hexTorment";

export const HEX_EFFECT_TYPES: ReadonlySet<EffectDescriptor["type"]> = new Set<EffectDescriptor["type"]>([
  "GAIN_ENEMY_AP",
  "DRAIN_ENEMY_AP",
  "SWAP_ENEMY_AP",
  "RETURN_SELF_TO_HAND",
  "EXTRA_TICK_ADVANCE",
  "PLAY_AS_FAST",
  "PLAY_DAMAGE_FLAGS",
  "STEAL_BUFF",
  "INHERIT_DEBUFFS",
  "GATHER_DEBUFFS",
  "COPY_DEBUFF",
  "SWAP_CURSES",
  "SETTLE_TORMENT",
  "RANDOM_HEX",
  "PUPPET_STRIKE",
  "EXECUTE",
]);

export function applyHexEffect(
  state: BattleState,
  effect: EffectDescriptor,
  sourceId: string,
  targetIds: string[],
  primaryId: string | undefined,
): void {
  switch (effect.type) {
    // 出牌改写只在玩家出牌期间有意义(被动卡与敌人招式里写了也不生效)。
    case "RETURN_SELF_TO_HAND":
      if (state.activeCardUid) state.hexPlay.returnToHand = true;
      return;
    case "PLAY_AS_FAST":
      if (state.activeCardUid) state.hexPlay.asFast = true;
      return;
    case "EXTRA_TICK_ADVANCE":
      if (state.activeCardUid) state.hexPlay.extraAdvance += Math.max(0, Math.floor(effect.amount ?? 0));
      return;
    case "PLAY_DAMAGE_FLAGS":
      if (state.activeCardUid) state.hexPlay.damageFlags.push(...(effect.flags ?? []));
      return;
    case "STEAL_BUFF":
    case "INHERIT_DEBUFFS":
    case "GATHER_DEBUFFS":
    case "COPY_DEBUFF":
    case "SWAP_CURSES":
    case "RANDOM_HEX":
      applyHexStatusEffect(state, effect, sourceId, targetIds, primaryId);
      return;
    case "SETTLE_TORMENT":
      settleTorment(state, effect, sourceId, targetIds);
      return;
    default:
      applyHexEnemyEffect(state, effect, targetIds, primaryId);
  }
}
