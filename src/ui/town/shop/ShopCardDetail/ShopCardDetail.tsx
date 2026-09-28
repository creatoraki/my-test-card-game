// 卡牌详情的展示组装层：商店货架与博物馆图鉴共用，视觉外壳统一由 ShopDetailCard 承载。

import type { CSSProperties } from "react";
import type { Card } from "@/engine";
import { cardDisplayName, cardKeywordsIn } from "@/engine";
import { getCharacter } from "@/data";
import { cardArt } from "@/ui/art/battle/cardArt";
import { useCardText } from "@/ui/common/shared/cardTextFormat";
import { CardKeywordNotes } from "@/ui/common/card/CardKeywordNotes";
import { CardTextRich } from "@/ui/common/card/CardTextRich";
import { ShopDetailCard } from "../ShopDetailCard";
import detailStyles from "../ShopDetailCard/ShopDetailCard.module.css";
import s from "./ShopCardDetail.module.css";

const RARITY_LABEL: Record<string, string> = {
  basic: "基础",
  common: "普通",
  uncommon: "罕见",
  rare: "稀有",
};

const CARD_TYPE_LABEL: Record<string, string> = {
  normal: "普通",
  fast: "迅捷",
  passive: "被动",
};

interface Props {
  card: Card;
  /** 切换卡牌时驱动详情入场动画。 */
  animKey: string;
}

export function ShopCardDetail({ card, animKey }: Props) {
  const owner = getCharacter(card.ownerCharId);
  // 与立牌(HandCard)同一条文案管线: {0}/{d0}/{k0}/{c} 需按角色面板属性换算成真实数值,
  // 直接用 card.text 会把占位符原样显示出来。
  const text = useCardText(card);
  const hasKeywordNotes = cardKeywordsIn(text).length > 0;

  return (
    <ShopDetailCard
      animKey={animKey}
      stage={<img src={cardArt(card.id)} alt="" />}
      title={cardDisplayName(card)}
      titleMeta={(
        <span className={detailStyles["sx-card-chip"]}>
          {card.cardType === "passive" ? "被动" : `${card.cost} 法力`}
        </span>
      )}
      tags={(
        <>
          <span className={detailStyles["sx-card-rarity"]}>{RARITY_LABEL[card.rarity ?? "common"] ?? "普通"}</span>
          <span className={s.separator} aria-hidden="true">·</span>
          <span className={s.owner} style={{ "--owner-color": owner.color } as CSSProperties}>{owner.name}</span>
          <span className={s.separator} aria-hidden="true">·</span>
          <span>{CARD_TYPE_LABEL[card.cardType]}</span>
        </>
      )}
      desc={<CardTextRich text={text} />}
      extra={hasKeywordNotes ? <CardKeywordNotes text={text} card={card} className={s.notes} /> : undefined}
    />
  );
}
