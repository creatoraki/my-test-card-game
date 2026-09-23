// 奖励生成 —— 装备 / 遗物候选、遗物投放与掉落摘要。事件效果与战斗结算共用。

import {
  BLESSING_RELIC_DEFS,
  equipmentDefsBySlot,
  getItemDef,
  getItemFamily,
  difficultyEquipRarities,
  makeRolledItemStack,
} from "@/data";
import { rngPick, shuffle } from "@/engine/core/rng";
import { pickByQuality } from "@/items/drops";
import type { EquipSlot, ItemRarity, ItemStack } from "@/items/types";
import type { ExploreState } from "../../types";
import { addPendingLoot } from "./backpack";
import { dropCoefficient, qualityWeights } from "./drops";

// 一批掉落 → 一句摘要, 同名合并计数(「废件 ×3 · 补焊装甲板 ×1」)。
export function summarizeItems(taken: ItemStack[], overflow: ItemStack[]): string {
  const count = new Map<string, number>();
  for (const st of taken) count.set(st.itemId, (count.get(st.itemId) ?? 0) + st.count);
  const parts = [...count].map(([id, n]) => `${getItemDef(id).name} ×${n}`);
  const head = parts.length ? `拾得 ${parts.join(" · ")}` : "背包已满, 什么都拿不下";
  return overflow.length ? `${head}（${overflow.length} 件背不动了）` : head;
}

export function summarizePendingItems(stacks: ItemStack[]): string {
  const count = new Map<string, number>();
  for (const st of stacks) count.set(st.itemId, (count.get(st.itemId) ?? 0) + st.count);
  const parts = [...count].map(([id, n]) => `${getItemDef(id).name} ×${n}`);
  return parts.length ? `待拾取 ${parts.join(" · ")}` : "待拾取物品";
}

export function deferEffectLoot(s: ExploreState, stacks: ItemStack[]): string {
  addPendingLoot(s, stacks);
  return `发现 ${summarizeItems(stacks, [])}，等待拾取`;
}

export function rollEquipOffers(s: ExploreState, count: number, slot?: EquipSlot): ItemStack[] {
  const familyIds = [
    ...new Set(
      equipmentDefsBySlot(slot)
        .map((def) => def.familyId)
        .filter((familyId): familyId is string => Boolean(familyId)),
    ),
  ];
  const allowedRarities = difficultyEquipRarities(s.mapId, s.difficulty);
  const weights = qualityWeights(dropCoefficient(s));
  return shuffle(s, familyIds)
    .slice(0, Math.max(0, count))
    .map((familyId) => {
      const family = getItemFamily(familyId);
      const eligible = family.filter((def) => allowedRarities.includes(def.rarity));
      const def = pickByQuality(s, eligible.length ? eligible : family, weights);
      return makeRolledItemStack(s, def.id, 1);
    });
}

export function grantRelic(s: ExploreState, relicId: string): string {
  const def = getItemDef(relicId);
  if (def.category !== "relic" || !def.relic) return "遗物投放失败";
  if (s.ownedRelicIds.includes(relicId) || s.pendingPickup.some((st) => st.itemId === relicId)) {
    s.loot += 10;
    return `遗物「${def.name}」已拥有，回落为居民积分 +10`;
  }
  s.pendingPickup = [...s.pendingPickup, makeRolledItemStack(s, relicId, 1)];
  return `获得遗物「${def.name}」，已放入待拾取框`;
}

// 遗物三选一的候选生成。★ 已拥有 / 已在待拾取或拾取框里的遗物一律排除 ——
//   候选里出现一件「拿了也只会折成积分」的遗物, 三选一就少了一个真选项。
export function rollRelicOffers(
  s: ExploreState,
  count: number,
  rarity?: ItemRarity,
  relicIds?: string[],
): ItemStack[] {
  const taken = new Set([
    ...s.ownedRelicIds,
    ...[...s.pendingPickup, ...s.pendingLoot]
      .filter((stack) => getItemDef(stack.itemId).category === "relic")
      .map((stack) => stack.itemId),
  ]);
  // 指名候选按给定顺序排, 不洗牌 —— 剧情箱子里三格的位置是设计好的。
  // 指名的三件恰好全被拿过时退回随机祝福遗物, 总比把面板开成空箱子强。
  const named = relicIds
    ?.map((id) => getItemDef(id))
    .filter((def) => def.category === "relic" && def.relic && !taken.has(def.id));
  const pool = named?.length
    ? named
    : shuffle(
        s,
        BLESSING_RELIC_DEFS.filter((def) => (!rarity || def.rarity === rarity) && !taken.has(def.id)),
      );
  return pool.slice(0, Math.max(0, count)).map((def) => makeRolledItemStack(s, def.id, 1));
}

export function randomRelicId(s: ExploreState, rarity?: ItemRarity): string | undefined {
  const pending = new Set(
    s.pendingPickup
      .filter((stack) => getItemDef(stack.itemId).category === "relic")
      .map((stack) => stack.itemId),
  );
  const candidates = BLESSING_RELIC_DEFS.filter(
    (def) => (!rarity || def.rarity === rarity) && !s.ownedRelicIds.includes(def.id) && !pending.has(def.id),
  );
  return candidates.length ? rngPick(s, candidates).id : undefined;
}
