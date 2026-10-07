import type { BattleState, Enemy } from "../types";
import { getEnemyDef } from "@/data";
import { getStatus } from "../core/ops";
import { previewDamage } from "../damage/preview";
import { RULES } from "../core/battleRules";
import { ARK, livingPlayers } from "./shared";
import { ultimateCost } from "../enemy/enemyRhythm";

export function arkEnemyReadout(state: BattleState, enemy: Enemy, _selectedOwnerId?: string): string[] {
  if (!enemy.alive) return [];
  const lines: string[] = [];
  if (enemy.ark?.barrage) {
    lines.push(`火力封锁：剩余 ${enemy.ark.barrage.ammo} 发 · ${Math.max(0, enemy.ark.barrage.endsAt - state.tick)} 时刻`);
  } else if ((enemy.ark?.barrageCooldown ?? 0) > 0) {
    lines.push(`封锁冷却：还需完成 ${enemy.ark!.barrageCooldown} 次其他技能`);
  }
  if (enemy.nextActTick == null) return lines;
  const targetId = enemy.intent.primaryId;
  const target = targetId ? state.combatants[targetId] : undefined;
  if (enemy.intent.moveId === "ark-moth-pollen") {
    lines.push(`授粉目标：${target?.alive ? target.name : "存活同伴"} · 行动点 +2`);
    if (target?.team === "enemy" && target.alive) {
      const def = getEnemyDef(target.enemyDefId);
      const ultimate = ultimateCost(def);
      const currentMove = def.moves.find((move) => move.id === target.intent.moveId);
      const smalls = target.nextActTick == null ? target.rhythm.smallsSinceUltimate
        : currentMove?.cost === ultimate ? 0 : target.rhythm.smallsSinceUltimate + 1;
      if (ultimate != null && smalls >= RULES.enemy.smallsBeforeUltimate && target.ap + 2 >= ultimate)
        lines.push(`授粉后下次选招可进入大招决策（${RULES.enemy.ultimateChance}%）`);
    }
  }
  if (enemy.intent.moveId === ARK.groupDance) lines.push("可能立即追加一次小招");
  if (enemy.intent.moveId === ARK.transplant) {
    const receiverId = enemy.intent.secondaryId;
    const receiver = receiverId ? state.combatants[receiverId] : undefined;
    const layers = target ? Math.ceil((getStatus(target, "poison")?.stacks ?? 0) / 2) : 0;
    lines.push(`移栽：${target?.name ?? "随机病株"} → ${receiver?.name ?? "另一名角色"} · ${layers} 层中毒`);
  }
  if (enemy.intent.moveId === "ark-mantis-harvest") {
    for (const unit of livingPlayers(state)) {
      const stacks = getStatus(unit, "poison")?.stacks ?? 0;
      const damage = previewDamage(state, undefined, unit.id, stacks, { flags: ["poison"], fixed: true, pure: true }) ?? 0;
      lines.push(`${unit.name}：预计毒发 ${damage} 点`);
    }
  }
  return lines;
}
