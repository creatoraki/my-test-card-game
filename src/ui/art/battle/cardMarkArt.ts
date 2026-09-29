// 卡牌增益标记素材集中登记处；卡牌标记与战斗状态使用不同的 id 体系。
import swordMoundArt from "@/assets/buffs/buffs/剑冢.webp";
import dominoArt from "@/assets/buffs/buffs/多米诺.webp";
import cometTailArt from "@/assets/buffs/buffs/彗尾.webp";
import mindsEyeArt from "@/assets/buffs/buffs/心眼.webp";
import starPactArt from "@/assets/buffs/buffs/星契.webp";
import heavyArt from "@/assets/buffs/buffs/沉重.webp";
import streamerArt from "@/assets/buffs/buffs/流光.webp";
import scorchingArt from "@/assets/buffs/buffs/灼热.webp";
import divineSightArt from "@/assets/buffs/buffs/神眼.webp";
import notoArt from "@/assets/buffs/buffs/纳刀.webp";
import countercurrentArt from "@/assets/buffs/buffs/逆流.webp";

export const CARD_MARK_ART: Record<string, string> = {
  swordMound: swordMoundArt,
  domino: dominoArt,
  cometTail: cometTailArt,
  mindsEye: mindsEyeArt,
  starPact: starPactArt,
  heavy: heavyArt,
  streamer: streamerArt,
  scorching: scorchingArt,
  divineSight: divineSightArt,
  noto: notoArt,
  countercurrent: countercurrentArt,
};

export const CARD_MARK_ART_SOURCES: readonly string[] = Object.values(CARD_MARK_ART);

export function cardMarkArtOf(id: string): string | undefined {
  return CARD_MARK_ART[id];
}
