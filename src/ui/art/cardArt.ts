// 卡牌美术大图集中登记处。手牌简写 / 详情浮窗 / 出牌亮相卡面等多处复用同一份映射,
// 新增带美术图的卡时只需在此登记一次。
import whirlwindSlashArt from "@/assets/skills/swordsman/回旋斩.png";
import lightningInfusedArt from "@/assets/skills/swordsman/雷灌.png";
import skyRendArt from "@/assets/skills/swordsman/裂空.png";
// ⚠ 临时素材: 预言家 / 植物学家的技能还没有专属卡面, 先用 1:1 的占位素材。
import placeholderArt from "@/assets/占位素材.png";

export const CARD_ART: Record<string, string> = {
  "whirlwind-slash": whirlwindSlashArt,
  "lightning-infused": lightningInfusedArt,
  "sky-rend": skyRendArt,
  "prophet-basic-attack": placeholderArt,
  "botanist-basic-attack": placeholderArt,
};

export const CARD_ART_SOURCES: readonly string[] = [...new Set(Object.values(CARD_ART))];

// 取某卡的美术大图 URL(无图返回 undefined)。
export function cardArt(cardId: string): string | undefined {
  return CARD_ART[cardId];
}
