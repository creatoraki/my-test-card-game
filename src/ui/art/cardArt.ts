// 卡牌美术大图集中登记处。手牌简写 / 详情浮窗 / 出牌亮相卡面等多处复用同一份映射,
// 新增带美术图的卡时只需在此登记一次。
import basicAttackArt from "@/assets/skills/basic/基础攻击.png";
import basicHealArt from "@/assets/skills/basic/基础治疗.png";
import basicGuardArt from "@/assets/skills/basic/基础护盾.png";
import swordsmanSnowflakeArt from "@/assets/skills/swordsman/雪花.png";
import swordsmanBuzzArt from "@/assets/skills/swordsman/蜂鸣.png";
import swordsmanSwarmArt from "@/assets/skills/swordsman/蜂群.png";
import swordsmanDeclutterArt from "@/assets/skills/swordsman/断舍离.png";

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
};

export const CARD_ART_SOURCES: readonly string[] = [...new Set(Object.values(CARD_ART))];

// 取某卡的美术大图 URL(无图返回 undefined)。
export function cardArt(cardId: string): string | undefined {
  return CARD_ART[cardId];
}
