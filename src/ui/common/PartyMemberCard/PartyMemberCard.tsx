import type { ReactNode } from "react";
import { CharacterPortrait } from "@/ui/common/CharacterPortrait";
import { HpBar } from "@/ui/common/HpBar";
import { PollutionMeter } from "@/ui/common/PollutionMeter";
import { cx } from "@/ui/common/cx";
import s from "./PartyMemberCard.module.css";

interface Props {
  charId: string;
  emoji: string;
  name: string;
  hp: number;
  hpLimit: number;
  maxHp: number;
  pollution: number;
  down?: boolean;
  as?: "div" | "button";
  className?: string;
  overlay?: ReactNode;
  onClick?: () => void;
}

export function PartyMemberCard({
  charId,
  emoji,
  name,
  hp,
  hpLimit,
  maxHp,
  pollution,
  down = false,
  as = "div",
  className,
  overlay,
  onClick,
}: Props) {
  const content = (
    <>
      <div className={s["expl-member-figure"]}>
        <CharacterPortrait
          characterId={charId}
          emoji={emoji}
          alt={`${name}立绘`}
          className={s["expl-portrait"]}
        />
        {overlay}
      </div>
      <div className={s["expl-member-body"]}>
        <HpBar hp={hp} hpLimit={hpLimit} maxHp={maxHp} flush />
        <PollutionMeter value={pollution} />
      </div>
      {down && <span className={s["expl-member-down"]}>阵亡</span>}
    </>
  );

  if (as === "button") {
    return (
      <button type="button" className={cx(s["expl-member"], className)} onClick={onClick}>
        {content}
      </button>
    );
  }

  return (
    <div className={cx(s["expl-member"], className)} onClick={onClick}>
      {content}
    </div>
  );
}
