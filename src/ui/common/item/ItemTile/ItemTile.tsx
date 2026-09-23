// 物品卡 —— 商店回收台(默认模式)与仓库(紧缩模式)用的竖版科幻卡面。
// 与 ItemSlot 分开: ItemSlot 是背包/战斗等 20+ 处共用的小格子, 这里是陈列用的大卡。
// 稀有度配色读 styles/tokens.css 的 --rarity-* 令牌; 图标靠 stroke="currentColor"
// 吃 color: var(--rr) 染色(与 ItemSlot 同一套契约)。
//
// 结构: 外层 button 的底色即描边色, .face 内缩 2px 盖住, 于是斜切角处也有完整描边;
//       .inner 细内框用同样的双层手法。选中只变色, 不改外形、不加外框。

import type { MouseEvent } from "react";
import { getBondDef, getItemDef } from "@/data";
import type { ItemStack } from "@/items/types";
import { itemIcon } from "@/ui/art/items/itemArt";
import { BondIcon } from "@/ui/common/bond/BondIcon";
import { cx } from "@/ui/common/shared/cx";
import { ItemTileBand } from "./ItemTileBand";
import s from "./ItemTile.module.css";

export type ItemTileVariant = "default" | "compact";

interface Props {
  stack: ItemStack;
  /** default: 竖版卡, 显示名称; compact: 1:1, 不显示名称。 */
  variant?: ItemTileVariant;
  selected?: boolean;
  disabled?: boolean;
  /** 图鉴未收录条目：保留相同格子外框，隐藏物品图案与稀有度。 */
  locked?: boolean;
  "aria-label"?: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** 调用方的布局类。卡面外观一律由本组件持有。 */
  className?: string;
}

export default function ItemTile({
  stack,
  variant = "default",
  selected,
  disabled,
  locked = false,
  "aria-label": ariaLabel,
  onClick,
  className,
}: Props) {
  const def = getItemDef(stack.itemId);
  const bond = getBondDef(stack.affinity ?? def.affinity ?? "");
  const compact = variant === "compact";

  return (
    <button
      type="button"
      className={cx(
        s.tile,
        s[`r-${locked ? "common" : def.rarity}`],
        compact && s["is-compact"],
        selected && s["is-selected"],
        locked && s.locked,
        className,
      )}
      aria-label={ariaLabel ?? def.name}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
    >
      <span className={s.face} aria-hidden="true" />
      <span className={s.inner} aria-hidden="true" />

      {!locked && <span className={s.badge}>
        {bond && <BondIcon bondId={bond.id} className={s.bond} />}
        <span className={s.tag} aria-hidden="true">ITEM</span>
      </span>}

      <span className={s.art} aria-hidden="true">{locked ? "？" : itemIcon(def)}</span>

      {!compact && <span className={s.name}>{locked ? "未收录" : def.name}</span>}

      {!locked && stack.disposable && (
        <span className={s.disposable} aria-hidden="true">弃</span>
      )}
      {!locked && stack.count > 1 && <span className={s.count}>×{stack.count}</span>}

      {!locked && <ItemTileBand rarity={def.rarity} />}
    </button>
  );
}
