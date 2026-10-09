import { memo } from "react";
import type { BattleState } from "@/engine";
import { RULES, partyManaPerRound, heldManaTotal, type Enemy } from "@/engine";
import { useHandHoverCost } from "@/ui/battle/state/handFocusStore";
import { ManaCrystal } from "@/ui/common/icon/ManaCrystal";
import { RailPopover } from "@/ui/common/tooltip/RailPopover";
import { TooltipCard } from "@/ui/common/tooltip/TooltipCard";
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
  const held = heldManaTotal(battle);
  const holders = battle.enemyIds.map((id) => battle.combatants[id] as Enemy)
    .filter((enemy) => enemy.alive && (enemy.ark?.heldMana ?? 0) > 0)
    .map((enemy) => `${enemy.name} ${enemy.ark!.heldMana} 枚`).join("、");

  return (
    <div className={s.manaBar} data-rail-item tabIndex={0} aria-label="法力水晶，每回合的出牌资源">
      {Array.from({ length: crystalCount }, (_, index) => (
        <ManaCrystal
          key={index}
          className={s.crystal}
          ornate
          state={hoveredCost !== null && index >= activeStart && index < mana ? "active" : index >= mana ? "empty" : "normal"}
        />
      ))}
      {held > 0 && <span className={s.held}>扣押 {held} 枚</span>}
      <RailPopover side="top-left">
        <TooltipCard title="法力水晶" desc={`每回合用于打出卡牌的共享资源。${held > 0 ? `被扣押 ${held} 枚：${holders}。仅拿走当前可用水晶，不影响后续回合自然回复；击杀持有者返还，不超过水晶上限。` : ""}`} />
      </RailPopover>
    </div>
  );
});
