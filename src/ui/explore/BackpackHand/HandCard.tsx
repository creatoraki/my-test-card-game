// 手牌背包里的一张物品卡 —— ItemTile 竖版卡 + 「可点击」提示 + 交互中的操作卡。
// 横向位置与层级全由 CSS 读 --i 算(见 BackpackHand.module.css), 这里只注入序号。

import { useRef, type CSSProperties, type FocusEvent } from "react";
import type { ItemStack } from "@/items/types";
import ItemTile from "@/ui/common/item/ItemTile";
import type { SlotAction } from "@/ui/common/item/ItemActionMask";
import { ItemActionCard } from "@/ui/common/item/ItemActionCard";
import { InteractiveHint } from "@/ui/common/tooltip/InteractiveHint";
import s from "./BackpackHand.module.css";

interface Props {
  stack: ItemStack;
  index: number;
  /** 阶段允许动背包时才给「可点击」提示。 */
  hint: boolean;
  /** 非空 = 本卡正处于交互模式, 上方浮出操作卡。 */
  actions: readonly SlotAction[] | null;
  onClick: () => void;
  onDismiss: () => void;
  onEnter: (element: HTMLDivElement) => void;
  onLeave: () => void;
  onCardEnter: () => void;
  onCardLeave: () => void;
}

export function HandCard({
  stack,
  index,
  hint,
  actions,
  onClick,
  onDismiss,
  onEnter,
  onLeave,
  onCardEnter,
  onCardLeave,
}: Props) {
  const anchorRef = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={anchorRef}
      className={s.card}
      style={{ "--i": index } as CSSProperties}
      data-inventory-uid={stack.uid}
      data-active={actions ? "true" : undefined}
      {...(hint && !actions ? { "data-interactive-hint": "" } : null)}
      onPointerEnter={(event) => onEnter(event.currentTarget)}
      onPointerLeave={onLeave}
      onFocus={(event: FocusEvent<HTMLDivElement>) => onEnter(event.currentTarget)}
      onBlur={(event: FocusEvent<HTMLDivElement>) => {
        // 焦点只是在卡内, 或移进本卡的操作卡时不算离开。
        const next = event.relatedTarget as Element | null;
        if (event.currentTarget.contains(next) || next?.closest("[data-item-action-card]")) return;
        onLeave();
      }}
    >
      <ItemTile stack={stack} selected={Boolean(actions)} onClick={onClick} className={s.tile} />
      {hint && !actions && <InteractiveHint className={s.hint} />}
      {actions && (
        <ItemActionCard
          stack={stack}
          actions={actions}
          anchorRef={anchorRef}
          onDismiss={onDismiss}
          onPointerEnter={onCardEnter}
          onPointerLeave={onCardLeave}
        />
      )}
    </div>
  );
}
