import { getItemDef, reforgeCheck, type CostCheck } from "@/data";
import type { ItemDef, ItemStack } from "@/items/types";

export interface ReforgeView {
  def: ItemDef | null;
  check: CostCheck;
  canRoll: boolean;
  notice: string;
}

export function useReforgeView(stack: ItemStack | null, storage: ItemStack[]): ReforgeView {
  const def = stack ? getItemDef(stack.itemId) : null;
  const check = reforgeCheck(def, storage);
  const canRoll = Boolean(stack && def?.category === "equipment" && def.affinityRollable && check.ok);

  let notice = "选择一件装备重掷它的羁绊。";
  if (stack && def?.affinityRollable) {
    notice = "重铸只重掷羁绊词条，属性词条不变；材料在掷出时即扣除。";
  }

  return { def, check, canRoll, notice };
}
