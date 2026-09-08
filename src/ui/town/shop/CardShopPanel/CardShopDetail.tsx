// 卡牌商店右栏详情格: 放大卡面 + 归属/费用/稀有度 + 卡牌文本 + 关键词说明 + 唯一的购买入口。

import { useMemo, type CSSProperties } from "react";
import { getCharacter, makeCard } from "@/data";
import type { CardShopSlot } from "@/store/cardShopSlice";
import { HandCard } from "@/ui/battle/HandCard";
import { CardKeywordNotes } from "@/ui/common/CardKeywordNotes";
import { cx } from "@/ui/common/cx";
import s from "./CardShopDetail.module.css";

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

interface Props {
  slot: CardShopSlot | null;
  loot: number;
  onBuy: (key: string) => void;
}

export function CardShopDetail({ slot, loot, onBuy }: Props) {
  const card = useMemo(
    () => slot ? { ...makeCard(slot.cardDefId), ownerCharId: slot.charId } : null,
    [slot?.cardDefId, slot?.charId],
  );

  if (!slot || !card) {
    return (
      <aside className={s.detail}>
        <p className={s.empty}>选择货架上的卡牌查看详情</p>
      </aside>
    );
  }

  const owner = getCharacter(slot.charId);
  const affordable = loot >= slot.price;
  const label = slot.sold ? "已售出" : affordable ? `购买 · ${slot.price} 积分` : "积分不足";

  return (
    <aside className={s.detail}>
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

      <button
        className={cx(s.buy, !slot.sold && !affordable && s["is-poor"])}
        type="button"
        disabled={slot.sold || !affordable}
        aria-label={slot.sold ? `${card.name} 已售出` : `购买 ${card.name}，售价 ${slot.price} 居民积分`}
        onClick={() => onBuy(slot.key)}
      >
        {label}
      </button>
    </aside>
  );
}
