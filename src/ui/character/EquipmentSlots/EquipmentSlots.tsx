import { HoverTooltip, useHoverTooltip } from "@/ui/common/HoverTooltip";
import type { EquipSlot, ItemStack } from "@/items/types";
import { SLOT_LABEL } from "@/items/types";
import { EQUIP_SLOTS } from "@/store/townStore";
import ItemTooltip from "@/ui/common/item/ItemTooltip";
import ItemSlot from "@/ui/common/item/ItemSlot";
import { equipSlotIcon } from "@/ui/art/itemArt";
import { cx } from "@/ui/common/cx";
import s from "./EquipmentSlots.module.css";

interface Props {
  equipped: Record<EquipSlot, ItemStack | null>;
  activeSlot: EquipSlot | null;
  onSelect: (slot: EquipSlot) => void;
  onUnequip: (slot: EquipSlot) => void;
  className?: string;
}

export function EquipmentSlots({ equipped, activeSlot, onSelect, onUnequip, className }: Props) {
  return (
    <section className={cx(s["equipment-slots"], className)} aria-label="角色装备">
      <div className={s["equipment-slots-head"]}>
        <span className={s["equipment-slots-label"]}>装备配置</span>
        <span className={s["equipment-slots-hint"]}>选择部位更换装备</span>
      </div>
      <div className={s["equipment-slots-grid"]}>
        {EQUIP_SLOTS.map((slot) => {
          const worn = equipped?.[slot] ?? null;
          return (
            <EquipmentSlot
              key={slot}
              slot={slot}
              worn={worn}
              selected={activeSlot === slot}
              onSelect={onSelect}
              onUnequip={onUnequip}
            />
          );
        })}
      </div>
    </section>
  );
}

function EquipmentSlot({
  slot,
  worn,
  selected,
  onSelect,
  onUnequip,
}: {
  slot: EquipSlot;
  worn: ItemStack | null;
  selected: boolean;
  onSelect: (slot: EquipSlot) => void;
  onUnequip: (slot: EquipSlot) => void;
}) {
  const { point, bind } = useHoverTooltip();
  const { point: unequipPoint, bind: unequipBind } = useHoverTooltip();

  return (
    <div className={cx(s["equipment-slot"], selected && s["is-active"])} {...(worn ? bind : {})}>
      {worn ? (
        <>
          <ItemSlot
            stack={worn}
            showName={false}
            showCount={false}
            showBond={false}
            className={s["equipment-slot-item"]}
            aria-label={`查看${SLOT_LABEL[slot]}装备`}
            onClick={() => onSelect(slot)}
          />
          <button
            className={s["equipment-slot-unequip"]}
            type="button"
            aria-label={`卸下${SLOT_LABEL[slot]}装备`}
            {...unequipBind}
            onClick={() => onUnequip(slot)}
          >
            卸下
          </button>
          {unequipPoint && (
            <HoverTooltip point={unequipPoint}>
              <strong>卸下{SLOT_LABEL[slot]}装备</strong>
            </HoverTooltip>
          )}
        </>
      ) : (
        <button
          className={s["equipment-slot-empty"]}
          type="button"
          onClick={() => onSelect(slot)}
          aria-label={`打开${SLOT_LABEL[slot]}仓库`}
        >
          {equipSlotIcon(slot)}
        </button>
      )}
      {worn && point && <ItemTooltip stack={worn} point={point} />}
    </div>
  );
}
