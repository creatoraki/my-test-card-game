// 出牌推进时刻数 —— 普通牌基础推进 1, 速攻牌 0; 在此之上叠加咒术师的改写:
//   沉吟 / 后发模组(EXTRA_TICK_ADVANCE)与逢魔(持有者自己的普通牌)各多推进;
//   停摆最优先: 攻击牌只要打到了持有停摆的敌人, 推进数改为 0。

import type { BattleState, Card, CardType, HexPlayState } from "../types";
import { RULES } from "../core/battleRules";
import { activeEffectsOf } from "../cards/cardEffects";

const STALL_STATUS = "stall";
const WITCHING_STATUS = "witching";

function hasStatus(state: BattleState, id: string, statusId: string): boolean {
  return Boolean(state.combatants[id]?.statuses.some((status) => status.id === statusId && status.stacks > 0));
}

export function isAttackCard(card: Card): boolean {
  return activeEffectsOf(card).some((effect) => effect.type === "DAMAGE");
}

export function cardTickAdvance(
  state: BattleState,
  card: Card,
  playedType: CardType,
  hexPlay: HexPlayState,
  touchedIds: string[],
): number {
  if (playedType !== "normal") return RULES.timeline.fastCardAdvance;
  const stalled = isAttackCard(card) && touchedIds.some(
    (id) => state.combatants[id]?.team === "enemy" && hasStatus(state, id, STALL_STATUS),
  );
  if (stalled) return 0;
  const witching = hasStatus(state, card.ownerCharId, WITCHING_STATUS) ? 1 : 0;
  return RULES.timeline.normalCardAdvance + hexPlay.extraAdvance + witching;
}
