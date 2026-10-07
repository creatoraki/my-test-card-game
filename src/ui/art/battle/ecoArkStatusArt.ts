// 生态方舟专属状态图标，使用已确认的卡通方案。
import namedBurst from "@/assets/buffs/状态/信息标记/点名齐射.webp";
import rootReturn from "@/assets/buffs/状态/生命恢复/根网回灌.webp";
import gardenShelter from "@/assets/buffs/状态/伤害防护/园丁庇护.webp";
import gardenProtected from "@/assets/buffs/状态/伤害防护/受到庇护.webp";
import spore from "@/assets/buffs/状态/触发联动/孢子.webp";
import parasiticPods from "@/assets/buffs/状态/触发联动/寄生种荚.webp";
import collateral from "@/assets/buffs/状态/资源规则/押品.webp";

export const ECO_ARK_STATUS_ART: Record<string, string> = {
  arkCollateral: collateral,
  arkNamedBurst: namedBurst,
  arkRootReturn: rootReturn,
  arkGardenShelter: gardenShelter,
  arkGardenProtected: gardenProtected,
  arkSpore: spore,
  arkParasiticPods: parasiticPods,
};
