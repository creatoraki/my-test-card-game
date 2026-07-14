// 敌人 AI: 意图选择(数据驱动脚本) + 行动执行。敌人招式复用效果系统。

import type { BattleState, Enemy, Intent } from "./types";
import { getEnemyDef } from "../data";
import { resolveEffects } from "./effects";
import { chooseAggroTarget } from "./targeting";
import { getStatus, log, markDead } from "./ops";

// 根据脚本指针刷新敌人当前意图(它下一次将要做的事)
export function buildIntent(state: BattleState, enemyId: string): void {
  const e = state.combatants[enemyId] as Enemy;
  const def = getEnemyDef(e.enemyDefId);
  const moveId = def.script[e.aiIndex % def.script.length];
  const move = def.moves.find((m) => m.id === moveId) ?? def.moves[0];

  const dmgEff = move.effects.find((x) => x.type === "DAMAGE");
  const blockEff = move.effects.find((x) => x.type === "GAIN_BLOCK");
  // 攻击意图预览把力量算进去
  const str = getStatus(e, "strength")?.stacks ?? 0;
  let value: number | undefined;
  if (dmgEff) value = (dmgEff.amount ?? 0) + str;
  else if (blockEff) value = blockEff.amount ?? 0;

  const intent: Intent = {
    moveId: move.id,
    name: move.name,
    emoji: move.emoji,
    kind: move.kind,
    value,
  };
  e.intent = intent;
}

// 敌人执行它当前的意图。
export function enemyAct(state: BattleState, enemyId: string): void {
  const e = state.combatants[enemyId] as Enemy;
  if (!e.alive) return;

  // 眩晕: 消耗 1 层, 跳过本次行动
  const stun = getStatus(e, "stun");
  if (stun) {
    stun.stacks -= 1;
    e.statuses = e.statuses.filter((s) => s.stacks > 0);
    log(state, `💫 ${e.name} 被眩晕, 无法行动`);
    e.actsThisRound += 1;
    e.aiIndex += 1;
    buildIntent(state, enemyId);
    return;
  }

  const def = getEnemyDef(e.enemyDefId);
  const move = def.moves.find((m) => m.id === e.intent.moveId) ?? def.moves[0];

  let primaryId: string | undefined;
  if (move.targeting === "foe") primaryId = chooseAggroTarget(state, enemyId);
  else if (move.targeting === "ally") primaryId = enemyId; // 简化: 支援自身

  log(state, `${e.emoji} ${e.name} 使用 ${move.name}`);
  resolveEffects(state, move.effects, enemyId, primaryId);

  if (e.hp <= 0) markDead(state, e);
  e.actsThisRound += 1;
  e.aiIndex += 1;
  buildIntent(state, enemyId);
}
