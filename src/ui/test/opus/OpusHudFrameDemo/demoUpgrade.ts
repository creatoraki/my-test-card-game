// demo 内的升阶结算 —— 只改本地 state, 不写存档。
// 流程与 store/equipCraftSlice.ts 的 upgradeEquip 一致: 校验 → 掷新 roll → 扣材料与积分。
// 这样点下去的结果一定落在右列展示的区间内, 可以直接用来验区间算得对不对。

import { getItemDef, itemRegionId, nextEquipDef, upgradeCheck, upgradeRecipe } from "@/data";
import { consumeItems } from "@/items/inventory";
import { AFFIX_SCALE, upgradeEquipment } from "@/items/equipRoll";
import type { ItemStack } from "@/items/types";
import { STAT_LABEL } from "@/ui/common/item/ItemDetail";
import { signedValue } from "./upgradeRange";
import type { DemoEquip } from "./demoData";

export interface DemoState {
  equips: DemoEquip[];
  storage: ItemStack[];
  loot: number;
}

export interface DemoUpgradeResult {
  state: DemoState;
  message: string;
}

const randomPick = (size: number) => Math.floor(Math.random() * size);

export function applyDemoUpgrade(state: DemoState, uid: string): DemoUpgradeResult | null {
  const entry = state.equips.find((item) => item.stack.uid === uid);
  const roll = entry?.stack.roll;
  if (!entry || !roll) return null;

  const def = getItemDef(entry.stack.itemId);
  const nextDef = nextEquipDef(def);
  if (!nextDef?.model || !nextDef.slot) return null;

  const check = upgradeCheck(nextDef, state.loot, state.storage);
  const recipe = upgradeRecipe(nextDef.slot, nextDef.rarity, itemRegionId(nextDef));
  if (!recipe || !check.ok) return null;

  const nextRoll = upgradeEquipment(roll, nextDef, randomPick);
  const nextStack: ItemStack = { ...entry.stack, itemId: nextDef.id, roll: nextRoll };

  // 变动明细: 只列真正动了的词条, 没动的不刷屏。
  const changes = Object.entries(nextRoll.points)
    .map(([stat, points]) => {
      const key = stat as keyof typeof AFFIX_SCALE;
      const scale = AFFIX_SCALE[key] ?? 1;
      const before = (roll.points[key] ?? 0) * scale;
      const after = (points ?? 0) * scale;
      if (before === after) return null;
      return `${STAT_LABEL[key] ?? stat} ${signedValue(before)} → ${signedValue(after)}`;
    })
    .filter((text): text is string => text !== null);

  return {
    state: {
      equips: state.equips.map((item) =>
        item.stack.uid === uid ? { ...item, stack: nextStack } : item,
      ),
      storage: recipe.materials.reduce(
        (storage, material) => consumeItems(storage, material.itemId, material.count),
        state.storage,
      ),
      loot: state.loot - recipe.loot,
    },
    message: `升阶成功 · ${nextDef.name}（${changes.join("，") || "无词条变化"}）`,
  };
}
