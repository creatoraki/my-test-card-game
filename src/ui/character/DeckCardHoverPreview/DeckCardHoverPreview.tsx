import type { Card } from "@/engine";
import { useCardText } from "@/ui/common/cardText";
import { CardKeywordNotes } from "@/ui/common/CardKeywordNotes";
import { HandCard } from "@/ui/battle/HandCard";
import s from "./DeckCardHoverPreview.module.css";

interface Props {
  card: Card;
}

export function DeckCardHoverPreview({ card }: Props) {
  const text = useCardText(card);

  return (
    <div
      className={s["deck-card-hover-preview"]}
      aria-label={`${card.name}卡牌详情`}
      aria-live="polite"
    >
      <span data-deck-card>
        <HandCard card={card} variant="pile" playable selected={false} />
      </span>
      <CardKeywordNotes text={text} className={s.keywords} />
    </div>
  );
}