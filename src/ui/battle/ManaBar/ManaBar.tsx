import { memo } from "react";
import type { BattleState } from "@/engine";
import { RULES, partyManaPerRound } from "@/engine";
import { useHandHoverCost } from "@/ui/battle/handFocusStore";
import { ManaCrystal } from "@/ui/common/ManaCrystal";
import { RailPopover } from "@/ui/common/RailPopover";
import s from "./ManaBar.module.css";

interface Props {
  battle: BattleState;
}

export const ManaBar = memo(function ManaBar({ battle }: Props) {
  const mana = battle.resources[RULES.resource.name] ?? 0;
  const maxMana = partyManaPerRound(battle);
  const hoveredCost = useHandHoverCost();
  const crystalCount = Math.max(maxMana, mana);
  const activeCount = Math.min(mana, hoveredCost ?? 0);
  const activeStart = mana - activeCount;

  return (
    <div className={s.manaBar} data-rail-item tabIndex={0} aria-label="法力水晶，每回合的出牌资源">
      {Array.from({ length: crystalCount }, (_, index) => (
        <ManaCrystal
          key={index}
          className={s.crystal}
          state={hoveredCost !== null && index >= activeStart && index < mana ? "active" : index >= mana ? "empty" : "normal"}
        />
      ))}
      <RailPopover side="top-left">
        <strong>法力水晶</strong>
        <p>每回合用于打出卡牌的共享资源。</p>
      </RailPopover>
    </div>
  );
});