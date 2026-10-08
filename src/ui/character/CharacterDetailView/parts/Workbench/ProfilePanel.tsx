import type { GearSet, GearSlot } from "@/items/gearSlots";
import { EquipmentSlots } from "@/ui/character/EquipmentSlots";
import type { StatBlock } from "@/engine";
import { StatsPanel } from "./parts/StatsPanel";
import s from "./ProfilePanel.module.css";

interface Props {
  exp: number;
  stats: StatBlock;
  preview?: StatBlock | null;
  rolling: boolean;
  level: number;
  equipped: GearSet;
  activeSlot: GearSlot | null;
  onSelect: (slot: GearSlot) => void;
  onUnequip: (slot: GearSlot) => void;
}

export function ProfilePanel({ exp, stats, preview, rolling, level, equipped, activeSlot, onSelect, onUnequip }: Props) {
  return (
    <div className={s.panel}>
      <EquipmentSlots
        className={s.slots}
        level={level}
        equipped={equipped}
        activeSlot={activeSlot}
        onSelect={onSelect}
        onUnequip={onUnequip}
      />
      <div className={s.stats}>
        <div className={s.head}>
          <h3 className={s.heading}><span aria-hidden="true" /> 角色属性</h3>
          <span className={s["head-sub"]}>数据总览</span>
          <span className={s.exp}>可用经验 <b>{exp}</b></span>
        </div>
        <StatsPanel stats={stats} preview={preview} rolling={rolling} />
      </div>
    </div>
  );
}
