import { useEffect, useState } from "react";
import { getItemDef } from "@/data";
import type { ItemStack } from "@/items/types";
import ItemTooltip, { tooltipPointFromElement, type TooltipPoint } from "@/ui/common/item/ItemTooltip";
import ItemSlot from "@/ui/common/item/ItemSlot";
import { EventPanelBody, EventPanelButton, EventPanelFoot, EventPanelStage } from "@/ui/common/EventPanel";
import { inventoryThemeVars } from "@/ui/common/item/inventoryTheme";
import { EXPLORE_BACKPACK_COLORS } from "@/ui/explore/styles/inventoryPalettes";
import s from "./CurioOfferView.module.css";

export function CurioOfferView({
  backpack,
  objectId,
  onSubmit,
  onBack,
}: {
  backpack: ItemStack[];
  objectId: string;
  onSubmit: (picks: { uid: string; count: number }[]) => void;
  onBack: () => void;
}) {
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [hovered, setHovered] = useState<{ stack: ItemStack; point: TooltipPoint } | null>(null);

  useEffect(() => {
    setPicks({});
    setHovered(null);
  }, [objectId]);

  const selected = backpack.filter((stack) => (picks[stack.uid] ?? 0) > 0);
  const change = (stack: ItemStack, delta: number) => {
    setPicks((current) => {
      const next = Math.max(0, Math.min(stack.count, (current[stack.uid] ?? 0) + delta));
      const copy = { ...current };
      if (next) copy[stack.uid] = next;
      else delete copy[stack.uid];
      return copy;
    });
  };

  return (
    <EventPanelStage>
      <EventPanelBody
        caption="选择背包里的物品。只有种类和数量完全符合条件时，物件才会给出回应；放错的物品会被吞掉。"
        className={s.body}
      >
        <div className={s.grid}>
          {backpack.map((stack) => {
            const count = picks[stack.uid] ?? 0;
            return <div
              key={stack.uid}
              className={`${s.item} ${count ? s.selected : ""}`}
              onPointerEnter={(event) => setHovered({ stack, point: tooltipPointFromElement(event.currentTarget, "left") })}
              onPointerLeave={() => setHovered((current) => current?.stack.uid === stack.uid ? null : current)}
            >
              <ItemSlot
                stack={stack}
                selected={Boolean(count)}
                aria-label={`选择${getItemDef(stack.itemId).name}`}
                onClick={() => change(stack, count ? 0 : 1)}
              />
              {count > 0 && <div className={s.counter}>
                <button type="button" aria-label="减少数量" onClick={() => change(stack, -1)}>−</button>
                <span>{count} / {stack.count}</span>
                <button type="button" aria-label="增加数量" onClick={() => change(stack, 1)}>＋</button>
              </div>}
            </div>;
          })}
        </div>
        <div className={s.offered}>
          <span>已放入区</span>
          {selected.length ? selected.map((stack) => <b key={stack.uid}>{getItemDef(stack.itemId).name} ×{picks[stack.uid]}</b>) : <em>尚未选择物品</em>}
        </div>
      </EventPanelBody>
      <EventPanelFoot note={selected.length ? "数量已锁定，放入后物品将离开背包" : "请选择至少一件物品"}>
        <EventPanelButton tone="primary" disabled={!selected.length} onClick={() => onSubmit(
          selected.map((stack) => ({ uid: stack.uid, count: picks[stack.uid] })),
        )}>放进去</EventPanelButton>
        <EventPanelButton onClick={onBack}>返回</EventPanelButton>
      </EventPanelFoot>
      {hovered && <ItemTooltip stack={hovered.stack} point={hovered.point} themeStyle={inventoryThemeVars(EXPLORE_BACKPACK_COLORS)} />}
    </EventPanelStage>
  );
}
