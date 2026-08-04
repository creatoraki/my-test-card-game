import type { CSSProperties } from "react";
import type { Card } from "@/engine";
import { getCharacter } from "@/data";
import { cardArt } from "@/ui/art/cardArt";
import { CARD_FRAME_ART } from "@/ui/art/cardFrame";
import { cx } from "@/ui/common/cx";
import s from "./DeckCardFace.module.css";

interface Props {
  card: Card;
  className?: string;
}

export function DeckCardFace({ card, className }: Props) {
  const owner = getCharacter(card.ownerCharId);
  const art = cardArt(card.id);
  const rarity = card.rarity ?? "common";
  const textSize = card.text.length <= 28 ? "lg" : card.text.length <= 48 ? "md" : "sm";

  return (
    <div
      className={cx(
        s["deck-card-face"],
        s[card.cardType],
        s[`r-${rarity}`],
        card.upgraded && s["is-upgraded"],
        className,
      )}
      style={
        {
          "--owner-color": owner.color,
          "--card-frame-image": `url("${CARD_FRAME_ART}")`,
        } as CSSProperties
      }
    >
      <span className={s["deck-card-cost"]}>
        <strong>{card.cost}</strong>
      </span>
      {card.contaminated && (
        <span className={s["deck-card-pollution"]} title="污染卡 · 抽到时污染值 +2" aria-label="污染卡">
          ☣
        </span>
      )}
      <span className={s["deck-card-art"]}>
        {art ? (
          <img src={art} draggable={false} />
        ) : (
          <span className={s["deck-card-art-empty"]}>NO VISUAL</span>
        )}
      </span>
      <span className={s["deck-card-body"]}>
        <strong className={s["deck-card-name"]}>{card.name}</strong>
        <span className={cx(s["deck-card-text"], s[textSize])}>{card.text}</span>
      </span>
      <span className={s["deck-card-frame"]} aria-hidden="true" />
    </div>
  );
}
