// 卡牌美术大图集中登记处。手牌简写 / 详情浮窗 / 出牌亮相卡面等多处复用同一份映射,
// 新增带美术图的卡时只需在此登记一次。
// ⚠ 临时素材: 基础卡还没有专属卡面, 先用 1:1 的占位素材。
import placeholderArt from "@/assets/占位素材.png";

export const CARD_ART: Record<string, string> = {
  "swordsman-basic-attack": placeholderArt,
  "swordsman-basic-heal": placeholderArt,
  "swordsman-basic-guard": placeholderArt,
  "prophet-basic-attack": placeholderArt,
  "prophet-basic-heal": placeholderArt,
  "prophet-basic-guard": placeholderArt,
  "botanist-basic-attack": placeholderArt,
  "botanist-basic-heal": placeholderArt,
  "botanist-basic-guard": placeholderArt,
};

export const CARD_ART_SOURCES: readonly string[] = [...new Set(Object.values(CARD_ART))];

// 取某卡的美术大图 URL(无图返回 undefined)。
export function cardArt(cardId: string): string | undefined {
  return CARD_ART[cardId];
}
