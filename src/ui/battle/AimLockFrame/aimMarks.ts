import { aimLocksByTarget, getStatusDef, type BattleState } from "@/engine";
import { statusArtOf } from "@/ui/art/battle/statusArt";

// 立绘框特效要展示的一条瞄准: 谁、用什么技能锁定了该角色。
export interface AimMark {
  key: string;
  source: string; // 发起瞄准的单位名
  skill: string; // 瞄准技能(承载状态)名
  art?: string; // 承载状态的图标
}

const NONE: AimMark[] = [];

/** 全场瞄准关系解析成可展示条目; 未被瞄准的单位取 aimMarksFor 时拿到共享空数组。 */
export function aimMarksByTarget(battle: BattleState): Record<string, AimMark[]> {
  const result: Record<string, AimMark[]> = {};
  for (const [targetId, locks] of Object.entries(aimLocksByTarget(battle))) {
    result[targetId] = locks.map((lock) => ({
      key: `${lock.sourceId}:${lock.statusId}`,
      source: battle.combatants[lock.sourceId]?.name ?? "未知单位",
      skill: getStatusDef(lock.statusId)?.name ?? "瞄准",
      art: statusArtOf(lock.statusId),
    }));
  }
  return result;
}

export function aimMarksFor(marks: Record<string, AimMark[]>, targetId: string): AimMark[] {
  return marks[targetId] ?? NONE;
}
