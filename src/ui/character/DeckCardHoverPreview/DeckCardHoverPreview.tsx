import type { Card } from "@/engine";
import { cx } from "@/ui/common/cx";
import { useCardText } from "@/ui/common/cardText";
import { CardKeywordNotes } from "@/ui/common/CardKeywordNotes";
import { HandCard } from "@/ui/battle/HandCard";
import s from "./DeckCardHoverPreview.module.css";

interface Props {
  card: Card;
  /** 父组件唯一的外观通道(样式铁律 3): 用它把浮卡挪到本页版面的空档处。 */
  className?: string;
}

export function DeckCardHoverPreview({ card, className }: Props) {
  const text = useCardText(card);

  return (
    <div
      className={cx(s["deck-card-hover-preview"], className)}
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