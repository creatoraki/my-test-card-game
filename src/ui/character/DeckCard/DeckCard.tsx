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
}

export function DeckCard({ card, selected, index, onClick }: Props) {
  const owner = getCharacter(card.ownerCharId);
  const art = cardArt(card.id);
  const rarity = card.rarity ?? "common";

  return (
    <button
      className={cx(s["deck-card"], selected && s["is-selected"], card.upgraded && s["is-upgraded"])}
      type="button"
      style={{ "--owner-color": owner.color, "--i": index } as CSSProperties}
      onClick={onClick}
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
        <strong className={s["deck-card-name"]}>{card.name}</strong>
        <span className={s["deck-card-rarity"]}>{RARITY_LABEL[rarity]}</span>
      </span>
      <span className={s["deck-card-body"]}>
        <span className={s["deck-card-meta"]}>
          <span>{card.cardType === "fast" ? "速攻" : "普通"}</span>
          {card.upgraded && <span className={s["deck-card-upgraded"]}>已强化</span>}
        </span>
        <span className={s["deck-card-text"]}>{card.text}</span>
      </span>
    </button>
  );
}
