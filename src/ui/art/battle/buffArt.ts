// 非战斗状态的 BUFF 素材集中登记处：培育标记、组装部件与药剂徽记。
// 战斗状态仍由 statusArt.ts 管理，避免把两套 id 体系混在同一张表里。

import type { AssembleId } from "@/engine";
import assembleAArt from "@/assets/buffs/buffs/组装A.webp";
import assembleBArt from "@/assets/buffs/buffs/组装B.webp";
import assembleCArt from "@/assets/buffs/buffs/组装C.webp";
import assembleDArt from "@/assets/buffs/buffs/组装D.webp";
import cultivationArt from "@/assets/buffs/buffs/培育.webp";
import potionArt from "@/assets/buffs/buffs/魔药.webp";

export const BUFF_ART: Record<"cultivate" | "potion" | AssembleId, string> = {
  cultivate: cultivationArt,
  potion: potionArt,
  assembleA: assembleAArt,
  assembleB: assembleBArt,
  assembleC: assembleCArt,
  assembleD: assembleDArt,
};

export const BUFF_ART_SOURCES: readonly string[] = Object.values(BUFF_ART);

export const CULTIVATION_ART = BUFF_ART.cultivate;

export function assembleBuffArtOf(id: AssembleId): string {
  return BUFF_ART[id];
}
