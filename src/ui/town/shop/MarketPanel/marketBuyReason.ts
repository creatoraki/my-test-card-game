import type { ShopSlot } from "@/data/shop";
import type { CharacterState } from "@/store/townStore";
import { canAddCopy, canAddRarity } from "@/store/deckCards";

/**
 * 商店货位的购买状态真相点。
 * 价格牌和详情内容分属不同组件，但必须共享同一套购买条件。
 */
export function marketBuyReason(
  slot: ShopSlot,
  characters: Record<string, CharacterState>,
  loot: number,
): string | null {
  if (slot.sold) return "已售出";
  if (loot < slot.price) return "积分不足";
  if (slot.kind !== "card") return null;

  const character = characters[slot.charId];
  if (!character) return "商品失效";
  if (!canAddRarity(character.deck, slot.rarity)) return "卡组该稀有度已满";
  if (!canAddCopy(character.deck, slot.cardDefId)) return "该卡张数已满";
  return null;
}
