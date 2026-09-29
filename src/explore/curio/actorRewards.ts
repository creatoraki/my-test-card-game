// 探索交互的单人奖励 → 直接作用于交互者(执行者), 不再让玩家二次选人。
// 纯目标奖励(经验 / 治疗 / 体力极限 / 单人污染降低)当场结算出队;
// 仍需后续选择的(锻造 / 删卡 / 换卡 / 怪癖 / 净化)留在队列并锁定 actorId, 由奖励浮层跳过选人步。
// 交互者已倒下时, 单人奖励直接作废。
import { applyMemberHealing } from "../session/core/pending";
import type { ExploreState, PendingAction } from "../types";

const PENDING_NAMES: Partial<Record<PendingAction["kind"], string>> = {
  expOne: "定向经验",
  healOne: "指定治疗",
  healLimitOne: "体力极限修复",
  forgeDraw: "免费锻造",
  forgeRemove: "免费删卡",
  replaceCard: "普通卡替换",
  cureQuirk: "怪癖治疗",
  reducePollution: "污染值降低",
  purifyCards: "污染卡净化",
};

function isSingleTarget(action: PendingAction): boolean {
  switch (action.kind) {
    case "expOne":
    case "healOne":
    case "healLimitOne":
    case "forgeDraw":
    case "forgeRemove":
    case "replaceCard":
      return true;
    case "cureQuirk":
    case "reducePollution":
    case "purifyCards":
      return action.scope === "one";
    default:
      return false;
  }
}

/** 纯目标奖励当场结算; 返回备注, 返回 null 表示需要保留在队列里。 */
function applyDirect(s: ExploreState, member: ExploreState["party"][number], action: PendingAction): string | null {
  switch (action.kind) {
    case "expOne":
      s.pendingExp[member.charId] = (s.pendingExp[member.charId] ?? 0) + action.amount;
      return `${member.name} 获得经验 +${action.amount}`;
    case "healOne":
      applyMemberHealing(member, action);
      return action.full ? `${member.name} 生命回满` : `${member.name} 回复 ${Math.round(action.percent * 100)}% 生命`;
    case "healLimitOne":
      applyMemberHealing(member, action);
      return action.full ? `${member.name} 体力极限回满` : `${member.name} 体力极限修复 ${Math.round(action.percent * 100)}%`;
    case "reducePollution":
      // 由 mutateCurio 之后的 applyPendingPollution 立即结算到城镇侧。
      s.pendingPollution.push({ charId: member.charId, amount: -action.amount });
      return `${member.name} 污染值 -${action.amount}`;
    default:
      return null;
  }
}

/**
 * 处理本条效果新推入队列(下标 ≥ fromIndex)的单人待办。
 * 有奖励当场结算或作废时返回替换用的备注; 仅锁定目标时返回 null(沿用效果原备注)。
 */
export function settleActorRewards(s: ExploreState, actorId: string | undefined, fromIndex: number): string | null {
  if (!actorId) return null;
  const added = s.pendingActions.slice(fromIndex);
  if (!added.some(isSingleTarget)) return null;
  const member = s.party.find((candidate) => candidate.charId === actorId && candidate.alive);
  const kept: PendingAction[] = [];
  const notes: string[] = [];
  for (const action of added) {
    if (!isSingleTarget(action)) {
      kept.push(action);
      continue;
    }
    if (!member) {
      notes.push(`交互者已倒下，${PENDING_NAMES[action.kind] ?? "奖励"}作废`);
      continue;
    }
    const note = applyDirect(s, member, action);
    if (note) {
      notes.push(note);
      continue;
    }
    kept.push({ ...action, actorId: member.charId });
  }
  s.pendingActions = [...s.pendingActions.slice(0, fromIndex), ...kept];
  return notes.length ? notes.join("；") : null;
}
