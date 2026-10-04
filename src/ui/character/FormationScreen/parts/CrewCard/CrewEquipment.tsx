import { getItemDef } from "@/data";
import type { EquipSlot, ItemStack } from "@/items/types";
import { SLOT_LABEL } from "@/items/types";
import { EQUIP_SLOTS } from "@/store/town/characterStats";
import { equipSlotIcon } from "@/ui/art/items/itemArt";
import ItemIconFrame from "@/ui/common/item/ItemIconFrame";
import ItemTooltip from "@/ui/common/item/ItemTooltip";
import { HoverTooltip, useHoverTooltip } from "@/ui/common/tooltip/HoverTooltip";
import { TooltipCard } from "@/ui/common/tooltip/TooltipCard";
import s from "./CrewEquipment.module.css";

interface Props {
  equipped: Record<EquipSlot, ItemStack | null>;
}

/** 编队卡装备预览；详情浮层使用真实装备实例，保留词条与强化信息。 */
export function CrewEquipment({ equipped }: Props) {
  return (
    <div className={s.equipment} role="group" aria-label="当前装备">
      {EQUIP_SLOTS.map((slot) => (
        <EquipmentPreview key={slot} slot={slot} stack={equipped?.[slot] ?? null} />
      ))}
    </div>
  );
}

function EquipmentPreview({ slot, stack }: { slot: EquipSlot; stack: ItemStack | null }) {
  const { point, bind } = useHoverTooltip();
  const label = stack ? `${SLOT_LABEL[slot]}：${getItemDef(stack.itemId).name}` : `${SLOT_LABEL[slot]}未装备`;

  return (
    <div className={s.slot} tabIndex={0} aria-label={label} {...bind}>
      {stack ? (
        <ItemIconFrame itemId={stack.itemId} size="sm" className={s.item} aria-label={label} />
      ) : (
        <span className={s.empty} aria-hidden="true">{equipSlotIcon(slot)}</span>
      )}
      {point && (stack ? (
        <ItemTooltip stack={stack} point={point} />
      ) : (
        <HoverTooltip point={point}><TooltipCard title={label} /></HoverTooltip>
      ))}
    </div>
  );
}
