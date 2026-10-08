import { getBondDef, getItemDef } from "@/data";
import type { BondDef } from "@/data/roster/bonds";
import type { ItemStack } from "@/items/types";

/** 物品实例的羁绊: 实例重铸过的词条优先, 否则取物品定义自带的。 */
export function stackBond(stack: ItemStack): BondDef | undefined {
  return getBondDef(stack.affinity ?? getItemDef(stack.itemId).affinity ?? "");
}
