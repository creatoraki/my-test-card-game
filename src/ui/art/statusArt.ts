// 新增状态美术只在此登记一次，StatusPips 与 HitFxLayer 自动生效。
// 四宫格状态图必须使用 `node scripts/crop-status-buffs.mjs <四宫格原图路径>` 切图；
// 切分后的素材按状态实际目录登记，不要手动截屏取图。

import poisonArt from "@/assets/buffs/dot/中毒.png";
import shieldArt from "@/assets/buffs/护盾.png";
import burnArt from "@/assets/buffs/dot/灼烧.png";
import flammableArt from "@/assets/buffs/debuffs/易燃.png";
import scorchedArt from "@/assets/buffs/debuffs/焦灼.png";
import sharpArt from "@/assets/buffs/锋利.png";
import insuranceArt from "@/assets/buffs/保险.png";
import tauntArt from "@/assets/buffs/嘲讽.png";
import chargedShellArt from "@/assets/buffs/充能外壳.png";
import retortWallArt from "@/assets/buffs/反应釜壁.png";
import overloadArt from "@/assets/buffs/过载.png";
import echoArt from "@/assets/buffs/回响.png";
import feignInjuryArt from "@/assets/buffs/假装受伤.png";
import strengthArt from "@/assets/buffs/力量.png";
import tequilaArt from "@/assets/buffs/龙舌兰.png";
import rashomonArt from "@/assets/buffs/罗生门.png";
import deductibleArt from "@/assets/buffs/免赔.png";
import bountyHunterArt from "@/assets/buffs/赏金猎人.png";
import vitalityArt from "@/assets/buffs/生机.png";
import ironwallArt from "@/assets/buffs/铁壁.png";
import cactusCounterattackArt from "@/assets/buffs/仙人掌.png";
import starlightArt from "@/assets/buffs/星辉.png";

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
  flammable: flammableArt,
  scorched: scorchedArt,
  vitality: vitalityArt,
  cactusCounterattack: cactusCounterattackArt,
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
  flammableArt,
  scorchedArt,
  vitalityArt,
  cactusCounterattackArt,
  insuranceArt,
  echoArt,
  feignInjuryArt,
  deductibleArt,
  shieldArt,
];
