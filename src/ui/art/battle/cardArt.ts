// 卡牌美术大图集中登记处。手牌简写 / 详情浮窗 / 出牌亮相卡面等多处复用同一份映射,
// 新增带美术图的卡时只需在此登记一次。
import placeholderArt from "@/assets/占位素材.webp";
import basicAttackArt from "@/assets/skills/basic/基础攻击.webp";
import basicHealArt from "@/assets/skills/basic/基础治疗.webp";
import basicGuardArt from "@/assets/skills/basic/基础护盾.webp";
import { SWORDSMAN_CARD_ART } from "./swordsmanCardArt";
import { HEXER_CARD_ART } from "./hexerCardArt";
import { ACTUARY_CARD_ART } from "./actuaryCardArt";
import prophetAndromedaArt from "@/assets/skills/prophet/仙女座.webp";
import prophetSpectralDecompositionArt from "@/assets/skills/prophet/光谱分解.webp";
import prophetSpectralShardArt from "@/assets/skills/prophet/光谱碎片.webp";
import prophetIllOmenArt from "@/assets/skills/prophet/凶兆.webp";
import prophetStarfallArt from "@/assets/skills/prophet/星瀑.webp";
import prophetGravityLensArt from "@/assets/skills/prophet/引力透镜.webp";
import prophetTwinStarsArt from "@/assets/skills/prophet/双子星.webp";
import prophetGoodOmenArt from "@/assets/skills/prophet/吉兆.webp";
import prophetFallingStarSequenceArt from "@/assets/skills/prophet/坠星序列.webp";
import prophetDominoArt from "@/assets/skills/prophet/多米诺.webp";
import prophetApocalypseArt from "@/assets/skills/prophet/天启.webp";
import prophetCelestialVerdictArt from "@/assets/skills/prophet/天穹断罪.webp";
import prophetZenithStarArt from "@/assets/skills/prophet/天顶星.webp";
import prophetSolarWindArt from "@/assets/skills/prophet/太阳风.webp";
import prophetEmergencyCareArt from "@/assets/skills/prophet/紧急医疗.webp";
import prophetGravityTowArt from "@/assets/skills/prophet/引力牵引.webp";
import prophetStarCurtainArt from "@/assets/skills/prophet/星幕.webp";
import prophetGalaxyCascadeArt from "@/assets/skills/prophet/星河倒泻.webp";
import prophetAuroraArt from "@/assets/skills/prophet/极光.webp";
import prophetDriftArt from "@/assets/skills/prophet/漂流.webp";
import prophetBrandArt from "@/assets/skills/prophet/烙印.webp";
import prophetRingShotArt from "@/assets/skills/prophet/环射.webp";
import prophetMoonLandingArt from "@/assets/skills/prophet/登月.webp";
import prophetStarShatterArt from "@/assets/skills/prophet/碎星.webp";
import prophetCountercurrentArt from "@/assets/skills/prophet/逆流.webp";
import prophetMilkyWayArt from "@/assets/skills/prophet/银河.webp";
import prophetOmenArt from "@/assets/skills/prophet/预兆.webp";
import prophetForesightEyeArt from "@/assets/skills/prophet/预知魔眼.webp";
import prophetBlackHoleArt from "@/assets/skills/prophet/黑洞.webp";
import prophetAsteroidBeltArt from "@/assets/skills/prophet/小行星带.webp";
import prophetAstrologyArt from "@/assets/skills/prophet/占星术.webp";
import prophetCompanionStarArt from "@/assets/skills/prophet/伴星.webp";
import { BOTANIST_CARD_ART } from "./botanistCardArt";
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
import alchemistEmberAnnihilationArt from "@/assets/skills/alchemist/烬灭.webp";
import alchemistThermalRecoveryArt from "@/assets/skills/alchemist/热能回收.webp";
import alchemistPhlogistonBlastArt from "@/assets/skills/alchemist/燃素爆燃.webp";
import alchemistAquaRegiaEtchArt from "@/assets/skills/alchemist/王水蚀刻.webp";
import alchemistBufferSolutionArt from "@/assets/skills/alchemist/缓冲溶液.webp";
import alchemistOuroborosArt from "@/assets/skills/alchemist/衔尾蛇.webp";
import alchemistHarmonicDraughtArt from "@/assets/skills/alchemist/谐波药剂.webp";
import alchemistPhilosophersStoneArt from "@/assets/skills/alchemist/贤者之石.webp";
import alchemistEmberWallArt from "@/assets/skills/alchemist/余烬护壁.webp";
import alchemistResonanceCrystalArt from "@/assets/skills/alchemist/共振晶簇.webp";
import alchemistResonanceCollapseArt from "@/assets/skills/alchemist/共鸣崩解.webp";
import alchemistResonanceForkArt from "@/assets/skills/alchemist/共鸣音叉.webp";
import alchemistRosinAccelerantArt from "@/assets/skills/alchemist/助燃松脂.webp";
import alchemistBiphasicDraughtArt from "@/assets/skills/alchemist/双相药剂.webp";
import alchemistPurificationArt from "@/assets/skills/alchemist/提纯.webp";
import alchemistEternalFurnaceCoreArt from "@/assets/skills/alchemist/永燃炉芯.webp";
import alchemistMercuryVaporArt from "@/assets/skills/alchemist/汞蒸气.webp";
import alchemistQuenchCoatingArt from "@/assets/skills/alchemist/淬火涂层.webp";

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
  "hexer-basic-attack": basicAttackArt,
  "hexer-basic-heal": basicHealArt,
  "hexer-basic-guard": basicGuardArt,
  ...SWORDSMAN_CARD_ART,
  ...HEXER_CARD_ART,
  ...ACTUARY_CARD_ART,
  "star-shatter": prophetStarShatterArt,
  "countercurrent": prophetCountercurrentArt,
  "moon-landing": prophetMoonLandingArt,
  "celestial-verdict": prophetCelestialVerdictArt,
  "star-curtain": prophetStarCurtainArt,
  "brand": prophetBrandArt,
  "falling-star-sequence": prophetFallingStarSequenceArt,
  "galaxy-cascade": prophetGalaxyCascadeArt,
  "good-omen": prophetGoodOmenArt,
  "omen": prophetOmenArt,
  "ill-omen": prophetIllOmenArt,
  "apocalypse": prophetApocalypseArt,
  "zenith-star": prophetZenithStarArt,
  "emergency-care": prophetEmergencyCareArt,
  "solar-wind": prophetSolarWindArt,
  "andromeda": prophetAndromedaArt,
  "drift": prophetDriftArt,
  "aurora": prophetAuroraArt,
  "gravity-tow": prophetGravityTowArt,
  "starfall": prophetStarfallArt,
  "gravity-lens": prophetGravityLensArt,
  "twin-stars": prophetTwinStarsArt,
  "ring-shot": prophetRingShotArt,
  "asteroid-belt": prophetAsteroidBeltArt,
  "astrology": prophetAstrologyArt,
  "companion-star": prophetCompanionStarArt,
  "foresight-eye": prophetForesightEyeArt,
  "black-hole": prophetBlackHoleArt,
  "spectral-decomposition": prophetSpectralDecompositionArt,
  "milky-way": prophetMilkyWayArt,
  "spectral-shard": prophetSpectralShardArt,
  "domino": prophetDominoArt,
  ...BOTANIST_CARD_ART,
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
  "ember-annihilation": alchemistEmberAnnihilationArt,
  "thermal-recovery": alchemistThermalRecoveryArt,
  "phlogiston-blast": alchemistPhlogistonBlastArt,
  "aqua-regia-etch": alchemistAquaRegiaEtchArt,
  "buffer-solution": alchemistBufferSolutionArt,
  "ouroboros": alchemistOuroborosArt,
  "harmonic-draught": alchemistHarmonicDraughtArt,
  "philosophers-stone": alchemistPhilosophersStoneArt,
  "ember-wall": alchemistEmberWallArt,
  "resonance-crystal": alchemistResonanceCrystalArt,
  "resonance-collapse": alchemistResonanceCollapseArt,
  "resonance-fork": alchemistResonanceForkArt,
  "rosin-accelerant": alchemistRosinAccelerantArt,
  "biphasic-draught": alchemistBiphasicDraughtArt,
  "purification": alchemistPurificationArt,
  "eternal-furnace-core": alchemistEternalFurnaceCoreArt,
  "mercury-vapor": alchemistMercuryVaporArt,
  "quench-coating": alchemistQuenchCoatingArt,
};

export const CARD_ART_SOURCES: readonly string[] = [...new Set([...Object.values(CARD_ART), placeholderArt])];

// 取某卡的美术大图 URL。未登记正式素材的卡统一使用占位图。
export function cardArt(cardId: string): string {
  return CARD_ART[cardId] ?? placeholderArt;
}
