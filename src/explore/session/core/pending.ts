// 待办结算 —— 事件留下的「指定角色」类动作、污染 / 经验请求, 由 store 层逐个消费。
// 纯探索层不接触 townStore: 这里只登记与出队, 真正改城镇档案的是 store。

import { bondPool, getItemDef } from "@/data";
import { rngInt } from "@/engine/core/rng";
import { findByUid } from "@/items/inventory";
import type { ExploreState, PendingAction } from "../../types";
import { addPendingLoot } from "../loot/backpack";
import { restoreLimit } from "./party";

export interface PendingContamination {
  total: number;
  each: number;
}

export function takePendingContamination(s: ExploreState): PendingContamination {
  const result = { total: s.pendingContaminationCount, each: s.pendingContaminationEach };
  s.pendingContaminationCount = 0;
  s.pendingContaminationEach = 0;
  return result;
}

export function takePendingPollution(s: ExploreState): { charId: string; amount: number }[] {
  const pending = s.pendingPollution.map((entry) => ({ ...entry }));
  s.pendingPollution = [];
  return pending;
}

export function grantExpTo(s: ExploreState, charId: string): boolean {
  const action = s.pendingActions[0];
  if (!action || action.kind !== "expOne") return false;
  const target = s.party.find((p) => p.charId === charId && p.alive);
  if (!target) return false;
  s.pendingExp[charId] = (s.pendingExp[charId] ?? 0) + action.amount;
  return true;
}

export function recordExpGain(s: ExploreState, amount: number): boolean {
  const gained = Math.max(0, Math.floor(amount));
  if (!gained) return false;
  s.stats.expTotal += gained;
  return true;
}

export function takePendingExp(s: ExploreState): Record<string, number> {
  const exp = { ...s.pendingExp };
  s.pendingExp = {};
  return exp;
}

export function resolvePendingAction(s: ExploreState): boolean {
  if (!s.pendingActions.length) return false;
  s.pendingActions.shift();
  return true;
}

type HealingAction = Extract<PendingAction, { kind: "healOne" | "healLimitOne" }>;

/** 把一条指定治疗 / 体力极限修复作用到目标身上; 不处理出队。 */
export function applyMemberHealing(target: ExploreState["party"][number], action: HealingAction): void {
  if (action.kind === "healLimitOne") {
    // 全恢复按满额 maxHp 计: 体力极限回满, 当前生命也同步回满。
    restoreLimit(target, action.full ? target.maxHp : Math.ceil(target.maxHp * action.percent));
    return;
  }
  target.hp = Math.min(
    target.hpLimit,
    action.full ? target.hpLimit : target.hp + Math.ceil(target.maxHp * action.percent),
  );
}

export function resolvePendingHealing(s: ExploreState, charId: string, limit: boolean): boolean {
  const action = s.pendingActions[0];
  if (!action || action.kind !== (limit ? "healLimitOne" : "healOne")) return false;
  const target = s.party.find((p) => p.charId === charId && p.alive);
  if (!target) return false;
  applyMemberHealing(target, action as HealingAction);
  s.pendingActions.shift();
  return true;
}

export function reforgeBackpackItem(s: ExploreState, uid: string): boolean {
  const action = s.pendingActions[0];
  if (!action || action.kind !== "reforge") return false;
  const item = findByUid(s.backpack, uid);
  if (!item || getItemDef(item.itemId).category !== "equipment") return false;
  const pool = bondPool(action.bias);
  if (!pool.length) return false;
  item.affinity = pool[rngInt(s, pool.length)];
  return true;
}

// 装备候选与遗物候选是同一套「公开 N 件 → 挑 1 件进拾取框」的流程,
// 差别只在候选怎么生成 ⇒ 接受动作共用一份实现, 只用 kind 区分是哪一队候选。
function acceptOffer(s: ExploreState, index: number, kind: "equipOffer" | "relicOffer"): boolean {
  const action = s.pendingActions[0];
  if (!action) return false;
  if (action.kind !== "equipOffer" && action.kind !== "relicOffer") return false;
  if (action.kind !== kind) return false;
  const offer = action.offers[index];
  if (!offer) return false;
  addPendingLoot(s, [{ ...offer }]);
  return true;
}

export function acceptEquipOffer(s: ExploreState, index: number): boolean {
  return acceptOffer(s, index, "equipOffer");
}

export function acceptRelicOffer(s: ExploreState, index: number): boolean {
  return acceptOffer(s, index, "relicOffer");
}
