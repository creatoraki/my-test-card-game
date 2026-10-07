import type { BattleState, Enemy } from "../types";
import { getStatus, ops } from "../core/ops";

export const BURST_BUFF = "arkNamedBurst";

export function clearBurstBuff(enemy: Enemy): void {
  enemy.statuses = enemy.statuses.filter((status) => status.id !== BURST_BUFF);
}

export function setBurstTarget(state: BattleState, enemy: Enemy, targetId: string): void {
  let buff = getStatus(enemy, BURST_BUFF);
  if (!buff) {
    ops.applyStatus(state, enemy.id, BURST_BUFF, 1);
    buff = getStatus(enemy, BURST_BUFF);
  }
  if (buff) buff.targetId = targetId;
}

export function burstBuffDescription(state: BattleState, enemy: Enemy): string | undefined {
  const buff = getStatus(enemy, BURST_BUFF);
  if (!buff) return;
  const target = buff.targetId ? state.combatants[buff.targetId] : undefined;
  return `点名目标：${target?.alive ? target.name : "重新随机选择存活角色"}。蓄力期间，角色打出卡牌会将点名转移到该角色；发动点名齐射时攻击此目标。持续时间：永久；发动齐射或取消蓄力后移除。`;
}
