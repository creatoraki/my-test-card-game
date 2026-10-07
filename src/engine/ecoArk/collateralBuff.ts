import type { BattleState, Enemy } from "../types";

export const COLLATERAL_BUFF = "arkCollateral";

/** 押品由扣押资源决定，永久保留且不可驱散，返还后移除。 */
export function syncCollateralBuff(enemy: Enemy): void {
  enemy.statuses = enemy.statuses.filter((status) => status.id !== COLLATERAL_BUFF);
  if ((enemy.ark?.heldCards.length ?? 0) > 0 || (enemy.ark?.heldMana ?? 0) > 0) {
    enemy.statuses.push({ id: COLLATERAL_BUFF, stacks: 1 });
  }
}

export function collateralBuffDescription(state: BattleState, enemy: Enemy): string | undefined {
  const names = (enemy.ark?.heldCards ?? [])
    .map((uid) => state.cards[uid]?.name)
    .filter(Boolean);
  const mana = enemy.ark?.heldMana ?? 0;
  if (!names.length && !mana) return;
  const held = [
    names.length ? `押品卡牌：${names.map((name) => `「${name}」`).join("、")}。` : "",
    mana > 0 ? `扣押法力水晶：${mana} 枚。` : "",
  ].join("");
  return `${held}持续时间：永久。击杀持有押品的敌人后返还，不可支付水晶赎回。`;
}
