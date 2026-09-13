import { getItemDef } from "@/data";
import type { ItemStack } from "@/items/types";
import ItemSlot from "@/ui/common/item/ItemSlot/ItemSlot";
import s from "./EndClearReward.module.css";

export function EndClearReward({ stacks }: { stacks: ItemStack[] }) {
  if (!stacks.length) return null;
  const grouped = stacks.reduce<Record<string, ItemStack>>((result, stack) => {
    const existing = result[stack.itemId];
    if (existing) existing.count += stack.count;
    else result[stack.itemId] = { ...stack };
    return result;
  }, {});

  return (
    <section className={s.reward} aria-label="今日通关奖励">
      <strong className={s.heading}>今日通关奖励</strong>
      <div className={s.items}>
        {Object.values(grouped).map((stack) => {
          const item = getItemDef(stack.itemId);
          return (
            <ItemSlot
              key={stack.uid}
              stack={stack}
              className={s.slot}
              showName={false}
              aria-label={`${item.name} ×${stack.count}`}
            />
          );
        })}
      </div>
    </section>
  );
}
