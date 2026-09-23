// ============================================================================
// 交互失败 —— 概率完全对玩家隐藏, 只在结算文案里体现结果。
// 最终失败率 = 决策基础失败率 + 等级加值 + Σ生效门槛的修正, 夹在 [0, CURIO_FAIL_CAP]。
// 门槛: 执行者职业, 或背包里的指定物品(生效时自动消耗 1 个)。
// · 修正失败率 / 追加奖励的物品门槛: 满足即生效, 立即消耗;
// · 只负责「失败转正面」的物品门槛: 只有失败真的发生并被它转化时才消耗。
// ============================================================================

import { getItemDef } from "@/data";
import { CURIO_FAIL_CAP, CURIO_LEVEL_RULES } from "@/data/curios/rules/levelRules";
import type { CurioEffect, CurioFailure, CurioLevel, CurioMitigation } from "@/data/curios/types";
import { rngFloat } from "@/engine/core/rng";
import type { ItemStack } from "@/items/types";
import type { ExploreState } from "../types";
import { partCanMatch } from "./offering";

export interface FailureOutcome {
  failed: boolean;
  /** 失败被门槛转化为正面结果。 */
  converted: { story: string; effects: CurioEffect[] } | null;
  /** 成功时追加的门槛奖励。 */
  bonusEffects: CurioEffect[];
  notes: string[];
}

const SAFE: FailureOutcome = { failed: false, converted: null, bonusEffects: [], notes: [] };

function matchedStack(s: ExploreState, mitigation: CurioMitigation): ItemStack | null {
  const when = mitigation.when;
  if (when.kind !== "item") return null;
  return s.backpack.find((stack) => partCanMatch({ match: when.match, count: 1 }, stack)) ?? null;
}

function applies(s: ExploreState, mitigation: CurioMitigation, executorId: string): boolean {
  const when = mitigation.when;
  if (when.kind === "job") return when.charId === executorId;
  return Boolean(matchedStack(s, mitigation));
}

function consumeOne(s: ExploreState, mitigation: CurioMitigation, notes: string[]): void {
  const stack = matchedStack(s, mitigation);
  if (!stack) return;
  s.backpack = stack.count > 1
    ? s.backpack.map((item) => (item.uid === stack.uid ? { ...item, count: item.count - 1 } : item))
    : s.backpack.filter((item) => item.uid !== stack.uid);
  notes.push(`消耗 ${getItemDef(stack.itemId).name} ×1`);
}

/** 掷一次隐藏失败，并结算门槛的物品消耗。 */
export function resolveFailure(
  s: ExploreState,
  failure: CurioFailure | undefined,
  level: CurioLevel,
  executorId: string,
  disabled = false,
): FailureOutcome {
  if (!failure || disabled) return SAFE;
  const active = (failure.mitigations ?? []).filter((mitigation) => applies(s, mitigation, executorId));
  const delta = active.reduce((sum, mitigation) => sum + (mitigation.chanceDelta ?? 0), 0);
  const chance = Math.max(0, Math.min(CURIO_FAIL_CAP, failure.chance + CURIO_LEVEL_RULES[level].failAdd + delta));
  const failed = chance > 0 && rngFloat(s) < chance;
  const converter = failed ? active.find((mitigation) => mitigation.convert) ?? null : null;

  const notes: string[] = [];
  const bonusEffects: CurioEffect[] = [];
  for (const mitigation of active) {
    const shaping = Boolean(mitigation.chanceDelta || mitigation.bonusEffects?.length);
    const used = shaping || mitigation === converter;
    if (!used) continue;
    if (!failed && mitigation.note) notes.push(mitigation.note);
    if (!failed && mitigation.bonusEffects) bonusEffects.push(...mitigation.bonusEffects);
    if (mitigation === converter && mitigation.note) notes.push(mitigation.note);
    if (mitigation.when.kind === "item") consumeOne(s, mitigation, notes);
  }
  return { failed, converted: converter?.convert ?? null, bonusEffects, notes };
}
