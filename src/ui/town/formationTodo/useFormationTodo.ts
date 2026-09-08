import { RULES } from "@/engine";
import { getBadge, spentPoints } from "@/data";
import { squadTrainingPoints, useTownStore } from "@/store/townStore";

export interface FormationTodo {
  pending: boolean;
  items: string[];
}

/**
 * 据点出击前的编队待办判定。
 *
 * 队伍容量要扣除营养舱占用的唤醒角色，避免可用人数不足时把无法完成的
 * 「满员」误报成待办；徽章与训练点则沿用训练室同源的纯函数。
 */
export function useFormationTodo(): FormationTodo {
  const party = useTownStore((state) => state.party);
  const awakenedCount = useTownStore((state) => state.awakened.length);
  const nutritionOccupants = useTownStore((state) => state.nutrition.occupants.length);
  const squadTalent = useTownStore((state) => state.squadTalent);
  const trainingPoints = useTownStore(squadTrainingPoints);

  const cap = Math.min(
    RULES.progression.partySize,
    awakenedCount - nutritionOccupants,
  );
  const items: string[] = [];

  if (party.length < cap) {
    items.push(`队伍未满员（${party.length}/${cap} 人）`);
  }

  const storedBadge = squadTalent.badgeId ? getBadge(squadTalent.badgeId) : undefined;
  const badge = storedBadge && !storedBadge.locked ? storedBadge : undefined;
  if (!badge) {
    items.push("尚未选择小队徽章");
  }

  const spent = badge ? spentPoints(badge, squadTalent.nodes) : 0;
  const unallocatedPoints = trainingPoints - spent;
  if (unallocatedPoints > 0) {
    items.push(`${unallocatedPoints} 点训练点未分配`);
  }

  return { pending: items.length > 0, items };
}
