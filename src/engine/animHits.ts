// ============================================================================
// 逐段命中记录器 —— 纯 UI 桥接, 不参与任何战斗结算。
//
// 为什么需要它: 引擎的多段伤害在 effects.ts 里是「段外层 × 目标内层」的双重循环,
// 每一段都独立走一次 ops.dealDamage(独立判命中/暴击/格挡)。但过去 UI 只能拿到
// 「快照前后的 HP 差值」这一个总数 —— 段数、每段打了多少、哪一段闪避了, 全都在
// 到达 UI 前被抹平, 于是三段各 10 点只会飘一个 -30、只响一声。
//
// 这里用一个模块级的「当前记录器」(与 discard.ts 的 withDiscardRecorder 同构),
// 由 ops.dealDamage / ops.heal 在结算落地那一刻上报一段明细, 结算结束后按目标
// 聚合成 AnimHit[]。引擎的任何数值行为都不受影响。
// ============================================================================

import type { AnimHit, AnimHitPart, BattleState } from "./types";

interface RawPart extends AnimHitPart {
  id: string;
}

let activeParts: RawPart[] | null = null;

// 在 fn 期间收集逐段命中明细, 返回按目标聚合后的 AnimHit[]。
// 可重入: 嵌套调用(如出牌结算里又触发了弃牌联动)时内层自成一份, 外层不受污染。
export function withHitRecorder(fn: () => void): AnimHit[] {
  const previous = activeParts;
  const parts: RawPart[] = [];
  activeParts = parts;
  try {
    fn();
  } finally {
    activeParts = previous;
  }
  return mergeParts(parts);
}

// 结算原语在命中落地时调用。没有活动记录器时是空操作。
// hpDelta: >0 掉血, <0 回血, 0 = 命中但没造成 HP 变化(被护盾全吃/濒死顶住)。
export function recordHitPart(targetId: string, hpDelta: number, missed = false, crit = false): void {
  activeParts?.push({ id: targetId, hpDelta, missed, crit });
}

// 按目标聚合: hpDelta 求和(供震屏/音高等既有消费方沿用), parts 保留原始顺序,
// missed 取「全部段都未命中」—— 三段里中了两段不该显示 MISS。
function mergeParts(parts: RawPart[]): AnimHit[] {
  const order: string[] = [];
  const byId = new Map<string, AnimHit>();
  for (const part of parts) {
    let hit = byId.get(part.id);
    if (!hit) {
      hit = { id: part.id, hpDelta: 0, parts: [] };
      byId.set(part.id, hit);
      order.push(part.id);
    }
    hit.hpDelta += part.hpDelta;
    hit.parts!.push({ hpDelta: part.hpDelta, missed: part.missed, crit: part.crit });
  }
  for (const hit of byId.values()) hit.missed = hit.parts!.every((part) => part.missed);
  return order.map((id) => byId.get(id)!);
}

// 把「按 HP 差值扫全场」得到的目标补进命中表 —— 覆盖不经 dealDamage/heal 的 HP 变化
// (状态结算、吸血回复等), 以及只吃护盾/状态的目标。已被逐段记录的目标不再重复。
// existing 会被就地扩充并返回。
export function fillMissingHits(
  state: BattleState,
  beforeHp: Record<string, number>,
  existing: AnimHit[],
  extraIds: readonly string[] = [],
): AnimHit[] {
  const seen = new Set(existing.map((hit) => hit.id));
  const ids = [...state.playerIds, ...state.enemyIds];
  for (const id of ids) {
    if (seen.has(id)) continue;
    const hpDelta = (beforeHp[id] ?? state.combatants[id]?.hp ?? 0) - (state.combatants[id]?.hp ?? 0);
    if (hpDelta === 0 && !extraIds.includes(id)) continue;
    existing.push({ id, hpDelta });
    seen.add(id);
  }
  return existing;
}
