// 卡牌增益标记素材集中登记处；卡牌标记与战斗状态使用不同的 id 体系。
import swordMoundArt from "@/assets/buffs/标记/卡牌标记/剑冢.webp";
import dominoArt from "@/assets/buffs/标记/卡牌标记/多米诺.webp";
import cometTailArt from "@/assets/buffs/标记/卡牌标记/彗尾.webp";
import mindsEyeArt from "@/assets/buffs/标记/卡牌标记/心眼.webp";
import starPactArt from "@/assets/buffs/标记/卡牌标记/星契.webp";
import heavyArt from "@/assets/buffs/标记/卡牌标记/沉重.webp";
import streamerArt from "@/assets/buffs/标记/卡牌标记/流光.webp";
import scorchingArt from "@/assets/buffs/标记/卡牌标记/灼热.webp";
import divineSightArt from "@/assets/buffs/标记/卡牌标记/神眼.webp";
import notoArt from "@/assets/buffs/标记/卡牌标记/纳刀.webp";
import countercurrentArt from "@/assets/buffs/标记/卡牌标记/逆流.webp";
// 孢囊暂无专属图标，借用孢子状态图。
import sporeSacArt from "@/assets/buffs/状态/触发联动/孢子.webp";

export const CARD_MARK_ART: Record<string, string> = {
  swordMound: swordMoundArt,
  domino: dominoArt,
  cometTail: cometTailArt,
  mindsEye: mindsEyeArt,
  starPact: starPactArt,
  heavy: heavyArt,
  // 回手负担与沉重同属「费用加重」语义, 共用同一枚图标。
  returnTax: heavyArt,
  streamer: streamerArt,
  scorching: scorchingArt,
  divineSight: divineSightArt,
  noto: notoArt,
  countercurrent: countercurrentArt,
  sporeSac: sporeSacArt,
};

export const CARD_MARK_ART_SOURCES: readonly string[] = [...new Set(Object.values(CARD_MARK_ART))];

export function cardMarkArtOf(id: string): string | undefined {
  return CARD_MARK_ART[id];
}
