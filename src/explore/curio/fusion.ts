import { BLESSING_RELIC_DEFS, equipmentDefsBySlot, getItemDef, makeRolledItemStack } from "@/data";
import { RARITY_ORDER } from "@/items/types";
import { rngInt, shuffle } from "@/engine/core/rng";
import type { ItemStack } from "@/items/types";
import { addPendingLoot } from "../session";
import type { ExploreState } from "../types";

export function fuseEquipment(s: ExploreState, offered: ItemStack[]): string {
  const equipment = offered.filter((stack) => getItemDef(stack.itemId).category === "equipment");
  if (equipment.length !== 3) return "熔铸失败";
  const highest = Math.max(
    ...equipment.map((stack) => RARITY_ORDER.indexOf(getItemDef(stack.itemId).rarity)),
  );
  const targetRarity = RARITY_ORDER[Math.min(RARITY_ORDER.length - 1, highest + 1)];
  const candidates = equipmentDefsBySlot().filter((def) => def.rarity === targetRarity && def.model);
  if (!candidates.length) return "熔铸失败，装备池为空";
  const def = candidates[rngInt(s, candidates.length)];
  addPendingLoot(s, [makeRolledItemStack(s, def.id, 1)]);
  return `熔铸出${targetRarity === "legendary" ? "传说" : "更高阶"}装备，已放入待拾取框`;
}

export function upgradeRelic(s: ExploreState, offered: ItemStack[]): string {
  const source = offered.find((stack) => getItemDef(stack.itemId).relic?.polarity === "blessing");
  if (!source) return "没有可献上的祝福遗物";
  const sourceDef = getItemDef(source.itemId);
  const sourceRank = RARITY_ORDER.indexOf(sourceDef.rarity);
  const owned = new Set([
    ...s.ownedRelicIds,
    ...s.backpack
      .filter((stack) => stack.uid !== source.uid && getItemDef(stack.itemId).relic?.polarity === "blessing")
      .map((stack) => stack.itemId),
  ]);
  const higher = BLESSING_RELIC_DEFS.filter(
    (def) => RARITY_ORDER.indexOf(def.rarity) > sourceRank && !owned.has(def.id),
  );
  const same = BLESSING_RELIC_DEFS.filter(
    (def) => def.rarity === sourceDef.rarity && def.id !== source.itemId && !owned.has(def.id),
  );
  const candidates = higher.length ? higher : same;
  if (!candidates.length) {
    s.loot += 10;
    return "没有可交换的祝福遗物，折算居民积分 +10";
  }
  const def = shuffle(s, candidates)[0];
  addPendingLoot(s, [{ ...makeRolledItemStack(s, def.id, 1), disposable: source.disposable }]);
  return `获得${source.disposable ? "一次性" : ""}祝福遗物「${def.name}」，已放入待拾取框`;
}
