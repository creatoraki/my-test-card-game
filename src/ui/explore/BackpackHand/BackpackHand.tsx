// 探索底栏的随身背包 —— 单排物品卡「手牌」: 左对齐从左往右排, 右边的卡压住左边的卡,
// 物品越多卡间距越小(纯 CSS 按 --n 计算, 见 BackpackHand.module.css)。
// 悬浮: 卡片上抬置顶 + 上方浮出物品详情; 点击: 上方浮出操作卡(与原格子背包同一套 SlotAction)。

import { memo, useEffect, useMemo, useState, type CSSProperties } from "react";
import type { ItemStack } from "@/items/types";
import { useExploreStore } from "@/store/explore/exploreStore";
import ItemTooltip, { tooltipPointFromElement, type TooltipPoint } from "@/ui/common/item/ItemTooltip";
import { useSlotActionMode } from "@/ui/common/item/ItemActionMask";
import { sortBySection } from "@/ui/common/item/shared/itemSections";
import { inventoryThemeVars } from "@/ui/common/item/shared/inventoryTheme";
import { EXPLORE_BACKPACK_COLORS } from "@/ui/explore/styles/inventoryPalettes";
import { HandCard } from "./HandCard";
import { useBackpackSlotActions } from "./useBackpackSlotActions";
import s from "./BackpackHand.module.css";

/** 悬浮上抬量(设计 px), 与 BackpackHand.module.css 的 --lift 保持一致; 详情浮层锚在上抬后的卡顶。 */
const HOVER_LIFT = 28;

const THEME = inventoryThemeVars(EXPLORE_BACKPACK_COLORS);

interface Hovered {
  uid: string;
  point: TooltipPoint;
}

export default memo(function BackpackHand({
  onUseItem,
}: {
  // 「使用」入口: 由 ExploreScreen 接手(目标类消耗品进入头像选择流程, 其余立即生效)。
  onUseItem?: (stack: ItemStack) => void;
}) {
  const backpack = useExploreStore((state) => state.session?.backpack);
  const { editable, slotActions, overlay } = useBackpackSlotActions(onUseItem);
  const ordered = useMemo(() => (backpack ? sortBySection(backpack) : []), [backpack]);
  const uids = useMemo(() => ordered.map((stack) => stack.uid), [ordered]);
  const actionMode = useSlotActionMode(uids);
  const [hovered, setHovered] = useState<Hovered | null>(null);

  useEffect(() => {
    if (hovered && !uids.includes(hovered.uid)) setHovered(null);
  }, [hovered, uids]);

  if (!backpack) return null;

  const activeStack = actionMode.activeUid ? ordered.find((stack) => stack.uid === actionMode.activeUid) ?? null : null;
  const activeList = activeStack && editable ? slotActions(activeStack) : null;
  const activeActions = activeList?.length ? activeList : null;
  // 操作卡已经把「这是什么」讲清楚了, 正在交互的那张不再叠悬浮详情。
  const hoveredStack = hovered && hovered.uid !== actionMode.activeUid
    ? ordered.find((stack) => stack.uid === hovered.uid) ?? null
    : null;

  const handleClick = (stack: ItemStack) => {
    // 阶段不允许动背包时不进交互模式 —— 亮了却点不动比不亮更糟。
    if (editable && slotActions(stack).length) actionMode.open(stack.uid);
  };

  return (
    <>
      <section
        id="explore-backpack-bar"
        className={s.hand}
        style={{ "--n": ordered.length } as CSSProperties}
        aria-label="随身背包"
      >
        {ordered.length === 0 && <p className={s.empty}>背包空空如也</p>}
        {ordered.map((stack, index) => (
          <HandCard
            key={stack.uid}
            stack={stack}
            index={index}
            hint={editable}
            actions={actionMode.activeUid === stack.uid ? activeActions : null}
            onClick={() => handleClick(stack)}
            onDismiss={actionMode.close}
            onEnter={(element) => {
              if (actionMode.activeUid === stack.uid) actionMode.keepOpen();
              const point = tooltipPointFromElement(element, "top");
              setHovered({ uid: stack.uid, point: { ...point, y: point.y - HOVER_LIFT } });
            }}
            onLeave={() => {
              setHovered((current) => (current?.uid === stack.uid ? null : current));
              actionMode.closeSoon(stack.uid);
            }}
            onCardEnter={actionMode.keepOpen}
            onCardLeave={() => actionMode.closeSoon(stack.uid)}
          />
        ))}
      </section>
      {hoveredStack && hovered && <ItemTooltip stack={hoveredStack} point={hovered.point} themeStyle={THEME} />}
      {overlay}
    </>
  );
});
