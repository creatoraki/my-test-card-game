// 背包 —— 占格、收纳、负重与待拾取(设计文档 §六)。

import { getItemDef } from "@/data";
import { RULES } from "@/engine/core/battleRules";
import { burdenValue } from "@/engine/combat/stats";
import {
  addToContainer,
  canShipHome,
  findByUid,
  occupiedSlots,
  removeByUid,
  stackSlots,
} from "@/items/inventory";
import type { ItemRarity, ItemStack } from "@/items/types";
import { changeEnergy } from "../../resources/energy";
import { relicBurdenAdapt } from "../../relics/relicModifiers";
import { fireExploreRelic } from "../../relics/relics";
import { EXPLORE_RULES } from "../../core/exploreRules";
import type { ExploreState } from "../../types";
import { logLine } from "../core/log";

function countPickup(s: ExploreState, amount: number): void {
  s.stats.pickups += Math.max(0, amount);
}

// 收下一件遗物时登记拥有并触发「拾取」遗物钩子。
function noteRelicPicked(s: ExploreState, itemId: string): void {
  if (getItemDef(itemId).category !== "relic") return;
  if (!s.ownedRelicIds.includes(itemId)) s.ownedRelicIds.push(itemId);
  fireExploreRelic(s, { type: "itemPicked" });
}

// 已占格数。★ 唯一真相点: UI 读数、开战快照、「满载」判定全部读它。
export function backpackSlots(s: ExploreState): number {
  return occupiedSlots(s.backpack, getItemDef);
}

export function backpackFree(s: ExploreState): number {
  return RULES.burden.backpackSlots - backpackSlots(s);
}

// 小队负重适应 A = Σ 上阵角色负重适应(《角色养成设计.md》)。
// ⚠ 算**全员**而不只是存活者 —— 东西是开局就背上的, 队友倒下不会让包变轻。
export function partyBurdenAdapt(s: ExploreState): number {
  return s.party.reduce((n, p) => n + (p.burdenAdapt ?? 0), 0) + relicBurdenAdapt(s);
}

// 当前有效负重点数。小队合计后按格抵扣，下限由 burdenValue 截到 0。
// 探索页读数与开战快照共用同一个函数。
export function burdenNow(s: ExploreState): number {
  return burdenValue(backpackSlots(s), partyBurdenAdapt(s));
}

// 尝试把一批物品收进背包。装不下的进 pendingPickup 并原样回传 ——
// 由 UI 拉起「替换模式」让玩家取舍(设计文档 §6.4), store 层不替玩家做决定。
export function addItems(
  s: ExploreState,
  stacks: ItemStack[],
): { taken: ItemStack[]; overflow: ItemStack[] } {
  const r = addToContainer(s.backpack, stacks, getItemDef, RULES.burden.backpackSlots);
  s.backpack = r.next;
  countPickup(s, r.taken.length);
  for (const stack of r.taken) {
    if (getItemDef(stack.itemId).category === "relic" && !s.ownedRelicIds.includes(stack.itemId))
      s.ownedRelicIds.push(stack.itemId);
  }
  if (r.taken.some((st) => getItemDef(st.itemId).category === "relic"))
    fireExploreRelic(s, { type: "itemPicked" });
  if (r.overflow.length) s.pendingPickup = [...s.pendingPickup, ...r.overflow];
  return { taken: r.taken, overflow: r.overflow };
}

export function addPendingLoot(s: ExploreState, stacks: ItemStack[]): void {
  s.pendingLoot = [...s.pendingLoot, ...stacks];
}

export function takeLoot(s: ExploreState, index: number): boolean {
  const st = s.pendingLoot[index];
  if (!st) return false;
  const result = addToContainer(s.backpack, [st], getItemDef, RULES.burden.backpackSlots);
  if (!result.taken.length) return false;
  s.backpack = result.next;
  countPickup(s, result.taken.length);
  noteRelicPicked(s, st.itemId);
  s.pendingLoot = s.pendingLoot.filter((_, i) => i !== index);
  return true;
}

export function takeAllLoot(s: ExploreState): boolean {
  if (!s.pendingLoot.length) return false;
  let changed = false;
  for (let i = s.pendingLoot.length - 1; i >= 0; i--) {
    if (takeLoot(s, i)) changed = true;
  }
  return changed;
}

export function abandonLoot(s: ExploreState): boolean {
  if (!s.pendingLoot.length) return false;
  s.pendingLoot = [];
  return true;
}

// 丢弃一整堆。⚠ 不可撤销 —— 二次确认由 UI 负责(设计文档 §6.4), 这里只认结果。
export function discardStack(s: ExploreState, uid: string): boolean {
  const st = findByUid(s.backpack, uid);
  if (!st || getItemDef(st.itemId).undroppable) return false;
  const next = removeByUid(s.backpack, uid);
  if (next === s.backpack) return false;
  s.backpack = next;
  logLine(s, `丢弃了 ${getItemDef(st.itemId).name}`);
  return true;
}

