// 咒术师专属状态美术；由公共状态登记表统一提供展示和预加载。
import doomArt from "@/assets/buffs/hexer/厄运.webp";
import grudgeArt from "@/assets/buffs/hexer/怨咒.webp";
import sealArt from "@/assets/buffs/hexer/封印.webp";
import stallArt from "@/assets/buffs/hexer/停摆.webp";
import boneRotArt from "@/assets/buffs/hexer/附骨.webp";
import soulLockArt from "@/assets/buffs/hexer/锁魂.webp";
import plagueArt from "@/assets/buffs/hexer/疫病.webp";
import curseThreadArt from "@/assets/buffs/hexer/咒丝.webp";
import counterHexArt from "@/assets/buffs/hexer/反咒.webp";
import hexOathArt from "@/assets/buffs/hexer/咒誓.webp";
import witchingArt from "@/assets/buffs/hexer/逢魔.webp";

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
