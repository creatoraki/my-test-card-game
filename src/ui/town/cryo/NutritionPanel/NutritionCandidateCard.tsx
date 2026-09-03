import { getCharacter } from "@/data";
import type { CharacterState } from "@/store/townStore";
import { vitalsOf } from "@/store/townStore";
import { CharacterPortrait } from "@/ui/common/CharacterPortrait";
import { HoverTooltip, useHoverTooltip } from "@/ui/common/HoverTooltip";
import { HpBar } from "@/ui/common/HpBar";
import { cx } from "@/ui/common/cx";
import figure from "../styles/cryoFigure.module.css";
import s from "./NutritionCandidateCard.module.css";

export interface NutritionCandidate {
  charId: string;
  reason: string | null;
  damage: number;
}

interface Props {
  candidate: NutritionCandidate;
  character: CharacterState;
  selected: boolean;
  onSelect: () => void;
}

export function NutritionCandidateCard({ candidate, character: characterState, selected, onSelect }: Props) {
  const { point, bind } = useHoverTooltip();
  const character = getCharacter(candidate.charId);
  const vitals = vitalsOf(characterState);
  const disabled = candidate.reason !== null;

  return (
    <div
      className={s.wrap}
      onPointerEnter={(event) => candidate.reason && bind.onPointerEnter(event)}
      onPointerLeave={bind.onPointerLeave}
      onFocus={(event) => candidate.reason && bind.onFocus(event)}
      onBlur={bind.onBlur}
    >
      <button className={cx(s.card, selected && s["is-selected"])} type="button" disabled={disabled} onClick={onSelect}>
        <span className={s.figure}>
          <CharacterPortrait characterId={character.id} emoji={character.emoji} alt={character.name} className={s.portrait} />
          <span className={figure.figureScrim} aria-hidden />
        </span>
        <span className={s.body}>
          <span className={s.name}>{character.name}</span>
          <span className={s.damage}>体力极限 −{candidate.damage}</span>
          <span className={s.hp}><HpBar hp={vitals.hp} hpLimit={vitals.hpLimit} maxHp={vitals.maxHp} /></span>
        </span>
        <span className={s.mark} aria-hidden>{selected ? "✓" : ""}</span>
      </button>
      {point && candidate.reason && <HoverTooltip point={point}>{candidate.reason}</HoverTooltip>}
    </div>
  );
}