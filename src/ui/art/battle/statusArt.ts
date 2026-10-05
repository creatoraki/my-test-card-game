// 新增状态美术只在此登记一次，StatusPips 与 HitFxLayer 自动生效。
// 四宫格状态图必须使用 `node scripts/crop-status-buffs.mjs <四宫格原图路径>` 切图；
// 切分后的素材按状态实际目录登记，不要手动截屏取图。

import { HEXER_STATUS_ART } from "./hexerStatusArt";
import poisonArt from "@/assets/buffs/dot/中毒.webp";
import shieldArt from "@/assets/buffs/护盾.webp";
import burnArt from "@/assets/buffs/dot/灼烧.webp";
import regenArt from "@/assets/buffs/dot/再生.webp";
import flammableArt from "@/assets/buffs/debuffs/易燃.webp";
import scorchedArt from "@/assets/buffs/debuffs/焦灼.webp";
import pierceArt from "@/assets/buffs/debuffs/穿孔.webp";
import sharpArt from "@/assets/buffs/锋利.webp";
import insuranceArt from "@/assets/buffs/buffs/保险.webp";
import tauntArt from "@/assets/buffs/buffs/嘲讽.webp";
import weakArt from "@/assets/buffs/debuffs/虚弱.webp";
import attackDownArt from "@/assets/buffs/debuffs/萎靡.webp";
import blindArt from "@/assets/buffs/debuffs/致盲.webp";
import armorBreakArt from "@/assets/buffs/debuffs/破甲.webp";
import jamArt from "@/assets/buffs/debuffs/电磁干扰.webp";
import vulnerableArt from "@/assets/buffs/debuffs/易伤.webp";
import chargedShellArt from "@/assets/buffs/buffs/充能外壳.webp";
import retortWallArt from "@/assets/buffs/buffs/反应釜壁.webp";
import overloadArt from "@/assets/buffs/buffs/过载.webp";
import echoArt from "@/assets/buffs/buffs/回响.webp";
import feignInjuryArt from "@/assets/buffs/buffs/假装受伤.webp";
import strengthArt from "@/assets/buffs/buffs/力量.webp";
import tequilaArt from "@/assets/buffs/buffs/龙舌兰.webp";
import rashomonArt from "@/assets/buffs/buffs/罗生门.webp";
import deductibleArt from "@/assets/buffs/buffs/免赔.webp";
import bountyHunterArt from "@/assets/buffs/buffs/赏金猎人.webp";
import vitalityArt from "@/assets/buffs/buffs/生机.webp";
import ironwallArt from "@/assets/buffs/铁壁.webp";
import cactusCounterattackArt from "@/assets/buffs/buffs/仙人掌.webp";
import starlightArt from "@/assets/buffs/buffs/星辉.webp";
import insightArt from "@/assets/buffs/洞察.webp";
import thornsArt from "@/assets/buffs/buffs/荆棘.webp";
import illOmenArt from "@/assets/buffs/debuffs/凶兆.webp";
import insectTrapArt from "@/assets/buffs/debuffs/捕虫夹.webp";
import stunArt from "@/assets/buffs/debuffs/眩晕.webp";
import etchArt from "@/assets/buffs/debuffs/蚀刻.webp";
import slowArt from "@/assets/buffs/debuffs/迟滞.webp";
import staticArt from "@/assets/buffs/debuffs/静电.webp";
import emberWallArt from "@/assets/buffs/buffs/余烬护壁.webp";
import cascadeArt from "@/assets/buffs/buffs/倒泻.webp";
import debuffImmuneArt from "@/assets/buffs/buffs/免疫.webp";
import yachiyoArt from "@/assets/buffs/buffs/八千代.webp";
import halfDrawArt from "@/assets/buffs/buffs/半熟保鲜.webp";
import salvageArmorArt from "@/assets/buffs/buffs/回收装甲.webp";
import zenithStarArt from "@/assets/buffs/buffs/天顶星.webp";
import conductiveFilmArt from "@/assets/buffs/buffs/导电薄膜.webp";
import gravityLensArt from "@/assets/buffs/buffs/引力透镜.webp";
import escortArt from "@/assets/buffs/buffs/护航.webp";
import rootNetworkArt from "@/assets/buffs/buffs/根系网络.webp";
import thornCrownArt from "@/assets/buffs/buffs/棘冠.webp";
import zanshinArt from "@/assets/buffs/buffs/残心.webp";
import quenchArt from "@/assets/buffs/buffs/淬火.webp";
import driftArt from "@/assets/buffs/buffs/漂流.webp";
import bloomArt from "@/assets/buffs/buffs/盛放.webp";
import pollenArt from "@/assets/buffs/buffs/花粉.webp";
import myceliumWebArt from "@/assets/buffs/buffs/菌丝网络.webp";
import ouroborosArt from "@/assets/buffs/buffs/衔尾蛇.webp";
import philosophersStoneArt from "@/assets/buffs/buffs/贤者之石.webp";
import ironCloakArt from "@/assets/buffs/buffs/铁衣.webp";
import milkyWayArt from "@/assets/buffs/buffs/银河.webp";
import mirrorMoonArt from "@/assets/buffs/buffs/镜月.webp";
import prophecyIllOmenArt from "@/assets/buffs/buffs/预言·凶兆.webp";
import prophecyGoodOmenArt from "@/assets/buffs/buffs/预言·吉兆.webp";
import prophecyApocalypseArt from "@/assets/buffs/buffs/预言·天启.webp";
import prophecyOmenArt from "@/assets/buffs/buffs/预言·预兆.webp";
import windCutArt from "@/assets/buffs/buffs/风切.webp";
import agaveBloomArt from "@/assets/buffs/buffs/龙舌花信.webp";

