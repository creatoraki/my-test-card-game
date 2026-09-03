import type { CSSProperties } from "react";
import type { Card } from "@/engine";
import { getCharacter } from "@/data";
import { cx } from "@/ui/common/cx";
import { CardSelectFrame } from "@/ui/common/CardSelectFrame";
import { HandCard } from "@/ui/battle/HandCard";
import s from "./DeckCard.module.css";

interface Props {
  card: Card;
  selected: boolean;
  index: number;
  className?: string;
  focusStyle?: "lift" | "zoom";
  onClick: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function DeckCard({
  card,
  selected,
  index,
  className,
  focusStyle = "lift",
  onClick,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
}: Props) {
  const owner = getCharacter(card.ownerCharId);
  return (
    <button
      className={cx(
        s["deck-card"],
        className,
        focusStyle === "zoom" && s["is-zoom"],
      )}
      type="button"
      style={
        {
          "--owner-color": owner.color,
          "--i": index,
        } as CSSProperties
      }
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      aria-pressed={selected}
    >
      <span data-deck-card>
        <HandCard card={card} variant="pile" playable selected={false} />
      </span>
      {selected && <CardSelectFrame />}
    </button>
  );
}
