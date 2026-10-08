import { getItemDef } from "@/data";
import {
  GEAR_ROWS,
  GEAR_SLOT_KIND,
  GEAR_SLOT_LABEL,
  GEAR_SLOT_UNLOCK,
  gearSlotUnlocked,
  type GearSet,
  type GearSlot,
} from "@/items/gearSlots";
import type { ItemStack } from "@/items/types";
import { equipSlotIcon } from "@/ui/art/items/itemArt";
import { LockGlyph } from "@/ui/character/glyphs/deckGlyphs";
import ItemIconFrame from "@/ui/common/item/ItemIconFrame";
import ItemTooltip from "@/ui/common/item/ItemTooltip";
import { cx } from "@/ui/common/shared/cx";
import { HoverTooltip, useHoverTooltip } from "@/ui/common/tooltip/HoverTooltip";
import { TooltipCard } from "@/ui/common/tooltip/TooltipCard";
import s from "./CrewEquipment.module.css";

interface Props {
  /** 卡组等级, 决定副格是否解锁。 */
  level: number;
  equipped: GearSet;
}

/** 编队卡装备预览: 每行一个部位, 左主右副; 详情浮层使用真实装备实例, 保留词条与强化信息。 */
export function CrewEquipment({ level, equipped }: Props) {
  return (
    <div className={s.equipment} role="group" aria-label="当前装备">
      {GEAR_ROWS.flatMap(({ slots }) => slots).map((slot) => (
        <EquipmentPreview
          key={slot}
          slot={slot}
          locked={!gearSlotUnlocked(slot, level)}
          stack={equipped?.[slot] ?? null}
        />
      ))}
    </div>
  );
}

function EquipmentPreview({ slot, locked, stack }: { slot: GearSlot; locked: boolean; stack: ItemStack | null }) {
  const { point, bind } = useHoverTooltip();
  const name = GEAR_SLOT_LABEL[slot];
  const label = locked
    ? `${name}：${GEAR_SLOT_UNLOCK[slot]}级解锁`
    : stack ? `${name}：${getItemDef(stack.itemId).name}` : `${name}未装备`;

  return (
    <div className={cx(s.slot, locked && s.locked)} tabIndex={0} aria-label={label} {...bind}>
      {locked ? (
        <span className={s.lock} aria-hidden="true"><LockGlyph /></span>
      ) : stack ? (
        <ItemIconFrame itemId={stack.itemId} size="sm" className={s.item} aria-label={label} />
      ) : (
        <span className={s.empty} aria-hidden="true">{equipSlotIcon(GEAR_SLOT_KIND[slot])}</span>
      )}
      {point && (stack && !locked ? (
        <ItemTooltip stack={stack} point={point} />
      ) : (
        <HoverTooltip point={point}>
          <TooltipCard
            title={locked ? `${name}未解锁` : label}
            desc={locked ? `卡组等级达到 ${GEAR_SLOT_UNLOCK[slot]} 级后开放此装备格。` : undefined}
          />
        </HoverTooltip>
      ))}
    </div>
  );
}
