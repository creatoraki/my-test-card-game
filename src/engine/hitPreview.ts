import type { BattleState, Card } from "./types";
import { hitChance } from "./stats";

// 预览卡牌的第一个 DAMAGE 效果; 多段 DAMAGE 的徽章按第一个效果显示。
// 返回百分点; null 表示没有命中判定或当前目标不可预览。
export function cardHitChance(state: BattleState, card: Card, targetId: string): number | null {
  const effect = [
    ...card.effects,
    ...(card.keywords?.flatMap((keyword) => keyword.effects) ?? []),
  ].find((candidate) => candidate.type === "DAMAGE");

  if (!effect || effect.flags?.includes("mustHit")) return null;

  const attacker = state.combatants[card.ownerCharId];
  const target = state.combatants[targetId];
  if (!attacker || !target || !target.alive) return null;

  return hitChance(state, attacker, target, effect.hitBonus ?? 0);
}