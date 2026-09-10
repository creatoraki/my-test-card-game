import type { ItemDef, RelicSpec } from "../../../../items/types";

const blessing = (id: string, name: string, desc: string, relic: Omit<RelicSpec, "polarity">): ItemDef => ({
  id,
  name,
  category: "relic",
  rarity: "rare",
  desc,
  maxStack: 1,
  relic: { polarity: "blessing", ...relic },
});

export const TUTORIAL_BLESSING_RELIC_DEFS: ItemDef[] = [
  blessing(
    "relic-heart-mirror",
    "护心镜",
    "每场战斗第一次有角色生命降低至最大生命的一半以下时，为其获得 8 点护盾。",
    { scope: "battle" },
  ),
  blessing(
    "relic-old-clockwork",
    "旧式发条",
    "第 3、6、9……回合开始时，额外抽 1 张牌。",
    { scope: "battle" },
  ),
  blessing(
    "relic-light-feather",
    "轻质羽毛",
    "每场战斗第一回合的换牌次数 +2。",
    { scope: "battle" },
  ),
];
