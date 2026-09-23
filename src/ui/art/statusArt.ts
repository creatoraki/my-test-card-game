// 新增状态美术只在此登记一次，StatusPips 与 HitFxLayer 自动生效。
// 四宫格状态图必须使用 `node scripts/crop-status-buffs.mjs <四宫格原图路径>` 切图；
// 切分后的素材按状态实际目录登记，不要手动截屏取图。

import poisonArt from "@/assets/buffs/dot/中毒.webp";
import shieldArt from "@/assets/buffs/护盾.webp";
import burnArt from "@/assets/buffs/dot/灼烧.webp";
import regenArt from "@/assets/buffs/dot/再生.webp";
import flammableArt from "@/assets/buffs/debuffs/易燃.webp";
import scorchedArt from "@/assets/buffs/debuffs/焦灼.webp";
import pierceArt from "@/assets/buffs/debuffs/穿孔.webp";
import sharpArt from "@/assets/buffs/锋利.webp";
import insuranceArt from "@/assets/buffs/保险.webp";
import tauntArt from "@/assets/buffs/嘲讽.webp";
import chargedShellArt from "@/assets/buffs/buffs/充能外壳.webp";
import retortWallArt from "@/assets/buffs/反应釜壁.webp";
import overloadArt from "@/assets/buffs/buffs/过载.webp";
import echoArt from "@/assets/buffs/回响.webp";
import feignInjuryArt from "@/assets/buffs/假装受伤.webp";
import strengthArt from "@/assets/buffs/力量.webp";
import tequilaArt from "@/assets/buffs/buffs/龙舌兰.webp";
import rashomonArt from "@/assets/buffs/buffs/罗生门.webp";
import deductibleArt from "@/assets/buffs/免赔.webp";
import bountyHunterArt from "@/assets/buffs/赏金猎人.webp";
import vitalityArt from "@/assets/buffs/生机.webp";
import ironwallArt from "@/assets/buffs/铁壁.webp";
import cactusCounterattackArt from "@/assets/buffs/仙人掌.webp";
import starlightArt from "@/assets/buffs/星辉.webp";
import insightArt from "@/assets/buffs/洞察.webp";
import thornsArt from "@/assets/buffs/荆棘.webp";

export const STATUS_ART: Record<string, string> = {
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
};

export const SHIELD_ART: string = shieldArt;

export function statusArtOf(id: string): string | undefined {
  return STATUS_ART[id];
}

export const STATUS_ART_SOURCES: readonly string[] = [
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
  shieldArt,
];
