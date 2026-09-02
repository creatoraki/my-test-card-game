import type { CSSProperties } from "react";
import { BorderGlow } from "@/ui/common/BorderGlow";
import { CharacterPortrait } from "@/ui/common/CharacterPortrait";
import { HpBar } from "@/ui/common/HpBar/HpBar";
import { PollutionMeter } from "@/ui/common/PollutionMeter/PollutionMeter";
import { CHARACTER_CARD_GLOW, characterGlow } from "@/ui/character/characterGlow";
import s from "./CharacterFigureColumn.module.css";

interface CharacterVitals {
  hp: number;
  hpLimit: number;
  maxHp: number;
}

interface Props {
  characterId: string;
  emoji: string;
  name: string;
  color: string;
  vitals: CharacterVitals;
  pollution: number;
}

export function CharacterFigureColumn({ characterId, emoji, name, color, vitals, pollution }: Props) {
  const glow = characterGlow(color);

  return (
    <div className={s["figure-col"]}>
      <BorderGlow
        className={s.figure}
        style={{ "--gc-color": color } as CSSProperties}
        {...CHARACTER_CARD_GLOW}
        {...glow}
        followPointer
        persistent={false}
        animated={false}
        fillOpacity={0.2}
      >
        <div className={s.body}>
          <CharacterPortrait characterId={characterId} emoji={emoji} alt={name} className={s.bust} />
        </div>
      </BorderGlow>
      <div className={s["status-bars"]}>
        <div className={s.hp}>
          <HpBar hp={vitals.hp} hpLimit={vitals.hpLimit} maxHp={vitals.maxHp} flush />
        </div>
        <PollutionMeter value={pollution} />
      </div>
    </div>
  );
}
