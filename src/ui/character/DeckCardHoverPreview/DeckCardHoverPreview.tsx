import type { Card } from "@/engine";
import { cardArt } from "@/ui/art/cardArt";
import { useCardText } from "@/ui/common/cardText";
import { TechCard } from "@/ui/common/TechCard";
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
      <TechCard
        name={card.name}
        cost={card.cost}
        description={text}
        artSrc={cardArt(card.id)}
        theme={card.cardType}
      />
    </div>
  );
}