import type { Card } from "@/engine";
import { DeckCardDetail } from "@/ui/character/DeckCardDetail";
import s from "./DeckCardHoverPreview.module.css";

interface Props {
  card: Card;
}

export function DeckCardHoverPreview({ card }: Props) {
  return (
    <div className={s["deck-card-hover-preview"]} aria-live="polite">
      <DeckCardDetail key={card.uid} card={card} variant="floating" />
    </div>
  );
}