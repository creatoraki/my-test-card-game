// 卡牌美术大图集中登记处。手牌简写 / 详情浮窗 / 出牌亮相卡面等多处复用同一份映射,
// 新增带美术图的卡时只需在此登记一次。
import placeholderArt from "@/assets/占位素材.webp";
import basicAttackArt from "@/assets/skills/basic/基础攻击.webp";
import basicHealArt from "@/assets/skills/basic/基础治疗.webp";
import basicGuardArt from "@/assets/skills/basic/基础护盾.webp";
import swordsmanSnowflakeArt from "@/assets/skills/swordsman/雪花.webp";
import swordsmanFallenLeafArt from "@/assets/skills/swordsman/落叶.webp";
import swordsmanKagutsuchiArt from "@/assets/skills/swordsman/迦具土.webp";
import swordsmanBloodRuinArt from "@/assets/skills/swordsman/血坏.webp";
import swordsmanPhantomMoonArt from "@/assets/skills/swordsman/幻月.webp";
import swordsmanDeclutterArt from "@/assets/skills/swordsman/断舍离.webp";
import swordsmanRashomonArt from "@/assets/skills/swordsman/罗生门.webp";
import swordsmanCraneDanceArt from "@/assets/skills/swordsman/鹤舞.webp";
import swordsmanWhetstoneArt from "@/assets/skills/swordsman/武器研磨.webp";
import swordsmanCrowArt from "@/assets/skills/swordsman/鸦.webp";
import swordsmanGaleArt from "@/assets/skills/swordsman/岚.webp";
import swordsmanRiftLightArt from "@/assets/skills/swordsman/天隙流光.webp";
import swordsmanSpringSproutArt from "@/assets/skills/swordsman/春芽.webp";
import swordsmanFallingSakuraArt from "@/assets/skills/swordsman/落樱.webp";
import swordsmanWolfSparrowArt from "@/assets/skills/swordsman/狼雀.webp";
import prophetStarfallArt from "@/assets/skills/prophet/星瀑.webp";
import prophetGravityLensArt from "@/assets/skills/prophet/引力透镜.webp";
import prophetTwinStarsArt from "@/assets/skills/prophet/双子星.webp";
import prophetRingShotArt from "@/assets/skills/prophet/环射.webp";
import prophetAsteroidBeltArt from "@/assets/skills/prophet/小行星带.webp";
import prophetAstrologyArt from "@/assets/skills/prophet/占星术.webp";
import prophetCompanionStarArt from "@/assets/skills/prophet/伴星.webp";
import botanistContinuousShotArt from "@/assets/skills/botanist/双重射击.webp";
import botanistRecycleShotArt from "@/assets/skills/botanist/回收射击.webp";
import botanistTwinFlowerArt from "@/assets/skills/botanist/双生花.webp";
import botanistAgaveArt from "@/assets/skills/botanist/龙舌兰.webp";
import botanistPhotosynthesisArt from "@/assets/skills/botanist/光合储能.webp";
import botanistThornLashArt from "@/assets/skills/botanist/荆棘鞭击.webp";
import botanistSporeCloudArt from "@/assets/skills/botanist/孢子云雾.webp";
import botanistVineEntangleArt from "@/assets/skills/botanist/藤蔓缠绕.webp";
import botanistCactusArmorArt from "@/assets/skills/botanist/仙人掌护甲.webp";
import botanistInsectTrapArt from "@/assets/skills/botanist/食虫陷阱.webp";
import botanistSaltMossArt from "@/assets/skills/botanist/盐青苔.webp";
import botanistRootBondArt from "@/assets/skills/botanist/根系联结.webp";
import botanistPoisonMushroomArt from "@/assets/skills/botanist/毒蘑菇孢子.webp";
import botanistIvyShelterArt from "@/assets/skills/botanist/常春藤庇护.webp";
import botanistWitherSporeArt from "@/assets/skills/botanist/枯萎孢子.webp";
import botanistPurifyNectarArt from "@/assets/skills/botanist/净化甘露.webp";
import botanistBloodVineArt from "@/assets/skills/botanist/汲血蔓.webp";
import botanistGuidingCrownArt from "@/assets/skills/botanist/引路棘冠.webp";
import botanistNewLeafArt from "@/assets/skills/botanist/新叶萌发.webp";
import botanistChaoticSpikeArt from "@/assets/skills/botanist/乱刺散射.webp";
import alchemistUniversalComponentArt from "@/assets/skills/alchemist/万能配件.webp";
import alchemistCatalyticDetonationArt from "@/assets/skills/alchemist/催化引爆.webp";
import alchemistResonanceTuningArt from "@/assets/skills/alchemist/共振调谐.webp";
import alchemistUnfinishedProductArt from "@/assets/skills/alchemist/半成品.webp";
import alchemistRetortWallArt from "@/assets/skills/alchemist/反应釜壁.webp";
import alchemistRefluxPotionArt from "@/assets/skills/alchemist/回流药剂.webp";
import alchemistRejuvenationPotionArt from "@/assets/skills/alchemist/回生药剂.webp";
import alchemistConstantTemperatureCrucibleArt from "@/assets/skills/alchemist/恒温坩埚.webp";
import alchemistTonicPotionArt from "@/assets/skills/alchemist/滋补魔药.webp";
import alchemistInspirationPotionArt from "@/assets/skills/alchemist/灵感药剂.webp";
import alchemistPointGoldShotArt from "@/assets/skills/alchemist/点金试射.webp";
import alchemistEmberCoreResonanceArt from "@/assets/skills/alchemist/焰核共鸣.webp";
import alchemistPhaseSpreadArt from "@/assets/skills/alchemist/相位蔓延.webp";
import alchemistPhaseMembraneArt from "@/assets/skills/alchemist/相变护膜.webp";
import alchemistTerminalMixtureArt from "@/assets/skills/alchemist/终末合剂.webp";
import alchemistJadePlatingArt from "@/assets/skills/alchemist/翠玉镀层.webp";
import alchemistBoneAcidRainArt from "@/assets/skills/alchemist/腐骨酸雨.webp";
import alchemistBountyHunterArt from "@/assets/skills/alchemist/赏金猎人.webp";
import alchemistOverCatalysisArt from "@/assets/skills/alchemist/过量催化.webp";
import alchemistReverseDisassemblyArt from "@/assets/skills/alchemist/逆向拆解.webp";
import alchemistChainBurstArt from "@/assets/skills/alchemist/链式爆破.webp";
import actuaryInitialPremiumArt from "@/assets/skills/actuary/首期保费.webp";

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
  "actuary-basic-attack": basicAttackArt,
  "actuary-basic-heal": basicHealArt,
  "actuary-basic-guard": basicGuardArt,
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
  "starfall": prophetStarfallArt,
  "gravity-lens": prophetGravityLensArt,
  "twin-stars": prophetTwinStarsArt,
  "ring-shot": prophetRingShotArt,
  "asteroid-belt": prophetAsteroidBeltArt,
  "astrology": prophetAstrologyArt,
  "companion-star": prophetCompanionStarArt,
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
  "ignition-reagent": alchemistPointGoldShotArt,
  "bone-acid-rain": alchemistBoneAcidRainArt,
  "catalytic-detonation": alchemistCatalyticDetonationArt,
  "phase-spread": alchemistPhaseSpreadArt,
  "ember-core-resonance": alchemistEmberCoreResonanceArt,
  "terminal-mixture": alchemistTerminalMixtureArt,
  "jade-plating": alchemistJadePlatingArt,
  "retort-wall": alchemistRetortWallArt,
  "universal-component": alchemistUniversalComponentArt,
  "reverse-disassembly": alchemistReverseDisassemblyArt,
  "resonance-tuning": alchemistResonanceTuningArt,
  "constant-temperature-crucible": alchemistConstantTemperatureCrucibleArt,
  "unfinished-product": alchemistUnfinishedProductArt,
  "over-catalysis": alchemistOverCatalysisArt,
  "chain-burst": alchemistChainBurstArt,
  "phase-membrane": alchemistPhaseMembraneArt,
  "rejuvenation-potion": alchemistRejuvenationPotionArt,
  "tonic-potion": alchemistTonicPotionArt,
  "resonance-catalyst": alchemistRefluxPotionArt,
  "inspiration-potion": alchemistInspirationPotionArt,
  "bounty-hunter": alchemistBountyHunterArt,
  "initial-premium": actuaryInitialPremiumArt,
};

export const CARD_ART_SOURCES: readonly string[] = [...new Set([...Object.values(CARD_ART), placeholderArt])];

// 取某卡的美术大图 URL。未登记正式素材的卡统一使用占位图。
export function cardArt(cardId: string): string {
  return CARD_ART[cardId] ?? placeholderArt;
}
