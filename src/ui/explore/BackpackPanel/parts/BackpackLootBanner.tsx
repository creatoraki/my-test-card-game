import type { WheelEvent } from "react";
import { getItemDef } from "@/data";
import { stackSlots } from "@/items/inventory";
import type { ItemStack } from "@/items/types";
import { useExploreStore } from "@/store/explore/exploreStore";
import { playSfx } from "@/ui/audio";
import ItemSlot from "@/ui/common/item/ItemSlot";
import { EventPanelButton } from "@/ui/common/widget/EventPanel";
import s from "./BackpackLootBanner.module.css";

/**
 * 背包面板顶部的「拾取框」横幅: 事件 / 掉落还有没拿走的物品时出现。
 * 背包满时玩家在这里边腾格子(放回拾取框)边拿取, 不用来回切面板。
 */
export function BackpackLootBanner({ loot, free }: { loot: ItemStack[]; free: number }) {
  const takeLoot = useExploreStore((state) => state.takeLoot);

  const take = (index: number) => {
    if (takeLoot(index)) playSfx("pickup");
  };

  // 物品多了横向滚动, 竖向滚轮也换成横向。
  const onWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    event.currentTarget.scrollLeft += event.deltaY;
  };

  return (
    <div className={s.banner}>
      <span className={s.label}>
        拾取框 <b>{loot.length}</b> 件 —— 腾出格子后可直接拿取，空余 {Math.max(0, free)} 格
      </span>
      <div className={s.row} onWheel={onWheel}>
        {loot.map((stack, index) => {
          const need = stackSlots(stack, getItemDef(stack.itemId));
          const ok = need <= free;
          return (
            <div className={s.item} key={stack.uid}>
              <ItemSlot stack={stack} showName={false} />
              <EventPanelButton
                tone="primary"
                className={s.take}
                disabled={!ok}
                onClick={() => take(index)}
              >
                {ok ? "拿取" : `差 ${need - free} 格`}
              </EventPanelButton>
            </div>
          );
        })}
      </div>
    </div>
  );
}
