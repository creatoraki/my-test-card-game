import { getCharacter, NUTRITION_POD_MAX } from "@/data";
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
  assigned: Record<number, string>;
  selectedCandidate: NutritionCandidate | null;
  selectedCharId: string | null;
  heal: number;
  onPlace: (slot: number) => void;
  onClear: (slot: number) => void;
}

export function NutritionPodRack({ occupants, capacity, assigned, selectedCandidate, selectedCharId, heal, onPlace, onClear }: Props) {
  return (
    <CryoFigureStrip className={s.rack}>
      {Array.from({ length: NUTRITION_POD_MAX }, (_, index) => (
        <PodSlot
          key={index}
          index={index}
          occupant={occupants.find((entry) => entry.slot === index)}
          pendingCharId={assigned[index]}
          unlocked={index < capacity}
          selectedCandidate={selectedCandidate}
          selected={selectedCharId === assigned[index]}
          heal={heal}
          onPlace={onPlace}
          onClear={onClear}
        />
      ))}
    </CryoFigureStrip>
  );
}

function PodSlot({ index, occupant, pendingCharId, unlocked, selectedCandidate, selected, heal, onPlace, onClear }: { index: number; occupant?: NutritionState["occupants"][number]; pendingCharId?: string; unlocked: boolean; selectedCandidate: NutritionCandidate | null; selected: boolean; heal: number; onPlace: (slot: number) => void; onClear: (slot: number) => void }) {
  const { point, bind } = useHoverTooltip();
  const state = occupant ? "treating" : pendingCharId ? "pending" : unlocked ? "empty" : "locked";
  const character = occupant ? getCharacter(occupant.charId) : pendingCharId ? getCharacter(pendingCharId) : null;
  const lockName = index === 1 ? "I" : index === 2 ? "II" : "III";
  const reason = state === "treating"
    ? "疗养中的角色将在次日结算后自动离舱"
    : state === "locked"
      ? `需席位扩建 ${lockName}`
      : state === "empty" && !selectedCandidate
        ? "先在下方选择一名需要疗养的队员"
        : state === "empty"
          ? selectedCandidate?.reason ?? null
          : null;
  const disabled = state === "treating" || state === "locked" || (state === "empty" && Boolean(reason));

  return (
    <div
      className={s.wrap}
      onPointerEnter={(event) => reason && bind.onPointerEnter(event)}
      onPointerLeave={bind.onPointerLeave}
      onFocus={(event) => reason && bind.onFocus(event)}
      onBlur={bind.onBlur}
    >
      <button className={`${s.pod} ${s[`is-${state}`]} ${selected ? s["is-selected"] : ""}`} type="button" disabled={disabled} onClick={() => state === "pending" ? onClear(index) : onPlace(index)}>
        <span className={s.lid} aria-hidden />
        <span className={s.no}>席位-{String(index + 1).padStart(2, "0")}</span>
        <span className={s.figure}>
          {character ? <CharacterPortrait characterId={character.id} emoji={character.emoji} alt={character.name} className={s.portrait} /> : <span className={s.emptyIcon}>{unlocked ? "＋" : "◇"}</span>}
          <span className={figure.figureScrim} aria-hidden />
        </span>
        <span className={s.text}>
          <span className={s.name}>{character?.name ?? (unlocked ? "空置席位" : "待扩建")}</span>
          <span className={s.meta}>{state === "treating" ? `疗养中 · 明日 +${occupant?.heal}` : state === "pending" ? `待入舱 · 明日 +${heal}` : state === "empty" ? "点击落位队员" : `需席位扩建 ${lockName}`}</span>
        </span>
        {state === "treating" && <span className={s.lock} aria-hidden>锁</span>}
      </button>
      {point && reason && <HoverTooltip point={point}>{reason}</HoverTooltip>}
    </div>
  );
}
