// 成品模组美术登记表。物品图标、卡面模组标记与素材预载共用这份映射。
import assembleAArt from "@/assets/道具/模组/组装模组A_芯片型.webp";
import assembleBArt from "@/assets/道具/模组/组装模组B_芯片型.webp";
import assembleCArt from "@/assets/道具/模组/组装模组C_芯片型.webp";
import assembleDArt from "@/assets/道具/模组/组装模组D_芯片型.webp";
import attackT1Art from "@/assets/道具/模组/攻击力模组1_芯片型.webp";
import armorPenT1Art from "@/assets/道具/模组/穿甲模组1_芯片型.webp";
import aimArt from "@/assets/道具/模组/穿孔模组_芯片型.webp";
import discardArt from "@/assets/道具/模组/弃牌模组_芯片型.webp";
import discardBaseArt from "@/assets/道具/模组/弃牌模组_芯片型_基础款式.webp";
import echoArt from "@/assets/道具/模组/回响模组_芯片型.webp";
import emergencyArt from "@/assets/道具/模组/急诊模组_芯片型.webp";
import critT1Art from "@/assets/道具/模组/暴击模组1_芯片型.webp";
import healPowerT1Art from "@/assets/道具/模组/治愈力模组1_芯片型.webp";
import burnT1Art from "@/assets/道具/模组/燃烧模组1_芯片型.webp";
import poisonT1Art from "@/assets/道具/模组/淬毒模组1_芯片型.webp";
import precisionT1Art from "@/assets/道具/模组/精准模组1_芯片型.webp";
import gapArt from "@/assets/道具/模组/落差模组_芯片型.webp";
import ripenArt from "@/assets/道具/模组/催熟模组_芯片型.webp";
import satelliteArt from "@/assets/道具/模组/卫星模组_芯片型.webp";
import rushArt from "@/assets/道具/模组/速攻模组_芯片型.webp";
import starloanArt from "@/assets/道具/模组/借星模组_芯片型.webp";

/** 所有当前成品模组的物品 id 到美术资源的映射。 */
export const MODULE_ART: Record<string, string> = {
  "rush-module": rushArt,
  "discard-module": discardArt,
  "gap-module": gapArt,
  "satellite-module": satelliteArt,
  "starloan-module": starloanArt,
  "aim-module": aimArt,
  "ripen-module": ripenArt,
  "assemble-a-module": assembleAArt,
  "assemble-b-module": assembleBArt,
  "assemble-c-module": assembleCArt,
  "assemble-d-module": assembleDArt,
  "emergency-module": emergencyArt,
  "echo-module": echoArt,
  "attack-module-t1": attackT1Art,
  "healpower-module-t1": healPowerT1Art,
  "armorpen-module-t1": armorPenT1Art,
  "crit-module-t1": critT1Art,
  "precision-module-t1": precisionT1Art,
  "poison-module-t1": poisonT1Art,
  "burn-module-t1": burnT1Art,
};

// 弃牌模组的基础款式与芯片款式均保留登记；目前两份文件内容相同。
export const MODULE_ART_VARIANTS: Record<string, readonly string[]> = {
  "discard-module": [discardBaseArt],
};

export const MODULE_ART_SOURCES: readonly string[] = [
  ...Object.values(MODULE_ART),
  ...Object.values(MODULE_ART_VARIANTS).flat(),
];
