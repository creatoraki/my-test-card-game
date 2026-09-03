// 卡牌美术大图集中登记处。手牌简写 / 详情浮窗 / 出牌亮相卡面等多处复用同一份映射,
// 新增带美术图的卡时只需在此登记一次。
import placeholderArt from "@/assets/占位素材.png";
import basicAttackArt from "@/assets/skills/basic/基础攻击.png";
import basicHealArt from "@/assets/skills/basic/基础治疗.png";
import basicGuardArt from "@/assets/skills/basic/基础护盾.png";
import swordsmanSnowflakeArt from "@/assets/skills/swordsman/雪花.png";
import swordsmanFallenLeafArt from "@/assets/skills/swordsman/落叶.png";
import swordsmanKagutsuchiArt from "@/assets/skills/swordsman/迦具土.png";
import swordsmanBloodRuinArt from "@/assets/skills/swordsman/血坏.png";
import swordsmanPhantomMoonArt from "@/assets/skills/swordsman/幻月.png";
import swordsmanDeclutterArt from "@/assets/skills/swordsman/断舍离.png";
import swordsmanRashomonArt from "@/assets/skills/swordsman/罗生门.png";
import swordsmanCraneDanceArt from "@/assets/skills/swordsman/鹤舞.png";
import swordsmanWhetstoneArt from "@/assets/skills/swordsman/武器研磨.png";
import swordsmanCrowArt from "@/assets/skills/swordsman/鸦.png";
import swordsmanGaleArt from "@/assets/skills/swordsman/岚.png";
import swordsmanRiftLightArt from "@/assets/skills/swordsman/天隙流光.png";
import swordsmanSpringSproutArt from "@/assets/skills/swordsman/春芽.png";
import swordsmanFallingSakuraArt from "@/assets/skills/swordsman/落樱.png";
import swordsmanWolfSparrowArt from "@/assets/skills/swordsman/狼雀.png";
import prophetEmergencyTreatmentArt from "@/assets/skills/prophet/紧急救治.png";
import botanistContinuousShotArt from "@/assets/skills/botanist/双重射击.png";
import botanistRecycleShotArt from "@/assets/skills/botanist/回收射击.png";
import botanistTwinFlowerArt from "@/assets/skills/botanist/双生花.png";
import botanistAgaveArt from "@/assets/skills/botanist/龙舌兰.png";
import botanistPhotosynthesisArt from "@/assets/skills/botanist/光合储能.png";
import botanistThornLashArt from "@/assets/skills/botanist/荆棘鞭击.png";
import botanistSporeCloudArt from "@/assets/skills/botanist/孢子云雾.png";
import botanistVineEntangleArt from "@/assets/skills/botanist/藤蔓缠绕.png";
import botanistCactusArmorArt from "@/assets/skills/botanist/仙人掌护甲.png";
import botanistInsectTrapArt from "@/assets/skills/botanist/食虫陷阱.png";
import botanistSaltMossArt from "@/assets/skills/botanist/盐青苔.png";
import botanistRootBondArt from "@/assets/skills/botanist/根系联结.png";
import botanistPoisonMushroomArt from "@/assets/skills/botanist/毒蘑菇孢子.png";
import botanistIvyShelterArt from "@/assets/skills/botanist/常春藤庇护.png";
import botanistWitherSporeArt from "@/assets/skills/botanist/枯萎孢子.png";
import botanistPurifyNectarArt from "@/assets/skills/botanist/净化甘露.png";
import botanistBloodVineArt from "@/assets/skills/botanist/汲血蔓.png";
import botanistGuidingCrownArt from "@/assets/skills/botanist/引路棘冠.png";
import botanistNewLeafArt from "@/assets/skills/botanist/新叶萌发.png";
import botanistChaoticSpikeArt from "@/assets/skills/botanist/乱刺散射.png";

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
  "alchemist-basic-attack": basicAttackArt,
  "alchemist-basic-heal": basicHealArt,
  "alchemist-basic-guard": basicGuardArt,
  "snowflake": swordsmanSnowflakeArt,
  "fallen-leaf": swordsmanFallenLeafArt,
  "kagutsuchi": swordsmanKagutsuchiArt,
  "blood-ruin": swordsmanBloodRuinArt,
  "phantom-moon": swordsmanPhantomMoonArt,
  "declutter": swordsmanDeclutterArt,
  "rashomon": swordsmanRashomonArt,
  "crane-dance": swordsmanCraneDanceArt,
  "whetstone": swordsmanWhetstoneArt,
  "crow": swordsmanCrowArt,
  "gale": swordsmanGaleArt,
  "rift-light": swordsmanRiftLightArt,
  "spring-sprout": swordsmanSpringSproutArt,
  "falling-sakura": swordsmanFallingSakuraArt,
  "wolf-sparrow": swordsmanWolfSparrowArt,
  "emergency-treatment": prophetEmergencyTreatmentArt,
  "continuous-shot": botanistContinuousShotArt,
  "recycle-shot": botanistRecycleShotArt,
  "twin-flower": botanistTwinFlowerArt,
  "agave": botanistAgaveArt,
  "photosynthesis": botanistPhotosynthesisArt,
  "thorn-lash": botanistThornLashArt,
  "spore-cloud": botanistSporeCloudArt,
  "vine-entangle": botanistVineEntangleArt,
  "cactus-armor": botanistCactusArmorArt,
  "insect-trap": botanistInsectTrapArt,
  "salt-moss": botanistSaltMossArt,
  "root-bond": botanistRootBondArt,
  "poison-mushroom": botanistPoisonMushroomArt,
  "ivy-shelter": botanistIvyShelterArt,
  "wither-spore": botanistWitherSporeArt,
  "purify-nectar": botanistPurifyNectarArt,
  "blood-vine": botanistBloodVineArt,
  "guiding-crown": botanistGuidingCrownArt,
  "new-leaf": botanistNewLeafArt,
  "chaotic-spike": botanistChaoticSpikeArt,
};

export const CARD_ART_SOURCES: readonly string[] = [...new Set([...Object.values(CARD_ART), placeholderArt])];

// 取某卡的美术大图 URL。未登记正式素材的卡统一使用占位图。
export function cardArt(cardId: string): string {
  return CARD_ART[cardId] ?? placeholderArt;
}
