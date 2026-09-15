import { useCallback } from "react";
import type { ShopSlot } from "@/data/shop";
import { merchantBuyReason } from "@/explore/curio/merchant";
import type { ExploreState } from "@/explore/types";
import { canAddCopy, canAddRarity } from "@/store/deckCards";
import { useTownStore } from "@/store/townStore";
import { merchantIndexFromKey } from "./merchantShopSlots";

/** 货商购买判定：纯探索条件与卡组容量条件在 UI 侧合并成一个真相点。 */
export function useMerchantBuyReason(session: ExploreState): (slot: ShopSlot) => string | null {
  const characters = useTownStore((state) => state.characters);

  return useCallback((slot: ShopSlot) => {
    const index = merchantIndexFromKey(slot.key);
    if (index === null) return "当前无法交换";

    const reason = merchantBuyReason(session, index);
    if (reason || slot.kind !== "card") return reason;

    const character = characters[slot.charId];
    if (!character) return "商品失效";
    if (!canAddRarity(character.deck, slot.rarity)) return "卡组该稀有度已满";
    if (!canAddCopy(character.deck, slot.cardDefId)) return "该卡张数已满";
    return null;
  }, [characters, session]);
}
