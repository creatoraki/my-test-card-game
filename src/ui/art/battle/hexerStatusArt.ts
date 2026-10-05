// 咒术师专属状态美术；由公共状态登记表统一提供展示和预加载。
import doomArt from "@/assets/buffs/状态/属性削弱/厄运.webp";
import grudgeArt from "@/assets/buffs/状态/触发联动/怨咒.webp";
import sealArt from "@/assets/buffs/状态/控制限制/封印.webp";
import stallArt from "@/assets/buffs/状态/控制限制/停摆.webp";
import boneRotArt from "@/assets/buffs/状态/持续伤害/痛楚.webp";
import soulLockArt from "@/assets/buffs/标记/敌方标记/锁魂.webp";
import plagueArt from "@/assets/buffs/标记/敌方标记/疫病.webp";
import curseThreadArt from "@/assets/buffs/标记/敌方标记/咒丝.webp";
import counterHexArt from "@/assets/buffs/状态/触发联动/反咒.webp";
import hexOathArt from "@/assets/buffs/状态/出牌规则/咒誓.webp";
import witchingArt from "@/assets/buffs/状态/出牌规则/逢魔.webp";

export const HEXER_STATUS_ART: Record<string, string> = {
  doom: doomArt,
  grudge: grudgeArt,
  seal: sealArt,
  stall: stallArt,
  boneRot: boneRotArt,
  soulLock: soulLockArt,
  plague: plagueArt,
  curseThread: curseThreadArt,
  counterHex: counterHexArt,
  hexOath: hexOathArt,
  witching: witchingArt,
};