export const STATUS_ART: Record<string, string> = {
  ...HEXER_STATUS_ART,
  starlight: starlightArt,
  ironwall: ironwallArt,
  strength: strengthArt,
  overload: overloadArt,
  rashomon: rashomonArt,
  sharp: sharpArt,
  chargedShell: chargedShellArt,
  retortWall: retortWallArt,
  bountyHunter: bountyHunterArt,
  tequila: tequilaArt,
  taunt: tauntArt,
  burn: burnArt,
  poison: poisonArt,
  regen: regenArt,
  thorns: thornsArt,
  flammable: flammableArt,
  scorched: scorchedArt,
  pierce: pierceArt,
  vitality: vitalityArt,
  cactusCounterattack: cactusCounterattackArt,
  insight: insightArt,
  insurance: insuranceArt,
  echo: echoArt,
  feignInjury: feignInjuryArt,
  deductible: deductibleArt,
  weak: weakArt,
  attackDown: attackDownArt,
  blind: blindArt,
  armorBreak: armorBreakArt,
  jam: jamArt,
  vulnerable: vulnerableArt,
  illOmen: illOmenArt,
  insectTrap: insectTrapArt,
  stun: stunArt,
  etch: etchArt,
  slow: slowArt,
  static: staticArt,
  emberWall: emberWallArt,
  cascade: cascadeArt,
  debuffImmune: debuffImmuneArt,
  yachiyo: yachiyoArt,
  halfDraw: halfDrawArt,
  salvageArmor: salvageArmorArt,
  zenithStar: zenithStarArt,
  conductiveFilm: conductiveFilmArt,
  gravityLens: gravityLensArt,
  escort: escortArt,
  rootNetwork: rootNetworkArt,
  thornCrown: thornCrownArt,
  zanshin: zanshinArt,
  quench: quenchArt,
  drift: driftArt,
  bloom: bloomArt,
  pollen: pollenArt,
  myceliumWeb: myceliumWebArt,
  ouroboros: ouroborosArt,
  philosophersStone: philosophersStoneArt,
  ironCloak: ironCloakArt,
  milkyWay: milkyWayArt,
  mirrorMoon: mirrorMoonArt,
  prophecyIllOmen: prophecyIllOmenArt,
  prophecyGoodOmen: prophecyGoodOmenArt,
  prophecyApocalypse: prophecyApocalypseArt,
  prophecyOmen: prophecyOmenArt,
  windCut: windCutArt,
  agaveBloom: agaveBloomArt,
};

export const SHIELD_ART: string = shieldArt;

export function statusArtOf(id: string): string | undefined {
  return STATUS_ART[id];
}

export const STATUS_ART_SOURCES: readonly string[] = [
  ...Object.values(HEXER_STATUS_ART),
  starlightArt,
  ironwallArt,
  strengthArt,
  overloadArt,
  rashomonArt,
  sharpArt,
  chargedShellArt,
  retortWallArt,
  bountyHunterArt,
  tequilaArt,
  tauntArt,
  burnArt,
  poisonArt,
  regenArt,
  thornsArt,
  flammableArt,
  scorchedArt,
  pierceArt,
  vitalityArt,
  cactusCounterattackArt,
  insightArt,
  insuranceArt,
  echoArt,
  feignInjuryArt,
  deductibleArt,
  weakArt,
  attackDownArt,
  blindArt,
  armorBreakArt,
  jamArt,
  vulnerableArt,
  illOmenArt,
  insectTrapArt,
  stunArt,
  etchArt,
  slowArt,
  staticArt,
  emberWallArt,
  cascadeArt,
  debuffImmuneArt,
  yachiyoArt,
  halfDrawArt,
  salvageArmorArt,
  zenithStarArt,
  conductiveFilmArt,
  gravityLensArt,
  escortArt,
  rootNetworkArt,
  thornCrownArt,
  zanshinArt,
  quenchArt,
  driftArt,
  bloomArt,
  pollenArt,
  myceliumWebArt,
  ouroborosArt,
  philosophersStoneArt,
  ironCloakArt,
  milkyWayArt,
  mirrorMoonArt,
  prophecyIllOmenArt,
  prophecyGoodOmenArt,
  prophecyApocalypseArt,
  prophecyOmenArt,
  windCutArt,
  agaveBloomArt,
  shieldArt,
];
