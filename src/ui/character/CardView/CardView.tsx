import type { Card } from "@/engine";
import { getCharacter } from "@/data";
import { ManaCrystal } from "@/ui/common/ManaCrystal";
import { useCardText } from "@/ui/common/cardText";
import { cx } from "@/ui/common/cx";
import s from "./CardView.module.css";

interface Props {
  card: Card;
  playable: boolean;
  selected: boolean;
  onClick?: () => void;
}

export function CardView({ card, playable, selected, onClick }: Props) {
  const owner = getCharacter(card.ownerCharId);
  const text = useCardText(card);
  return (
    <div
      className={cx(
        s["card"],
        s[card.cardType],
        playable ? s["playable"] : s["unplayable"],
        selected && s["selected"],
        card.upgraded && s["upgraded"],
        card.contaminated && s["contaminated"],
      )}
      style={{ borderColor: owner.color }}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick();
      }}
      title={text}
    >
      <div className={s["card-head"]}>
        <span className={s["card-cost"]} title="消耗法力水晶">
          <ManaCrystal className={s["card-cost-crystal"]} still />
          <span className={s["card-cost-value"]}>{card.cost}</span>
        </span>
        <span className={s["card-type"]}>{card.cardType === "fast" ? "速攻" : "普通"}</span>
      </div>
      {card.contaminated && (
        <span className={s["pollution-mark"]} title="污染卡 · 抽到时污染值 +2" aria-label="污染卡">
          ☣
        </span>
      )}
      <div className={s["card-owner"]} style={{ color: owner.color }}>
        {owner.emoji} {owner.name}
      </div>
      <div className={s["card-name"]}>{card.name}</div>
      <div className={s["card-text"]}>{text}</div>
    </div>
  );
}
