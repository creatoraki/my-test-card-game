import { RULES } from "@/engine";
import { getBadge, hasActivatableNode, spentPoints } from "@/data";
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
  // ⚠ 只有「还点得动」才算待办: 剩余点数不足以支付任何一颗已解锁节点时(如只剩 1 点、门槛 2 点),
  //   这笔点数当前花不掉, 再提示就成了玩家无法消除的死待办。
  if (badge && unallocatedPoints > 0 && hasActivatableNode(badge, squadTalent.nodes, unallocatedPoints)) {
    items.push(`${unallocatedPoints} 点训练点未分配`);
  }

  return { pending: items.length > 0, items };
}
