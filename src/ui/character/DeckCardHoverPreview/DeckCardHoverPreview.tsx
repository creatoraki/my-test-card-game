import type { Card } from "@/engine";
import { DeckCardFace } from "@/ui/character/DeckCardFace";
import s from "./DeckCardHoverPreview.module.css";

interface Props {
  card: Card;
}

export function DeckCardHoverPreview({ card }: Props) {
  return (
    <div
      className={s["deck-card-hover-preview"]}
      aria-label={`${card.name}卡牌详情`}
      aria-live="polite"
    >
      <DeckCardFace card={card} />
    </div>
  );
}