import type { Card } from "../engine";
import { getCharacter } from "../data";

interface Props {
  card: Card;
  playable: boolean;
  selected: boolean;
  onClick?: () => void;
}

export function CardView({ card, playable, selected, onClick }: Props) {
  const owner = getCharacter(card.ownerCharId);
  return (
    <div
      className={[
        "card",
        card.cardType,
        playable ? "playable" : "unplayable",
        selected ? "selected" : "",
        card.upgraded ? "upgraded" : "",
      ].join(" ")}
      style={{ borderColor: owner.color }}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick();
      }}
      title={card.text}
    >
      <div className="card-head">
        <span className="card-cost" title="消耗光">
          {card.cost}
        </span>
        <span className="card-type">{card.cardType === "fast" ? "速攻" : "普通"}</span>
      </div>
      <div className="card-owner" style={{ color: owner.color }}>
        {owner.emoji} {owner.name}
      </div>
      <div className="card-name">{card.name}</div>
      <div className="card-text">{card.text}</div>
    </div>
  );
}
