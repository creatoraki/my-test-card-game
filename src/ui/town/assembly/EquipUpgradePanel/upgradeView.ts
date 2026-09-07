import { getItemDef, nextEquipDef, upgradeCheck, type CostCheck } from "@/data";
import type { ItemDef, ItemStack } from "@/items/types";
import { upgradeRangePreview, type UpgradeRangePreview } from "./upgradeRange";

export interface UpgradeView {
  currentDef: ItemDef | null;
  nextDef: ItemDef | null;
  check: CostCheck | null;
  preview: UpgradeRangePreview | null;
  notice: string;
  canUpgrade: boolean;
}

export function useUpgradeView(stack: ItemStack | null, loot: number, storage: ItemStack[]): UpgradeView {
  const currentDef = stack ? getItemDef(stack.itemId) : null;
  const nextDef = currentDef?.category === "equipment" ? nextEquipDef(currentDef) : null;
  const check = nextDef ? upgradeCheck(nextDef, loot, storage) : null;
  const preview = nextDef && stack?.roll ? upgradeRangePreview(nextDef, stack.roll) : null;
  const canUpgrade = Boolean(stack?.roll && nextDef?.model && check?.ok);

  let notice = "选择一件装备查看升阶预览。";
  if (stack && !stack.roll) notice = "这件装备没有可用词条模型，无法升阶。";
  else if (stack && !nextDef) notice = "这件装备已达到本族最高阶。";
  else if (nextDef) notice = "升阶保留原有词条，并在此基础上追加新的模型值预算。";

  return { currentDef, nextDef, check, preview, notice, canUpgrade };
}