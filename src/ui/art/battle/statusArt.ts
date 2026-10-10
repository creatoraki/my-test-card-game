// 新增状态美术只在此登记一次，StatusPips 与 HitFxLayer 自动生效。
// 四宫格状态图必须使用 `node scripts/crop-status-buffs.mjs <四宫格原图路径>` 切图；
// 切分后的素材按状态实际目录登记，不要手动截屏取图。

import { HEXER_STATUS_ART } from "./hexerStatusArt";
import { ADDITIONAL_STATUS_ART } from "./additionalStatusArt";
import { BOTANIST_STATUS_ART } from "./botanistStatusArt";
import { ECO_ARK_STATUS_ART } from "./ecoArkStatusArt";
import poisonArt from "@/assets/buffs/状态/持续伤害/中毒.webp";
import mycoToxinArt from "@/assets/buffs/状态/属性削弱/菌毒.webp";
import shieldArt from "@/assets/buffs/战斗/护盾/护盾.webp";
import burnArt from "@/assets/buffs/状态/持续伤害/灼烧.webp";
import regenArt from "@/assets/buffs/状态/生命恢复/再生.webp";
import flammableArt from "@/assets/buffs/状态/属性削弱/易燃.webp";
import scorchedArt from "@/assets/buffs/状态/属性削弱/焦灼.webp";
import pierceArt from "@/assets/buffs/状态/属性削弱/穿孔.webp";
import sharpArt from "@/assets/buffs/状态/属性强化/锋利.webp";
import insuranceArt from "@/assets/buffs/状态/生命恢复/保险.webp";
import tauntArt from "@/assets/buffs/状态/控制限制/嘲讽.webp";
import weakArt from "@/assets/buffs/状态/属性削弱/虚弱.webp";
import attackDownArt from "@/assets/buffs/状态/属性削弱/萎靡.webp";
import blindArt from "@/assets/buffs/状态/属性削弱/致盲.webp";
import armorBreakArt from "@/assets/buffs/状态/属性削弱/破甲.webp";
import jamArt from "@/assets/buffs/状态/属性削弱/电磁干扰.webp";
import vulnerableArt from "@/assets/buffs/状态/属性削弱/易伤.webp";
import chargedShellArt from "@/assets/buffs/状态/属性强化/充能外壳.webp";
import retortWallArt from "@/assets/buffs/状态/触发联动/反应釜壁.webp";
import overloadArt from "@/assets/buffs/状态/属性强化/过载.webp";
import echoArt from "@/assets/buffs/状态/出牌规则/回响.webp";
import feignInjuryArt from "@/assets/buffs/状态/信息标记/假装受伤.webp";
import strengthArt from "@/assets/buffs/状态/属性强化/力量.webp";
import tequilaArt from "@/assets/buffs/状态/属性强化/龙舌兰.webp";
import rashomonArt from "@/assets/buffs/状态/伤害防护/罗生门.webp";
import deductibleArt from "@/assets/buffs/状态/伤害防护/免赔.webp";
import bountyHunterArt from "@/assets/buffs/状态/资源规则/赏金猎人.webp";
import vitalityArt from "@/assets/buffs/状态/生命恢复/生机.webp";
import ironwallArt from "@/assets/buffs/状态/属性强化/铁壁.webp";
import cactusCounterattackArt from "@/assets/buffs/状态/触发联动/仙人掌.webp";
import starlightArt from "@/assets/buffs/状态/资源规则/星辉.webp";
import insightArt from "@/assets/buffs/状态/信息标记/洞察.webp";
import thornsArt from "@/assets/buffs/状态/触发联动/荆棘.webp";
import illOmenArt from "@/assets/buffs/状态/触发联动/凶兆.webp";
import insectTrapArt from "@/assets/buffs/状态/触发联动/捕虫夹.webp";
import stunArt from "@/assets/buffs/状态/控制限制/眩晕.webp";
import etchArt from "@/assets/buffs/状态/属性削弱/蚀刻.webp";
import slowArt from "@/assets/buffs/状态/控制限制/迟滞.webp";
import staticArt from "@/assets/buffs/状态/控制限制/静电.webp";
import emberWallArt from "@/assets/buffs/状态/触发联动/余烬护壁.webp";
import cascadeArt from "@/assets/buffs/状态/出牌规则/倒泻.webp";
import yachiyoArt from "@/assets/buffs/状态/出牌规则/八千代.webp";
import salvageArmorArt from "@/assets/buffs/状态/属性强化/回收装甲.webp";
import zenithStarArt from "@/assets/buffs/状态/出牌规则/天顶星.webp";
import conductiveFilmArt from "@/assets/buffs/状态/触发联动/导电薄膜.webp";
import gravityLensArt from "@/assets/buffs/状态/出牌规则/引力透镜.webp";
import escortArt from "@/assets/buffs/状态/伤害防护/护航.webp";
import rootNetworkArt from "@/assets/buffs/状态/触发联动/根系网络.webp";
import thornCrownArt from "@/assets/buffs/状态/触发联动/棘冠.webp";
import zanshinArt from "@/assets/buffs/状态/资源规则/残心.webp";
import quenchArt from "@/assets/buffs/状态/触发联动/淬火.webp";
import driftArt from "@/assets/buffs/状态/触发联动/漂流.webp";
import bloomArt from "@/assets/buffs/状态/出牌规则/盛放.webp";
import pollenArt from "@/assets/buffs/状态/触发联动/花粉.webp";
import myceliumWebArt from "@/assets/buffs/状态/触发联动/菌丝网络.webp";
import ouroborosArt from "@/assets/buffs/状态/触发联动/衔尾蛇.webp";
import philosophersStoneArt from "@/assets/buffs/状态/出牌规则/贤者之石.webp";
import ironCloakArt from "@/assets/buffs/状态/伤害防护/铁衣.webp";
import milkyWayArt from "@/assets/buffs/状态/资源规则/银河.webp";
import mirrorMoonArt from "@/assets/buffs/状态/触发联动/镜月.webp";
import prophecyIllOmenArt from "@/assets/buffs/状态/出牌规则/预言·凶兆.webp";
import prophecyGoodOmenArt from "@/assets/buffs/状态/出牌规则/预言·吉兆.webp";
import prophecyApocalypseArt from "@/assets/buffs/状态/出牌规则/预言·天启.webp";
import prophecyOmenArt from "@/assets/buffs/状态/出牌规则/预言·预兆.webp";
import windCutArt from "@/assets/buffs/状态/属性强化/风切.webp";

export const STATUS_ART: Record<string, string> = {
  ...HEXER_STATUS_ART,
  ...ADDITIONAL_STATUS_ART,
  ...BOTANIST_STATUS_ART,
  ...ECO_ARK_STATUS_ART,
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
  mycoToxin: mycoToxinArt,
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
  yachiyo: yachiyoArt,
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
};

export const SHIELD_ART: string = shieldArt;

export function statusArtOf(id: string): string | undefined {
  return STATUS_ART[id];
}

export const STATUS_ART_SOURCES: readonly string[] = [
  ...Object.values(HEXER_STATUS_ART),
  ...Object.values(ADDITIONAL_STATUS_ART),
  ...Object.values(BOTANIST_STATUS_ART),
  ...Object.values(ECO_ARK_STATUS_ART),
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
  mycoToxinArt,
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
  yachiyoArt,
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
  shieldArt,
];
