import { NUTRITION_TREAT_COST, getCharacter } from "@/data";
import { CharacterPortrait } from "@/ui/common/CharacterPortrait";
import { HoverTooltip, useHoverTooltip } from "@/ui/common/HoverTooltip";
import type { NutritionState } from "@/store/townStore";
import { CryoFigureStrip } from "../CryoFigureStrip";
import figure from "../styles/cryoFigure.module.css";
import s from "./NutritionPodRack.module.css";
import type { NutritionCandidate } from "./NutritionCandidateCard";

interface Props {
  occupants: NutritionState["occupants"];
  capacity: number;
  selectedCandidate: NutritionCandidate | null;
  loot: number;
  onAdmit: (charId: string) => void;
}

export function NutritionPodRack({ occupants, capacity, selectedCandidate, loot, onAdmit }: Props) {
  return (
    <CryoFigureStrip className={s.rack}>
      {Array.from({ length: 4 }, (_, index) => (
        <PodSlot
          key={index}
          index={index}
          occupant={occupants[index]}
          unlocked={index < capacity}
          selectedCandidate={selectedCandidate}
          loot={loot}
          onAdmit={onAdmit}
        />
      ))}
    </CryoFigureStrip>
  );
}

function PodSlot({ index, occupant, unlocked, selectedCandidate, loot, onAdmit }: { index: number; occupant?: NutritionState["occupants"][number]; unlocked: boolean; selectedCandidate: NutritionCandidate | null; loot: number; onAdmit: (charId: string) => void }) {
  const { point, bind } = useHoverTooltip();
  const character = occupant ? getCharacter(occupant.charId) : null;
  const reason = occupant
    ? `疗养中 · 明日 +${occupant.heal}；结算后自动离舱`
    : !unlocked
      ? `需舱位扩建 ${index === 1 ? "I" : index === 2 ? "II" : "III"}`
      : !selectedCandidate
        ? "先在下方选择一名需要疗养的队员"
        : selectedCandidate.reason ?? (loot < NUTRITION_TREAT_COST ? "居民积分不足" : null);
  const disabled = Boolean(occupant || !unlocked || reason);

  return (
    <div
      className={s.wrap}
      onPointerEnter={(event) => reason && bind.onPointerEnter(event)}
      onPointerLeave={bind.onPointerLeave}
      onFocus={(event) => reason && bind.onFocus(event)}
      onBlur={bind.onBlur}
    >
      <button className={`${s.pod} ${!unlocked ? s["is-locked"] : ""} ${occupant ? s["is-occupied"] : ""}`} type="button" disabled={disabled} onClick={() => selectedCandidate && onAdmit(selectedCandidate.charId)}>
        <span className={s.lid} aria-hidden />
        <span className={s.no}>席位-{String(index + 1).padStart(2, "0")}</span>
        <span className={s.figure}>
          {character ? <CharacterPortrait characterId={character.id} emoji={character.emoji} alt={character.name} className={s.portrait} /> : <span className={s.emptyIcon}>{unlocked ? "＋" : "◇"}</span>}
          <span className={figure.figureScrim} aria-hidden />
        </span>
        <span className={s.text}>
          <span className={s.name}>{character?.name ?? (unlocked ? "空置席位" : "待扩建")}</span>
          <span className={s.meta}>{character ? `疗养中 · 明日 +${occupant?.heal}` : unlocked ? "点击送入队员" : `需舱位扩建 ${index === 1 ? "I" : index === 2 ? "II" : "III"}`}</span>
        </span>
      </button>
      {point && reason && <HoverTooltip point={point}>{reason}</HoverTooltip>}
    </div>
  );
}