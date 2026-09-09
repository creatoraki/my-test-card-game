// 图标化报价标签 —— 「1:1 图标框 + 框外文字」的标准排法。
//
// ★ 边框由 ItemIconFrame 独占, 本组件只负责把文字排在框的**外面**:
//   框内一个字都没有, 名称/数量/持有量再长也撑不歪那个 1:1 的框。

import { getItemDef } from "@/data";
import { cx } from "@/ui/common/cx";
import ItemIconFrame from "@/ui/common/item/ItemIconFrame";
import s from "./ItemCostTag.module.css";

interface Props {
  itemId: string;
  count: number;
  owned?: number;
  size?: "sm" | "md" | "lg";
  showOwned?: boolean;
  compact?: boolean;
  className?: string;
}

export default function ItemCostTag({
  itemId,
  count,
  owned,
  size = "md",
  showOwned = false,
  compact = false,
  className,
}: Props) {
  const def = getItemDef(itemId);
  const short = owned != null && owned < count;
  const label = `${def.name} ×${count}${showOwned && owned != null ? `，持有 ${owned}，需 ${count}` : ""}`;

  return (
    <span
      className={cx(s.tag, s[`size-${size}`], compact && s.compact, short && s.short, className)}
      data-short={short || undefined}
      aria-label={label}
      role="group"
    >
      <ItemIconFrame
        itemId={itemId}
        size={compact ? "sm" : size}
        tone={short ? "short" : "rarity"}
        tooltip
      />
      {compact ? (
        <span className={s.compactCount}>×{count}</span>
      ) : (
        <span className={s.copy}>
          <span className={s.name}>{def.name} ×{count}</span>
          {showOwned && owned != null && <span className={s.owned}>持有 {owned} / 需 {count}</span>}
        </span>
      )}
    </span>
  );
}
