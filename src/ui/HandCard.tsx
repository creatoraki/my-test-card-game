import type { Card } from "../engine";
import { getCharacter } from "../data";
import { ManaCrystalIcon } from "./ManaCrystalIcon";
import { cardArt } from "./cardArt";

interface Props {
  card: Card;
  playable: boolean;
  selected: boolean;
  leaving?: boolean; // true: 出牌/丢弃后向右出鞘渐隐(见 styles.css .hand-card.leaving)
  dealIndex?: number; // 抽牌飞入的错峰序号(--deal-i), 让手牌一张张依次飞入
  onExited?: () => void; // 出鞘动画播完 → 通知父级把它从渲染列表移除
  onClick?: () => void;
  onHover?: (hovering: boolean, rect?: DOMRect) => void;
}

// 左侧手牌条上的"小长方形简写"卡牌: 只展示必要信息(消耗 / 名称 / 普速)。
// 悬浮时向右弹出(见 styles.css .hand-card:hover), 并触发右侧详情抽屉。
export function HandCard({ card, playable, selected, leaving, dealIndex, onExited, onClick, onHover }: Props) {
  const owner = getCharacter(card.ownerCharId);
  const art = cardArt(card.id);
  const hasArt = Boolean(art);
  const handStyle = {
    borderLeftColor: owner.color,
    ["--deal-i" as string]: dealIndex ?? 0,
    ...(hasArt
      ? {
          ["--hand-art" as string]: `url(${art})`,
          ["--hand-art-offset-y" as string]: `${card.handArtOffsetY ?? 0}px`,
        }
      : {}),
  } as React.CSSProperties;

  return (
    <div
      className={[
        "hand-card",
        hasArt ? "has-art" : "",
        card.cardType,
        playable ? "playable" : "unplayable",
        selected ? "selected" : "",
        leaving ? "leaving" : "",
        card.upgraded ? "upgraded" : "",
      ].join(" ")}
      style={handStyle}
      onTransitionEnd={(e) => {
        // 出鞘过渡(位移)结束 → 通知父级把它移出渲染列表
        if (leaving && e.propertyName === "transform") onExited?.();
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (leaving) return;
        onClick?.();
      }}
      onMouseEnter={(e) => !leaving && onHover?.(true, e.currentTarget.getBoundingClientRect())}
      onMouseLeave={() => onHover?.(false)}
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
