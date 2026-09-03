import type { EquipSlot, ItemStack } from "@/items/types";
import { SLOT_LABEL } from "@/items/types";
import { EQUIP_SLOTS } from "@/store/townStore";
import ItemSlot from "@/ui/common/item/ItemSlot";
import { cx } from "@/ui/common/cx";
import s from "./EquipmentSlots.module.css";

interface Props {
  equipped: Record<EquipSlot, ItemStack | null>;
  activeSlot: EquipSlot | null;
  onSelect: (slot: EquipSlot) => void;
  onUnequip: (slot: EquipSlot) => void;
  variant?: "grid" | "rail";
  className?: string;
}

export function EquipmentSlots({ equipped, activeSlot, onSelect, onUnequip, variant = "grid", className }: Props) {
  return (
    <section className={cx(s["equipment-slots"], variant === "rail" && s["is-rail"], className)} aria-label="角色装备">
      <div className={s["equipment-slots-head"]}>
        <span className={s["equipment-slots-label"]}>装备配置</span>
        <span className={s["equipment-slots-hint"]}>选择部位更换装备</span>
      </div>
      <div className={s["equipment-slots-grid"]}>
        {EQUIP_SLOTS.map((slot) => {
          const worn = equipped?.[slot] ?? null;
          const selected = activeSlot === slot;
          return (
            <div className={cx(s["equipment-slot"], selected && s["is-active"])} key={slot}>
              {worn ? (
                <ItemSlot
                  stack={worn}
                  className={s["equipment-slot-item"]}
                  onClick={() => onSelect(slot)}
                />
              ) : (
                <button
                  className={s["equipment-slot-empty"]}
                  type="button"
                  onClick={() => onSelect(slot)}
                  aria-label={`打开${SLOT_LABEL[slot]}仓库`}
                >
                  <span>+</span>
                </button>
              )}
              <button
                className={s["equipment-slot-select"]}
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(slot)}
              >
                <span className={s["equipment-slot-name"]}>{SLOT_LABEL[slot]}</span>
                <span className={cx(s["equipment-slot-status"], !worn && s["is-empty"])}>
                  {worn ? "已装备" : "空槽"}
                </span>
              </button>
              {worn && (
                <button
                  className={s["equipment-slot-remove"]}
                  type="button"
                  onClick={() => onUnequip(slot)}
                  aria-label={`卸下${SLOT_LABEL[slot]}中的${worn.itemId}`}
                >
                  卸下
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
