// 统一商店详情栏：根据货位类型路由内容，并集中处理唯一购买按钮的状态。

import type { ShopSlot } from "@/data/shop";
import type { CharacterState } from "@/store/townStore";
import { canAddCopy, canAddRarity } from "@/store/deckCards";
import { cx } from "@/ui/common/cx";
import { MarketCardDetail } from "./MarketCardDetail";
import { MarketItemDetail } from "./MarketItemDetail";
import s from "./MarketDetail.module.css";

interface Props {
  slot: ShopSlot | null;
  characters: Record<string, CharacterState>;
  loot: number;
  onBuy: (key: string) => void;
}

function buyReason(
  slot: ShopSlot,
  characters: Record<string, CharacterState>,
  loot: number,
): string {
  if (slot.sold) return "已售出";
  if (loot < slot.price) return "积分不足";
  if (slot.kind !== "card") return "购买";

  const character = characters[slot.charId];
  if (!character) return "商品失效";
  if (!canAddRarity(character.deck, slot.rarity)) return "卡组该稀有度已满";
  if (!canAddCopy(character.deck, slot.cardDefId)) return "该卡张数已满";
  return "购买";
}

export function MarketDetail({ slot, characters, loot, onBuy }: Props) {
  if (!slot) {
    return (
      <aside className={s.detail}>
        <p className={s.empty}>选择货架上的商品查看详情</p>
      </aside>
    );
  }

  const reason = buyReason(slot, characters, loot);
  const disabled = reason !== "购买";
  return (
    <aside className={s.detail}>
      <div className={s.content}>
        {slot.kind === "card" ? <MarketCardDetail slot={slot} /> : <MarketItemDetail slot={slot} />}
      </div>
      <button
        className={cx(s.buy, (reason === "积分不足" || reason === "商品失效") && s["is-poor"])}
        type="button"
        disabled={disabled}
        aria-label={disabled ? reason : `购买商品，售价 ${slot.price} 居民积分`}
        onClick={() => onBuy(slot.key)}
      >
        {disabled ? reason : `购买 · ${slot.price} 积分`}
      </button>
    </aside>
  );
}
