import { DetailFrame } from "@/ui/character/DetailFrame";
import type { ItemStack, EquipSlot } from "@/items/types";
import { EquipmentSlots } from "@/ui/character/EquipmentSlots";
import type { StatBlock } from "@/engine";
import { StatsPanel } from "./StatsPanel";
import s from "./ProfilePanel.module.css";

interface Props {
  exp: number;
  stats: StatBlock;
  preview?: StatBlock | null;
  equipped: Record<EquipSlot, ItemStack | null>;
  activeSlot: EquipSlot | null;
  onSelect: (slot: EquipSlot) => void;
  onUnequip: (slot: EquipSlot) => void;
}

export function ProfilePanel({ exp, stats, preview, equipped, activeSlot, onSelect, onUnequip }: Props) {
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
        <DetailFrame />
        <div className={s.head}>
          <h3 className={s.heading}><span aria-hidden="true" /> 角色属性</h3>
          <span className={s["head-sub"]}>数据总览</span>
          <span className={s.exp}>可用经验 <b>{exp}</b></span>
        </div>
        <StatsPanel stats={stats} preview={preview} />
      </div>
    </div>
  );
}
