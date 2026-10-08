// 「属性装备」页上半: 3 列(武器 / 防具 / 饰品) × 2 行(主 / 副)装备卡 + 点开后的背包候选浮层。
// ★ 副格随卡组等级解锁, 未解锁的显示锁卡。
// ★ 候选悬停通过 onPreview 把假设穿戴交给属性面板做差值预览。
import { useState } from "react";
import { getItemDef } from "@/data";
import { GEAR_ROWS, GEAR_SLOT_KIND, gearSlotUnlocked, type GearSet, type GearSlot } from "@/items/gearSlots";
import type { EquipSlot, ItemStack } from "@/items/types";
import { EquipCard, LockedEquipCard } from "./EquipCard";
import { EquipPicker } from "./EquipPicker";
import s from "./EquipRow.module.css";

interface Props {
  /** 卡组等级, 决定副格是否解锁。 */
  level: number;
  equipped: GearSet;
  /** 背包里的全部装备。 */
  candidates: ItemStack[];
  lockedReason?: string;
  /** 从背包点「装备」进来时, 高亮该部位的已解锁格。 */
  highlightedKind?: EquipSlot;
  onEquip: (uid: string, slot: GearSlot) => void;
  onUnequip: (slot: GearSlot) => void;
  onPreview: (preview: { slot: GearSlot; stack: ItemStack } | null) => void;
  onShowTooltip: (element: HTMLElement, stack: ItemStack) => void;
  onHideTooltip: () => void;
}

export function EquipRow({
  level,
  equipped,
  candidates,
  lockedReason,
  highlightedKind,
  onEquip,
  onUnequip,
  onPreview,
  onShowTooltip,
  onHideTooltip,
}: Props) {
  const [open, setOpen] = useState<{ slot: GearSlot; anchor: HTMLElement } | null>(null);

  const close = () => {
    onHideTooltip();
    onPreview(null);
    setOpen(null);
  };

  return (
    <div className={s.row}>
      {GEAR_ROWS.flatMap(({ slots }) => slots).map((slot) =>
        gearSlotUnlocked(slot, level) ? (
          <EquipCard
            key={slot}
            slot={slot}
            stack={equipped[slot] ?? null}
            active={open?.slot === slot}
            highlighted={!lockedReason && highlightedKind === GEAR_SLOT_KIND[slot]}
            onOpen={(anchor) => setOpen((current) => (current?.slot === slot ? null : { slot, anchor }))}
            onShowTooltip={onShowTooltip}
            onHideTooltip={onHideTooltip}
          />
        ) : (
          <LockedEquipCard key={slot} slot={slot} />
        ),
      )}

      {open && (
        <EquipPicker
          slot={open.slot}
          anchor={open.anchor}
          candidates={candidates.filter((stack) => getItemDef(stack.itemId).slot === GEAR_SLOT_KIND[open.slot])}
          hasEquipped={Boolean(equipped[open.slot])}
          lockedReason={lockedReason}
          onEquip={(uid) => onEquip(uid, open.slot)}
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
