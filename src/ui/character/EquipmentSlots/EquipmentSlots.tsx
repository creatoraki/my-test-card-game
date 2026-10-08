import { useLayoutEffect } from "react";
import { HoverTooltip, useHoverTooltip } from "@/ui/common/tooltip/HoverTooltip";
import { TooltipCard } from "@/ui/common/tooltip/TooltipCard";
import {
  GEAR_ROWS,
  GEAR_SLOT_LABEL,
  GEAR_SLOT_UNLOCK,
  gearSlotUnlocked,
  gearUnlockText,
  type GearSet,
  type GearSlot,
} from "@/items/gearSlots";
import type { EquipSlot, ItemStack } from "@/items/types";
import { SLOT_LABEL } from "@/items/types";
import ItemTooltip from "@/ui/common/item/ItemTooltip";
import ItemSlot from "@/ui/common/item/ItemSlot";
import { equipSlotIcon } from "@/ui/art/items/itemArt";
import { LockGlyph } from "@/ui/character/glyphs/deckGlyphs";
import { cx } from "@/ui/common/shared/cx";
import s from "./EquipmentSlots.module.css";

interface Props {
  /** 卡组等级, 决定副格是否解锁。 */
  level: number;
  equipped: GearSet;
  activeSlot: GearSlot | null;
  onSelect: (slot: GearSlot) => void;
  onUnequip: (slot: GearSlot) => void;
  className?: string;
}

/** 详情页装备栏: 按部位成行, 每行左主右副; 副格随卡组等级解锁。 */
export function EquipmentSlots({ level, equipped, activeSlot, onSelect, onUnequip, className }: Props) {
  return (
    <section className={cx(s["equipment-slots"], className)} aria-label="角色装备">
      <div className={s["equipment-slots-head"]}>
        <span className={s["equipment-slots-label"]}>装备配置</span>
      </div>
      <div className={s["equipment-slots-rows"]}>
        {GEAR_ROWS.map(({ kind, slots }) => (
          <div key={kind} className={s["equipment-row"]} role="group" aria-label={SLOT_LABEL[kind]}>
            <span className={s["equipment-row-name"]}>{SLOT_LABEL[kind]}</span>
            <div className={s["equipment-row-cells"]}>
              {slots.map((slot) =>
                gearSlotUnlocked(slot, level) ? (
                  <EquipmentSlot
                    key={slot}
                    slot={slot}
                    kind={kind}
                    worn={equipped?.[slot] ?? null}
                    selected={activeSlot === slot}
                    onSelect={onSelect}
                    onUnequip={onUnequip}
                  />
                ) : (
                  <LockedSlot key={slot} slot={slot} />
                ),
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function EquipmentSlot({
  slot,
  kind,
  worn,
  selected,
  onSelect,
  onUnequip,
}: {
  slot: GearSlot;
  kind: EquipSlot;
  worn: ItemStack | null;
  selected: boolean;
  onSelect: (slot: GearSlot) => void;
  onUnequip: (slot: GearSlot) => void;
}) {
  const { point, bind } = useHoverTooltip();
  const { point: unequipPoint, bind: unequipBind } = useHoverTooltip();
  const label = GEAR_SLOT_LABEL[slot];

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
            aria-label={`查看${label}装备`}
            onClick={() => onSelect(slot)}
          />
          <button
            className={s["equipment-slot-unequip"]}
            type="button"
            aria-label={`卸下${label}装备`}
            {...unequipBind}
            onClick={() => onUnequip(slot)}
          >
            卸下
          </button>
          {!selected && unequipPoint && (
            <HoverTooltip point={unequipPoint}>
              <TooltipCard title={`卸下${label}装备`} />
            </HoverTooltip>
          )}
        </>
      ) : (
        <button
          className={s["equipment-slot-empty"]}
          type="button"
          onClick={() => onSelect(slot)}
          aria-label={`打开${label}仓库`}
        >
          {equipSlotIcon(kind)}
          <span className={s["equipment-slot-add"]} aria-hidden="true" />
        </button>
      )}
      {!selected && worn && point && <ItemTooltip stack={worn} point={point} />}
    </div>
  );
}

/** 未解锁副格: 锁 + 解锁等级; 悬浮说明解锁条件。 */
function LockedSlot({ slot }: { slot: GearSlot }) {
  const { point, bind } = useHoverTooltip();
  const text = gearUnlockText(slot);
  return (
    <div className={cx(s["equipment-slot"], s["is-locked"])} tabIndex={0} aria-label={`${GEAR_SLOT_LABEL[slot]}：${text}`} {...bind}>
      <span className={s["equipment-slot-lock"]} aria-hidden="true"><LockGlyph /></span>
      <span className={s["equipment-slot-unlock"]}>{text}</span>
      {point && (
        <HoverTooltip point={point}>
          <TooltipCard title={`${GEAR_SLOT_LABEL[slot]}未解锁`} desc={`卡组等级达到 ${GEAR_SLOT_UNLOCK[slot]} 级后开放此装备格。`} />
        </HoverTooltip>
      )}
    </div>
  );
}
