// 卡牌详情的数据组装层。购买按钮统一由 MarketDetail 承载。

import { useMemo, type CSSProperties } from "react";
import { cardDisplayName, cardKeywordsIn } from "@/engine";
import { getCharacter, makeCard } from "@/data";
import type { ShopCardSlot } from "@/data/shop";
import { cardArt } from "@/ui/art/cardArt";
import { useCardText } from "@/ui/common/cardText";
import { CardKeywordNotes } from "@/ui/common/CardKeywordNotes";
import { CardTextRich } from "@/ui/common/CardTextRich";
import { ShopDetailCard } from "@/ui/town/shop/ShopDetailCard";
import detailStyles from "@/ui/town/shop/ShopDetailCard/ShopDetailCard.module.css";
import s from "./MarketCardDetail.module.css";

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

export function MarketCardDetail({ slot }: { slot: ShopCardSlot }) {
  const card = useMemo(
    () => ({ ...makeCard(slot.cardDefId), ownerCharId: slot.charId }),
    [slot.cardDefId, slot.charId],
  );
  const owner = getCharacter(slot.charId);
  // 与货架立牌(HandCard)同一条文案管线: {0}/{d0}/{k0}/{c} 需按角色面板属性换算成真实数值,
  // 直接用 card.text 会把占位符原样显示出来。
  const text = useCardText(card);
  const hasKeywordNotes = cardKeywordsIn(text).length > 0;

  return (
    <ShopDetailCard
      animKey={slot.key}
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
