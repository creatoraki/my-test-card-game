// 「属性装备」页上半: 武器 / 防具 / 饰品三张大装备卡 + 点开后的背包候选浮层。
// ★ 候选悬停通过 onPreview 把假设穿戴交给属性面板做差值预览。
import { useState } from "react";
import { getItemDef } from "@/data";
import type { EquipSlot, ItemStack } from "@/items/types";
import { EquipCard } from "./EquipCard";
import { EquipPicker } from "./EquipPicker";
import s from "./EquipRow.module.css";

const SLOTS: EquipSlot[] = ["weapon", "armor", "trinket"];

interface Props {
  equipped: Record<EquipSlot, ItemStack | null>;
  /** 背包里的全部装备。 */
  candidates: ItemStack[];
  lockedReason?: string;
  highlightedSlot?: EquipSlot;
  onEquip: (uid: string) => void;
  onUnequip: (slot: EquipSlot) => void;
  onPreview: (preview: { slot: EquipSlot; stack: ItemStack } | null) => void;
  onShowTooltip: (element: HTMLElement, stack: ItemStack) => void;
  onHideTooltip: () => void;
}

export function EquipRow({
  equipped,
  candidates,
  lockedReason,
  highlightedSlot,
  onEquip,
  onUnequip,
  onPreview,
  onShowTooltip,
  onHideTooltip,
}: Props) {
  const [open, setOpen] = useState<{ slot: EquipSlot; anchor: HTMLElement } | null>(null);

  const close = () => {
    onHideTooltip();
    onPreview(null);
    setOpen(null);
  };

  return (
    <div className={s.row}>
      {SLOTS.map((slot) => (
        <EquipCard
          key={slot}
          slot={slot}
          stack={equipped[slot]}
          active={open?.slot === slot}
          highlighted={!lockedReason && highlightedSlot === slot}
          onOpen={(anchor) => setOpen((current) => (current?.slot === slot ? null : { slot, anchor }))}
          onShowTooltip={onShowTooltip}
          onHideTooltip={onHideTooltip}
        />
      ))}

      {open && (
        <EquipPicker
          slot={open.slot}
          anchor={open.anchor}
          candidates={candidates.filter((stack) => getItemDef(stack.itemId).slot === open.slot)}
          hasEquipped={Boolean(equipped[open.slot])}
          lockedReason={lockedReason}
          onEquip={onEquip}
          onUnequip={() => onUnequip(open.slot)}
          onHoverCandidate={(element, stack) => {
            if (element && stack) {
              onShowTooltip(element, stack);
              onPreview({ slot: open.slot, stack });
            } else {
              onHideTooltip();
              onPreview(null);
            }
          }}
          onClose={close}
        />
      )}
    </div>
  );
}
