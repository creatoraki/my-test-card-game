import { useMemo } from "react";
import { getCharacter } from "@/data";
import { playSfx } from "@/ui/audio";
import { CharacterPortrait } from "@/ui/common/CharacterPortrait";
import { HoverTooltip, useHoverTooltip } from "@/ui/common/HoverTooltip";
import { useCountUp } from "@/ui/hooks/useCountUp";
import type { CharacterState, NutritionState } from "@/store/townStore";
import { vitalsOf } from "@/store/townStore";
import { PodFluid } from "./PodFluid";
import type { NutritionCandidate } from "./useNutritionAssign";
import figure from "../styles/cryoFigure.module.css";
import s from "./NutritionPod.module.css";

type PodState = "locked" | "empty" | "pending" | "treating";

interface Props {
  index: number;
  occupant?: NutritionState["occupants"][number];
  characterState?: CharacterState;
  pendingCharId?: string;
  pendingCharacterState?: CharacterState;
  unlocked: boolean;
  selectedCandidate: NutritionCandidate | null;
  selected: boolean;
  heal: number;
  onPlace: (slot: number) => void;
  onClear: (slot: number) => void;
}

export function NutritionPod({
  index,
  occupant,
  characterState,
  pendingCharId,
  pendingCharacterState,
  unlocked,
  selectedCandidate,
  selected,
  heal,
  onPlace,
  onClear,
}: Props) {
  const { point, bind } = useHoverTooltip();
  const state: PodState = occupant ? "treating" : pendingCharId ? "pending" : unlocked ? "empty" : "locked";
  const characterId = occupant?.charId ?? pendingCharId;
  const character = characterId ? getCharacter(characterId) : null;
  const currentState = state === "treating" ? characterState : pendingCharacterState;
  const vitals = currentState ? vitalsOf(currentState) : null;
  const currentLimit = vitals?.hpLimit ?? 0;
  const maxHp = vitals?.maxHp ?? 1;
  const targetLimit = state === "pending" ? Math.min(maxHp, currentLimit + heal) : currentLimit;
  const shownTarget = useCountUp(targetLimit, 0, 520);
  const baseFill = state === "locked" ? 0 : state === "empty" ? 12 : state === "treating" ? 100 : (currentLimit / maxHp) * 100;
  const gainFill = state === "pending" ? Math.max(0, (targetLimit - currentLimit) / maxHp * 100) : 0;
  const lockName = index === 1 ? "I" : index === 2 ? "II" : "III";
  const reason = state === "treating"
    ? "疗养中的角色将在次日结算后自动离舱"
    : state === "locked"
      ? `需席位扩建 ${lockName}`
      : state === "empty" && !selectedCandidate
        ? "先在右侧选择一名需要疗养的队员"
        : state === "empty"
          ? selectedCandidate?.reason ?? null
          : null;
  const disabled = state === "treating" || state === "locked" || (state === "empty" && Boolean(reason));
  const shockKey = pendingCharId ?? occupant?.charId ?? "empty";
  const className = useMemo(
    () => `${s.pod} ${s[`is-${state}`]} ${selected ? s["is-selected"] : ""} ${state === "empty" && selectedCandidate ? s["is-droppable"] : ""}`,
    [selected, selectedCandidate, state],
  );

  const handleClick = () => {
    if (state === "pending") {
      playSfx("back");
      onClear(index);
      return;
    }
    playSfx("heal");
    onPlace(index);
  };

  return (
    <div
      className={s.wrap}
      onPointerEnter={(event) => reason && bind.onPointerEnter(event)}
      onPointerLeave={bind.onPointerLeave}
      onFocus={(event) => reason && bind.onFocus(event)}
      onBlur={bind.onBlur}
    >
      <button
        className={className}
        type="button"
        disabled={disabled}
        aria-label={`席位-${String(index + 1).padStart(2, "0")}`}
        onClick={handleClick}
      >
        <span className={s.lidTop} aria-hidden />
        <span className={s.lidBottom} aria-hidden />
        <span className={s.no}>席位-{String(index + 1).padStart(2, "0")}</span>
        <PodFluid state={state} baseFill={baseFill} gainFill={gainFill} />
        <span className={s.figure}>
          {character ? (
            <CharacterPortrait characterId={character.id} emoji={character.emoji} alt={character.name} className={s.portrait} />
          ) : (
            <span className={s.emptyIcon}>{unlocked ? "＋" : "◇"}</span>
          )}
          <span className={figure.figureScrim} aria-hidden />
        </span>
        <span className={s.text}>
          <span className={s.name}>{character?.name ?? (unlocked ? "空置席位" : "待扩建")}</span>
          <span className={s.meta}>
            {state === "treating"
              ? `疗养中 · 明日 +${occupant?.heal}`
              : state === "pending"
                ? `待入舱 · 明日 +${heal}`
                : state === "empty"
                  ? "点击落位队员"
                  : `需席位扩建 ${lockName}`}
          </span>
          {state === "pending" && vitals && (
            <span className={s.readout}>体力极限 {currentLimit} → <strong>{shownTarget}</strong></span>
          )}
        </span>
        {state === "pending" && <span className={s.remove} aria-hidden>×</span>}
        {state === "treating" && <span className={s.lock} aria-hidden>锁</span>}
        {state === "pending" && <span key={shockKey} className={s.shock} aria-hidden />}
      </button>
      {point && reason && <HoverTooltip point={point}>{reason}</HoverTooltip>}
    </div>
  );
}
