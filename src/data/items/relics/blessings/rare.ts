import { defineRelics } from "../defineRelic";

// 稀有档祝福遗物。前三件同时被教学关遗物储备箱按 id 指名。
export const RARE_BLESSING_RELIC_DEFS = defineRelics("blessing", "rare", [
  {
    id: "relic-heart-mirror",
    name: "护心镜",
    scope: "battle",
    desc: "每场战斗第一次有角色生命降低至最大生命的一半以下时，为其获得 8 点护盾。",
  },
  {
    id: "relic-old-clockwork",
    name: "旧式发条",
    scope: "battle",
    desc: "第 3、6、9……回合开始时，额外抽 1 张牌。",
  },
  {
    id: "relic-light-feather",
    name: "轻质羽毛",
    scope: "battle",
    desc: "每场战斗第一回合的换牌次数 +2。",
  },
]);
