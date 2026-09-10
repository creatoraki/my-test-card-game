// 卡牌详情内容。购买按钮统一由 MarketDetail 承载，这里只负责展示卡面和卡牌说明。

import { useMemo, type CSSProperties } from "react";
import { getCharacter, makeCard } from "@/data";
import type { ShopCardSlot } from "@/data/shop";
import { HandCard } from "@/ui/battle/HandCard";
import { CardKeywordNotes } from "@/ui/common/CardKeywordNotes";
import s from "./MarketCardDetail.module.css";

const RARITY_LABEL: Record<string, string> = {
  common: "普通",
  uncommon: "罕见",
  rare: "稀有",
  basic: "基础",
};

const DETAIL_CARD_STYLE = {
  "--hand-card-w": "240px",
  "--hc-text-h": "96px",
  "--hand-card-h": "336px",
} as CSSProperties;

export function MarketCardDetail({ slot }: { slot: ShopCardSlot }) {
  const card = useMemo(
    () => ({ ...makeCard(slot.cardDefId), ownerCharId: slot.charId }),
    [slot.cardDefId, slot.charId],
  );
  const owner = getCharacter(slot.charId);

  return (
    <div className={s.cardContent}>
      <div className={s.card} data-deck-card style={DETAIL_CARD_STYLE}>
        <HandCard card={card} variant="pile" playable selected={false} />
      </div>
      <div className={s.copy}>
        <span className={s.kicker} style={{ "--owner-color": owner.color } as CSSProperties}>
          {owner.name}
        </span>
        <h4 className={s.name}>{card.name}</h4>
        <p className={s.meta}>{card.cost} 点法力 · {RARITY_LABEL[card.rarity ?? "common"] ?? "普通"} · 售价 {slot.price} 积分</p>
        <p className={s.text}>{card.text}</p>
        <CardKeywordNotes text={card.text} className={s.notes} />
      </div>
    </div>
  );
}
