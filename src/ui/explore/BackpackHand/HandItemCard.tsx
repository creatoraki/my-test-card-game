// 手牌背包专用的物品卡面 —— 金属卡框: 稀有度色竖向金属渐变作 3px 描边, 深色卡芯带顶亮底暗的斜面,
// 卡底投影。手牌里卡与卡至少压住一半, 所以左上角放「牌角索引」(小图标 + 数量), 被压住也读得到。
// 稀有度配色读 --rarity-* 令牌; 图标靠 stroke="currentColor" 吃 color: var(--rr)(与 ItemTile 同一套契约)。

import type { MouseEvent } from "react";
import { getItemDef } from "@/data";
import type { ItemStack } from "@/items/types";
import { itemIcon } from "@/ui/art/items/itemArt";
import { cx } from "@/ui/common/shared/cx";
import s from "./HandItemCard.module.css";

interface Props {
  stack: ItemStack;
  selected?: boolean;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}

export function HandItemCard({ stack, selected, onClick, className }: Props) {
  const def = getItemDef(stack.itemId);
  const icon = itemIcon(def);
  return (
    <button
      type="button"
      className={cx(s.card, s[`r-${def.rarity}`], selected && s["is-selected"], className)}
      aria-label={stack.count > 1 ? `${def.name}，数量 ${stack.count}` : def.name}
      aria-pressed={selected}
      onClick={onClick}
    >
      <span className={s.face} aria-hidden="true" />
      <span className={s.corner} aria-hidden="true">
        <span className={s.cornerIcon}>{icon}</span>
        {stack.count > 1 && <span className={s.count}>×{stack.count}</span>}
      </span>
      {stack.disposable && <span className={s.disposable} aria-hidden="true">弃</span>}
      <span className={s.art} aria-hidden="true">{icon}</span>
      <span className={s.name}>{def.name}</span>
      <span className={s.band} aria-hidden="true" />
    </button>
  );
}