// ---------------------------------------------------------------------------
// 远征途中换装(探索页角色档案)用的两个搬运函数。
// ⚠ 它们只搬背包 —— 装备到底穿在谁身上是**城镇侧**的状态, 由 runStore 编排两边。
// ---------------------------------------------------------------------------

// 按 uid 把一整堆从背包取出并交给调用方。取不到返回 null, 背包不变。
export function takeFromBackpack(s: ExploreState, uid: string): ItemStack | null {
  const st = findByUid(s.backpack, uid);
  if (!st) return null;
  const next = removeByUid(s.backpack, uid);
  if (next === s.backpack) return null;
  s.backpack = next;
  return { ...st };
}

// 把物品收进背包。★ 容量一律校验: 只要有一件装不下就**整体失败**且背包一格不动 ——
// 换装是原子操作, 不允许出现"新的穿上了、旧的没地方放"的中间态。
export function putIntoBackpack(s: ExploreState, stacks: ItemStack[]): boolean {
  const r = addToContainer(s.backpack, stacks, getItemDef, RULES.burden.backpackSlots);
  if (r.overflow.length) return false;
  s.backpack = r.next;
  return true;
}

// 背包重排序 —— 背包是紧凑数组, 数组顺序 = 玩家看到的格位顺序。
// 把 uid 那一堆抽出来, 插到目标格位上(后面的整体后移), 不是两两交换。
export function reorderBackpack(s: ExploreState, uid: string, toIndex: number): boolean {
  const from = s.backpack.findIndex((st) => st.uid === uid);
  if (from < 0) return false;
  const to = Math.max(0, Math.min(s.backpack.length - 1, toIndex));
  if (from === to) return false;
  const next = s.backpack.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  s.backpack = next;
  return true;
}

const RARITY_RANK: Record<ItemRarity, number> = {
  common: 0,
  fine: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
};

// 强制丢弃若干格(「压力门夹层」)。★ 从**最不值钱**的开始丢 ——
// 让系统随机砸掉稀有装备只会让玩家觉得被针对, 而不是觉得付出了代价。
export function forceDiscardSlots(s: ExploreState, slots: number): number {
  const rank = (st: ItemStack) => {
    const d = getItemDef(st.itemId);
    return RARITY_RANK[d.rarity] * 10 + (d.category === "equipment" ? 5 : 0);
  };
  const order = s.backpack
    .filter((st) => !getItemDef(st.itemId).undroppable)
    .slice()
    .sort((a, b) => rank(a) - rank(b));
  let dropped = 0;
  for (const st of order) {
    if (dropped >= slots) break;
    dropped += stackSlots(st, getItemDef(st.itemId));
    s.backpack = removeByUid(s.backpack, st.uid);
  }
  return dropped;
}

// 替换模式: 从 pendingPickup 里取第 index 件进背包。格子不够返回 false。
export function takePending(s: ExploreState, index: number): boolean {
  const st = s.pendingPickup[index];
  if (!st) return false;
  if (stackSlots(st, getItemDef(st.itemId)) > backpackFree(s)) return false;
  const r = addToContainer(s.backpack, [st], getItemDef, RULES.burden.backpackSlots);
  if (!r.taken.length) return false;
  s.backpack = r.next;
  countPickup(s, r.taken.length);
  noteRelicPicked(s, st.itemId);
  s.pendingPickup = s.pendingPickup.filter((_, i) => i !== index);
  return true;
}

// 放弃拾取: 指定一件, 或(省略 index)全部放弃。
export function abandonPending(s: ExploreState, index?: number): boolean {
  if (!s.pendingPickup.length) return false;
  if (index == null) {
    const next = s.pendingPickup.filter((st) => getItemDef(st.itemId).undroppable);
    if (next.length === s.pendingPickup.length) return false;
    s.pendingPickup = next;
    return true;
  }
  const st = s.pendingPickup[index];
  if (!st || getItemDef(st.itemId).undroppable) return false;
  s.pendingPickup = s.pendingPickup.filter((_, i) => i !== index);
  return true;
}

// 传送投递口(设计文档 §6.5): 把选中的物品提前寄回据点, 安全落袋, 不受后续团灭影响。
// ★ 代价按**一次寄件**收, 不按件数收 —— 否则玩家会为了省能量只寄一件, 解压阀就失效了。
export function shipHome(s: ExploreState, uids: string[]): boolean {
  if (!s.chuteOpen || !uids.length) return false;
  const picked = uids
    .map((u) => findByUid(s.backpack, u))
    .filter((x): x is ItemStack => !!x && canShipHome(x, getItemDef(x.itemId)));
  if (!picked.length) return false;

  for (const st of picked) s.backpack = removeByUid(s.backpack, st.uid);
  s.shipped = [...s.shipped, ...picked];
  changeEnergy(s, -EXPLORE_RULES.chute.energyCost);
  s.chuteOpen = false; // 一次交互只能寄一次
  logLine(s, `投递口寄回 ${picked.length} 件 · 净化粒子 −${EXPLORE_RULES.chute.energyCost}`);
  return true;
}
