// 卡牌美术大图集中登记处。手牌简写 / 详情浮窗 / 出牌亮相卡面等多处复用同一份映射,
// 新增带美术图的卡时只需在此登记一次。
import placeholderArt from "@/assets/占位素材.png";
import basicAttackArt from "@/assets/skills/basic/基础攻击.png";
import basicHealArt from "@/assets/skills/basic/基础治疗.png";
import basicGuardArt from "@/assets/skills/basic/基础护盾.png";
import swordsmanSnowflakeArt from "@/assets/skills/swordsman/雪花.png";
import swordsmanBuzzArt from "@/assets/skills/swordsman/蜂鸣.png";
import swordsmanSwarmArt from "@/assets/skills/swordsman/蜂群.png";
import swordsmanDeclutterArt from "@/assets/skills/swordsman/断舍离.png";
import swordsmanWhetstoneArt from "@/assets/skills/swordsman/武器研磨.png";
import swordsmanMirageArt from "@/assets/skills/swordsman/幻陇.png";
import swordsmanFireflyArt from "@/assets/skills/swordsman/萤火.png";
import swordsmanGaleArt from "@/assets/skills/swordsman/岚.png";
import swordsmanRiftLightArt from "@/assets/skills/swordsman/天隙流光.png";
import swordsmanSpringSproutArt from "@/assets/skills/swordsman/春芽.png";
import swordsmanStillWaterArt from "@/assets/skills/swordsman/止水.png";
import swordsmanBuzhouMountainArt from "@/assets/skills/swordsman/不周山.png";
import swordsmanCloudVeilArt from "@/assets/skills/swordsman/云隐.png";
import swordsmanFallingSakuraArt from "@/assets/skills/swordsman/落樱.png";
import swordsmanMoonShadowArt from "@/assets/skills/swordsman/月影.png";

export const CARD_ART: Record<string, string> = {
  "swordsman-basic-attack": basicAttackArt,
  "swordsman-basic-heal": basicHealArt,
  "swordsman-basic-guard": basicGuardArt,
  "prophet-basic-attack": basicAttackArt,
  "prophet-basic-heal": basicHealArt,
  "prophet-basic-guard": basicGuardArt,
  "botanist-basic-attack": basicAttackArt,
  "botanist-basic-heal": basicHealArt,
  "botanist-basic-guard": basicGuardArt,
  "snowflake": swordsmanSnowflakeArt,
  "buzz": swordsmanBuzzArt,
  "swarm": swordsmanSwarmArt,
  "declutter": swordsmanDeclutterArt,
  "whetstone": swordsmanWhetstoneArt,
  "mirage": swordsmanMirageArt,
  "firefly": swordsmanFireflyArt,
  "gale": swordsmanGaleArt,
  "rift-light": swordsmanRiftLightArt,
  "spring-sprout": swordsmanSpringSproutArt,
  "still-water": swordsmanStillWaterArt,
  "buzhou-mountain": swordsmanBuzhouMountainArt,
  "cloud-veil": swordsmanCloudVeilArt,
  "falling-sakura": swordsmanFallingSakuraArt,
  "moon-shadow": swordsmanMoonShadowArt,
  "continuous-shot": placeholderArt,
  "recycle-shot": placeholderArt,
  "twin-flower": placeholderArt,
  "agave": placeholderArt,
  "photosynthesis": placeholderArt,
};

export const CARD_ART_SOURCES: readonly string[] = [...new Set([...Object.values(CARD_ART), placeholderArt])];

// 取某卡的美术大图 URL。未登记正式素材的卡统一使用占位图。
export function cardArt(cardId: string): string {
  return CARD_ART[cardId] ?? placeholderArt;
}
