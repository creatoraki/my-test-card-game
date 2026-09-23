// 远征途中需要同时改动城镇档案与探索会话的操作 —— 换装与「指定角色」类待办。
// 装备槽与卡组在城镇侧、背包与待办在探索侧, 两边只有 run 层同时认识。

import type { QuirkId } from "@/engine";
import { getItemDef } from "@/data";
import { canOpenBackpack } from "@/explore/session";
import type { EquipSlot } from "@/items/types";
import { useExploreStore } from "../explore/exploreStore";
import { useTownStore } from "../town/townStore";
import { alivePartyIds, syncMemberStats } from "./party";

// 背包 → 装备槽。★ 顺序是刻意的: **先**把新件从背包取走再校验旧件放不放得下 ——
// 同类装备互换时净占格为 0, 反过来先放旧件会在满包时误判为"装不下"。
// 任何一步失败都把背包恢复原状(新件刚腾出的格子必然还在, 放回必成)。
export function equipFromBackpack(charId: string, uid: string): boolean {
  const explore = useExploreStore.getState();
  const session = explore.session;
  if (!session || !canOpenBackpack(session)) return false;
  if (!session.party.some((p) => p.charId === charId)) return false;
  const stack = session.backpack.find((st) => st.uid === uid);
  if (!stack) return false;
  const def = getItemDef(stack.itemId);
  if (def.category !== "equipment" || !def.slot) return false;

  const taken = explore.takeBackpackItem(uid);
  if (!taken) return false;
  const town = useTownStore.getState();
  const old = town.characters[charId]?.equipped?.[def.slot] ?? null;
  if (old && !useExploreStore.getState().putBackpackItems([old])) {
    useExploreStore.getState().putBackpackItems([taken]); // 回滚
    return false;
  }
  town.wearStack(charId, taken);
  syncMemberStats(charId);
  return true;
}

// 装备槽 → 背包。★ 先校验容量再卸 —— 满包时不能出现"卸下来了但没地方放"的中间态。
export function unequipToBackpack(charId: string, slot: EquipSlot): boolean {
  const explore = useExploreStore.getState();
  const session = explore.session;
  if (!session || !canOpenBackpack(session)) return false;
  if (!session.party.some((p) => p.charId === charId)) return false;
  const town = useTownStore.getState();
  const stack = town.characters[charId]?.equipped?.[slot];
  if (!stack) return false;
  if (!explore.putBackpackItems([stack])) return false;
  town.takeOffStack(charId, slot);
  syncMemberStats(charId);
  return true;
}

export function resolvePendingHeal(charId: string, limit: boolean): void {
  const action = useExploreStore.getState().session?.pendingActions[0];
  if (!action || (limit ? action.kind !== "healLimitOne" : action.kind !== "healOne")) return;
  useExploreStore.getState().resolvePendingHealing(charId, limit);
}

export function startTaintedDraw(charId: string): void {
  const action = useExploreStore.getState().session?.pendingActions[0];
  if (!action || action.kind !== "forgeDraw") return;
  const town = useTownStore.getState();
  town.grantFreeDraw(charId);
  if (action.contaminate) town.contaminateCards([charId], action.contaminate);
}

export function resolvePendingQuirk(charId?: string, quirkId?: QuirkId): void {
  const action = useExploreStore.getState().session?.pendingActions[0];
  if (!action || action.kind !== "cureQuirk") return;
  const ids = action.scope === "party" ? alivePartyIds() : charId ? [charId] : [];
  if (!ids.length) return;
  const town = useTownStore.getState();
  for (const id of ids) {
    for (let i = 0; i < action.count; i++) {
      town.cureQuirk(id, id === charId ? quirkId : undefined);
    }
    syncMemberStats(id);
  }
  useExploreStore.getState().resolvePendingAction();
}

export function resolvePendingPollution(charId?: string): void {
  const action = useExploreStore.getState().session?.pendingActions[0];
  if (!action || action.kind !== "reducePollution") return;
  const ids = action.scope === "party" ? alivePartyIds() : charId ? [charId] : [];
  if (!ids.length) return;
  const town = useTownStore.getState();
  for (const id of ids) town.reducePollution(id, action.amount);
  useExploreStore.getState().resolvePendingAction();
}

export function resolvePendingPurification(charId: string | undefined, uids: string[]): void {
  const action = useExploreStore.getState().session?.pendingActions[0];
  if (!action || action.kind !== "purifyCards") return;
  const ids = action.scope === "party" ? alivePartyIds() : charId ? [charId] : [];
  if (!ids.length) return;
  const town = useTownStore.getState();
  for (const id of ids) {
    town.purifyCards(id, action.count, id === charId ? uids : undefined);
  }
  useExploreStore.getState().resolvePendingAction();
}
