import { useLayoutEffect } from "react";
import { HoverTooltip, useHoverTooltip } from "@/ui/common/tooltip/HoverTooltip";
import { TooltipCard } from "@/ui/common/tooltip/TooltipCard";
import type { EquipSlot, ItemStack } from "@/items/types";
import { SLOT_LABEL } from "@/items/types";
import { EQUIP_SLOTS } from "@/store/town/townStore";
import ItemTooltip from "@/ui/common/item/ItemTooltip";
import ItemSlot from "@/ui/common/item/ItemSlot";
import { equipSlotIcon } from "@/ui/art/items/itemArt";
import { cx } from "@/ui/common/shared/cx";
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

  // 仓库开关或装备变化时清掉旧锚点，避免换装后沿用之前的悬停／焦点提示。
  useLayoutEffect(() => {
    bind.onPointerLeave();
    unequipBind.onPointerLeave();
  }, [selected, worn?.uid]);

  return (
    <div className={cx(s["equipment-slot"], selected && s["is-active"])} {...(worn ? bind : {})}>
      {worn ? (
        <>
          <ItemSlot
            stack={worn}
            showName={false}
            showCount={false}
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
          {!selected && unequipPoint && (
            <HoverTooltip point={unequipPoint}>
              <TooltipCard title={`卸下${SLOT_LABEL[slot]}装备`} />
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
          <span className={s["equipment-slot-add"]} aria-hidden="true" />
        </button>
      )}
      <span className={s["equipment-slot-name"]}>{SLOT_LABEL[slot]}</span>
      {!selected && worn && point && <ItemTooltip stack={worn} point={point} />}
    </div>
  );
}
