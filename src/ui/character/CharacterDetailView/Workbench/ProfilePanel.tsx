import type { ItemStack, EquipSlot } from "@/items/types";
import { EquipmentSlots } from "@/ui/character/EquipmentSlots";
import type { StatBlock } from "@/engine";
import { StatsPanel } from "./StatsPanel";
import s from "./ProfilePanel.module.css";

interface Props {
  stats: StatBlock;
  preview?: StatBlock | null;
  equipped: Record<EquipSlot, ItemStack | null>;
  activeSlot: EquipSlot | null;
  onSelect: (slot: EquipSlot) => void;
  onUnequip: (slot: EquipSlot) => void;
}

export function ProfilePanel({ stats, preview, equipped, activeSlot, onSelect, onUnequip }: Props) {
  return (
    <div className={s.panel}>
      <EquipmentSlots
        className={s.slots}
        equipped={equipped}
        activeSlot={activeSlot}
        onSelect={onSelect}
        onUnequip={onUnequip}
      />
      <div className={s.stats}>
        <StatsPanel stats={stats} preview={preview} />
      </div>
    </div>
  );
}