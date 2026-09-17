import type { BattleState, DamageOpts } from "../types";
import { defenseMultiplier } from "../stats";
import { applyDamageModifiers, collectDamageModifiers, createDamageCtx } from "./modifiers";

// 预览命中后的确定性伤害: 只走乘区修正与防御, 忽略命中/暴击/格挡/护盾等随机或吸收结果,
// 也不触发任何带副作用的阶段钩子。UI 需要的是"命中时会打多少", 而不是提前掷一次战斗 RNG。
export function previewDamage(
  state: BattleState,
  sourceId: string | undefined,
  targetId: string,
  amount: number,
  opts: Pick<DamageOpts, "flags" | "isAttack" | "fixed" | "pure"> = {},
): number | null {
  const target = state.combatants[targetId];
  if (!target || !target.alive) return null;

  const dmg = createDamageCtx(sourceId, targetId, amount, opts);
  dmg.amount = applyDamageModifiers(dmg.amount, collectDamageModifiers(state, dmg, opts.pure));
  const src = sourceId ? state.combatants[sourceId] : undefined;
  if (!dmg.fixed) dmg.amount *= defenseMultiplier(target, src);
  return Math.max(0, Math.round(dmg.amount));
}
