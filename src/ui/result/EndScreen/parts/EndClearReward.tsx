// 通关奖励 —— 结算页里唯一「额外送的」那份东西, 用金色奖励卡单独托出来,
// 不和带回物资网格混在一起看。物品会同时出现在下方网格里(已随背包带回)。

import { useState, type CSSProperties } from "react";
import { getItemDef } from "@/data";
import type { ItemStack } from "@/items/types";
import ItemSlot from "@/ui/common/item/ItemSlot/ItemSlot";
import ItemTooltip, { tooltipPointFromElement, type TooltipPoint } from "@/ui/common/item/ItemTooltip";
import s from "./EndClearReward.module.css";

function groupStacks(stacks: ItemStack[]): ItemStack[] {
  const grouped = new Map<string, ItemStack>();
  for (const stack of stacks) {
    const existing = grouped.get(stack.itemId);
    // 装备/遗物带词条, 不合并; 只把同种可堆叠物合成一格。
    if (existing && !stack.roll) existing.count += stack.count;
    else grouped.set(stack.roll ? stack.uid : stack.itemId, { ...stack });
  }
  return [...grouped.values()];
}

export function EndClearReward({ stacks }: { stacks: ItemStack[] }) {
  const [hovered, setHovered] = useState<{ stack: ItemStack; point: TooltipPoint } | null>(null);
  if (!stacks.length) return null;
  const items = groupStacks(stacks);

  return (
    <section className={s.reward} aria-label="通关奖励">
      <span className={s.shine} aria-hidden="true" />
      <header className={s.head}>
        <span className={s.kicker}>任务完成</span>
        <strong className={s.heading}>通关奖励</strong>
        <span className={s.note}>已随物资带回</span>
      </header>
      <ul className={s.items}>
        {items.map((stack, index) => {
          const item = getItemDef(stack.itemId);
          return (
            <li
              key={stack.uid}
              className={s.entry}
              style={{ "--i": index } as CSSProperties}
              onPointerEnter={(event) =>
                setHovered({ stack, point: tooltipPointFromElement(event.currentTarget, "right") })
              }
              onPointerLeave={() => setHovered((current) => (current?.stack.uid === stack.uid ? null : current))}
            >
              <ItemSlot
                stack={stack}
                className={s.slot}
                showName={false}
                aria-label={`${item.name} ×${stack.count}`}
              />
              <span className={s.name}>{item.name}</span>
            </li>
          );
        })}
      </ul>
      {hovered && <ItemTooltip key={hovered.stack.uid} stack={hovered.stack} point={hovered.point} />}
    </section>
  );
}
