import type { Card } from "../engine";
import { getCharacter } from "../data";
import { ManaCrystalIcon } from "./ManaCrystalIcon";

interface Props {
  card: Card;
  playable: boolean;
  selected: boolean;
  onClick?: () => void;
  onHover?: (hovering: boolean) => void;
}

// 左侧手牌条上的"小长方形简写"卡牌: 只展示必要信息(消耗 / 名称 / 普速)。
// 悬浮时向右弹出(见 styles.css .hand-card:hover), 并触发右侧详情抽屉。
export function HandCard({ card, playable, selected, onClick, onHover }: Props) {
  const owner = getCharacter(card.ownerCharId);
  return (
    <div
      className={[
        "hand-card",
        card.cardType,
        playable ? "playable" : "unplayable",
        selected ? "selected" : "",
        card.upgraded ? "upgraded" : "",
      ].join(" ")}
      style={{ borderLeftColor: owner.color }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      title={card.text}
    >
      <span className="hc-cost" title="消耗法力水晶">
        <ManaCrystalIcon className="mana-crystal hc-cost-crystal" />
        <span className="hc-cost-value">{card.cost}</span>
      </span>
      <span className="hc-name">{card.name}</span>
      <span className="hc-type" title={card.cardType === "fast" ? "速攻: 不推进时刻" : "普通: 推进 1 时刻"}>
        {card.cardType === "fast" ? "速" : "普"}
      </span>
    </div>
  );
}
