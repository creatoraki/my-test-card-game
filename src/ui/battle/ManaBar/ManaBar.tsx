import type { BattleState } from "@/engine";
import { RULES } from "@/engine";
import { useHandHover } from "@/ui/battle/handFocusStore";
import { ManaCrystal } from "@/ui/common/ManaCrystal";
import s from "./ManaBar.module.css";

interface Props {
  battle: BattleState;
}

export function ManaBar({ battle }: Props) {
  const mana = battle.resources[RULES.resource.name] ?? 0;
  const maxMana = RULES.resource.perRound;
  const hoveredCard = useHandHover();
  const crystalCount = Math.max(maxMana, mana);
  const activeCount = Math.min(mana, hoveredCard?.cost ?? 0);
  const activeStart = mana - activeCount;

  return (
    <div className={s.manaBar} title="法力水晶（每回合的出牌资源）">
      {Array.from({ length: crystalCount }, (_, index) => (
        <ManaCrystal
          key={index}
          className={s.crystal}
          state={hoveredCard && index >= activeStart && index < mana ? "active" : index >= mana ? "empty" : "normal"}
        />
      ))}
    </div>
  );
}