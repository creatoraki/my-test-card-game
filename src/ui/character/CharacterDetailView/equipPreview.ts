import type { StatBlock } from "@/engine";
import type { EquipSlot, ItemStack } from "@/items/types";
import { deriveStats, type CharacterState } from "@/store/townStore";

/** 把某个部位换成 stack 后的面板属性，沿用城镇实际穿戴的派生口径。 */
export function previewStatsWith(
  cs: CharacterState,
  slot: EquipSlot,
  stack: ItemStack | null,
): StatBlock {
  return deriveStats({
    ...cs,
    equipped: { ...cs.equipped, [slot]: stack },
  });
}

/** 只返回有可见变化的属性差值。 */
export function statDeltas(
  base: StatBlock,
  next: StatBlock,
): Array<{ key: keyof StatBlock; from: number; to: number; delta: number }> {
  return (Object.keys(base) as (keyof StatBlock)[])
    .map((key) => ({ key, from: base[key], to: next[key], delta: next[key] - base[key] }))
    .filter((row) => Math.abs(row.delta) >= 0.5);
}