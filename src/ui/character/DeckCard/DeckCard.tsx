import type { CSSProperties } from "react";
import type { Card, Rarity } from "@/engine";
import { getCharacter } from "@/data";
import { cardArt } from "@/ui/art/cardArt";
import { ManaCrystalIcon } from "@/ui/common/ManaCrystalIcon";
import { cx } from "@/ui/common/cx";
import s from "./DeckCard.module.css";

const RARITY_LABEL: Record<Rarity, string> = {
  common: "普通",
  uncommon: "优秀",
  rare: "稀有",
};

interface Props {
  card: Card;
  selected: boolean;
  index: number;
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
  onClick,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
}: Props) {
  const owner = getCharacter(card.ownerCharId);
  const art = cardArt(card.id);
  const rarity = card.rarity ?? "common";
  const textSize = card.text.length <= 28 ? "lg" : card.text.length <= 48 ? "md" : "sm";

  return (
    <button
      className={cx(
        s["deck-card"],
        s[card.cardType],
        s[`r-${rarity}`],
        selected && s["is-selected"],
        card.upgraded && s["is-upgraded"],
      )}
      type="button"
      style={{ "--owner-color": owner.color, "--i": index } as CSSProperties}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      aria-pressed={selected}
    >
      <span className={s["deck-card-art"]}>
        {art ? (
          <img src={art} alt={`${card.name}卡面`} draggable={false} />
        ) : (
          <span className={s["deck-card-art-empty"]}>NO VISUAL</span>
        )}
        <span className={s["deck-card-cost"]}>
          <ManaCrystalIcon className={s["deck-card-cost-icon"]} />
          <strong>{card.cost}</strong>
        </span>
        <span className={s["deck-card-title-strip"]}>
          <strong className={s["deck-card-name"]}>{card.name}</strong>
          <span className={s["deck-card-rarity"]}>{RARITY_LABEL[rarity]}</span>
        </span>
      </span>
      <span className={s["deck-card-body"]}>
        <span className={s["deck-card-meta"]}>
          <span className={s["deck-card-type"]}>{card.cardType === "fast" ? "速攻" : "普通"}</span>
          {card.upgraded && <span className={s["deck-card-upgraded"]}>已强化</span>}
        </span>
        <span className={cx(s["deck-card-text"], s[textSize])}>{card.text}</span>
      </span>
      <span className={s["deck-card-frame"]} aria-hidden="true" />
    </button>
  );
}
