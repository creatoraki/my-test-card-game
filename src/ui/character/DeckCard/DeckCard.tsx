import type { CSSProperties } from "react";
import type { Card } from "@/engine";
import { getCharacter } from "@/data";
import { cardArt } from "@/ui/art/cardArt";
import { cx } from "@/ui/common/cx";
import { TechCard } from "@/ui/common/TechCard";
import s from "./DeckCard.module.css";

interface Props {
  card: Card;
  selected: boolean;
  index: number;
  className?: string;
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
  onClick,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
}: Props) {
  const owner = getCharacter(card.ownerCharId);

  return (
    <button
      className={cx(s["deck-card"], className, selected && s["is-selected"])}
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
      <TechCard
        name={card.name}
        cost={card.cost}
        description={card.text}
        artSrc={cardArt(card.id)}
        theme={card.cardType}
      />
    </button>
  );
}
