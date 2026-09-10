// ★ 遗物候选面板 ★ —— 「拾取遗物」开箱后的三选一。
//
// 版式对齐卡牌三选一: 候选并排居中、一件一格、点哪件就拿哪件, 不做放弃出口
// (放弃在后面的拾取框里还有一次机会, 这里再给一个只会让人反复确认)。
// 遗物的具体效果不写进按钮文案, 而是鼠标悬浮出完整的物品详情浮卡。
import { useEffect, useState } from "react";
import { getItemDef } from "@/data";
import type { ItemStack } from "@/items/types";
import ItemSlot from "@/ui/common/item/ItemSlot";
import ItemTooltip, {
  tooltipPointFromElement,
  type TooltipPoint,
} from "@/ui/common/item/ItemTooltip";
import { inventoryThemeVars } from "@/ui/common/item/inventoryTheme";
import {
  EventPanelBody,
  EventPanelFoot,
  EventPanelNotice,
  EventPanelStage,
} from "@/ui/common/EventPanel";
import { EXPLORE_BACKPACK_COLORS } from "@/ui/explore/styles/inventoryPalettes";
import s from "./RelicOffers.module.css";

export default function RelicOffers({
  offers,
  onPick,
}: {
  offers: ItemStack[];
  onPick: (index: number) => void;
}) {
  const [hovered, setHovered] = useState<{ uid: string; point: TooltipPoint } | null>(null);

  useEffect(() => {
    if (hovered && !offers.some((stack) => stack.uid === hovered.uid)) setHovered(null);
  }, [hovered, offers]);

  const hoveredStack = hovered
    ? offers.find((stack) => stack.uid === hovered.uid) ?? null
    : null;

  return (
    <EventPanelStage>
      <EventPanelBody caption="储备箱公开的祝福遗物候选，悬浮查看效果，选择一件放入拾取框。" scroll={false}>
        {offers.length ? (
          <div className={s["relic-list"]}>
            {offers.map((stack, index) => {
              const def = getItemDef(stack.itemId);
              return (
                <div
                  className={s["relic-choice"]}
                  key={stack.uid}
                  onPointerEnter={(event) =>
                    setHovered({
                      uid: stack.uid,
                      point: tooltipPointFromElement(event.currentTarget, "vertical"),
                    })
                  }
                  onPointerLeave={() =>
                    setHovered((current) => (current?.uid === stack.uid ? null : current))
                  }
                >
                  <ItemSlot
                    stack={stack}
                    showName={false}
                    showCount={false}
                    aria-label={def.name}
                    className={s["relic-slot"]}
                    onClick={() => onPick(index)}
                  />
                  <span className={s["relic-name"]}>{def.name}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <EventPanelNotice>当前没有可提供的遗物候选。</EventPanelNotice>
        )}
      </EventPanelBody>
      {hoveredStack && hovered && (
        <ItemTooltip
          stack={hoveredStack}
          point={hovered.point}
          themeStyle={inventoryThemeVars(EXPLORE_BACKPACK_COLORS)}
        />
      )}
      <EventPanelFoot note="选择一件即可完成拾取" />
    </EventPanelStage>
  );
}
