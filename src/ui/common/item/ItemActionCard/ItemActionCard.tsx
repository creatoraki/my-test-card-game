// 物品「操作卡」—— 点击物品格后浮在格子**正上方**的小卡片: 图标 + 名称 + 稀有度 + 说明 + 横排操作按钮。
//
// 与格内遮罩(ItemActionMask)同一份 SlotAction 数据, 只是换了呈现: 格子太小时遮罩里竖排按钮
// 挤成一团, 操作卡把按钮挪到格外, 还顺带把「这是什么」讲清楚。
// 挂在设计画布内部(与 ItemTooltip 同一套定位: tooltipPointFromElement + useTooltipPlacement),
// 贴近画布边缘时左右夹紧, 底部小三角始终指着格子中心。
// 关闭: 点卡片与格子以外的地方 / Esc / 鼠标离开格子与卡片(由 useSlotActionMode 做宽限)。

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type RefObject } from "react";
import { createPortal } from "react-dom";
import { getItemDef } from "@/data";
import { CATEGORY_LABEL, RARITY_LABEL, type ItemStack } from "@/items/types";
import ItemIconFrame from "@/ui/common/item/ItemIconFrame";
import type { SlotAction } from "@/ui/common/item/ItemActionMask";
import {
  tooltipPointFromElement,
  tooltipStyle,
  useTooltipPlacement,
  type TooltipPoint,
} from "@/ui/common/item/ItemTooltip";
import { ItemActionButton } from "./ItemActionButton";
import s from "./ItemActionCard.module.css";

interface Props {
  stack: ItemStack;
  actions: readonly SlotAction[];
  /** 物品格的包裹层 —— 定位锚点, 也算作「卡片内部」不触发外部点击关闭。 */
  anchorRef: RefObject<HTMLElement | null>;
  onDismiss: () => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
}

export function ItemActionCard(props: Props) {
  const anchor = props.anchorRef.current;
  if (!anchor) return null;
  return <PlacedCard {...props} anchor={anchor} />;
}

function PlacedCard({
  stack,
  actions,
  anchor,
  onDismiss,
  onPointerEnter,
  onPointerLeave,
}: Props & { anchor: HTMLElement }) {
  const ref = useRef<HTMLDivElement>(null);
  const [point] = useState<TooltipPoint>(() => tooltipPointFromElement(anchor, "top"));
  const placement = useTooltipPlacement(point, ref);
  const [confirming, setConfirming] = useState<string | null>(null);
  const def = getItemDef(stack.itemId);
  const hints = actions.filter((action) => action.disabled && action.hint).map((action) => action.hint!);

  // 点卡片与格子以外的任何地方都收起。pointerdown 而非 click: 点另一格时先收起这张, 再由那一格的 click 打开新的。
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target || ref.current?.contains(target) || anchor.contains(target)) return;
      onDismiss();
    };
    window.addEventListener("pointerdown", outside, true);
    return () => window.removeEventListener("pointerdown", outside, true);
  }, [anchor, onDismiss]);

  const fire = (event: MouseEvent<HTMLButtonElement>, action: SlotAction) => {
    event.stopPropagation();
    if (action.confirmLabel && confirming !== action.key) {
      setConfirming(action.key);
      return;
    }
    setConfirming(null);
    action.onSelect();
    // 动作执行完就收起: 装载 / 拆箱会接着拉起弹窗, 卡片不该还挂在下面。
    onDismiss();
  };

  // 三角指向格子中心: 卡片被左右夹紧后, 三角要跟着偏回锚点。
  const arrowX = placement.ready ? point.x - placement.left : 0;

  return createPortal(
    <div
      ref={ref}
      className={s.card}
      style={{
        ...tooltipStyle(placement),
        "--rr": `var(--rarity-${def.rarity})`,
        "--arrow-x": `${arrowX}px`,
      } as CSSProperties}
      data-item-action-card=""
      role="dialog"
      aria-label={`${def.name}的操作`}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onClick={(event) => event.stopPropagation()}
    >
      <div className={s.panel}>
        <span className={s.accent} aria-hidden />
        <header className={s.head}>
          <ItemIconFrame itemId={stack.itemId} size="md" />
          <div className={s.meta}>
            <strong className={s.name}>
              {def.name}
              {stack.count > 1 && <span className={s.count}>×{stack.count}</span>}
            </strong>
            <span className={s.tags}>
              <span className={s.rarity}>{RARITY_LABEL[def.rarity]}</span>
              <span className={s.dot} aria-hidden>·</span>
              <span>{CATEGORY_LABEL[def.category]}</span>
            </span>
          </div>
        </header>
        {def.desc && <p className={s.desc}>{def.desc}</p>}
        <div className={s.actions}>
          {actions.map((action, index) => {
            const armed = confirming === action.key;
            return (
              <ItemActionButton
                key={action.key}
                block
                order={index}
                label={armed && action.confirmLabel ? action.confirmLabel : action.label}
                tone={action.tone ?? "default"}
                icon={action.icon}
                armed={armed}
                disabled={action.disabled}
                onClick={(event) => fire(event, action)}
              />
            );
          })}
        </div>
        {hints.length > 0 && <p className={s.hint}>{hints.join("；")}</p>}
      </div>
      <span className={s.arrow} aria-hidden />
    </div>,
    point.host,
  );
}
