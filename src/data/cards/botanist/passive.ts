import type { CardDef } from "@/engine/types";

export const BOTANIST_PASSIVE_CARDS: CardDef[] = [
  {
    id: "root-bond",
    name: "根系联结",
    ownerCharId: "botanist",
    cost: 0,
    cardType: "passive",
    targeting: "allAllies",
    rarity: "rare",
    anim: "buff",
    effects: [],
    passive: {
      on: "cardDrawn",
      effects: [
        {
          type: "APPLY_STATUS",
          status: "rootNetwork",
          stacks: 1,
          duration: 3,
          target: "self",
          condition: "eventIsSourceCard",
        },
      ],
    },
    text: "被动：抽到本卡时，植物学家获得根系网络，持续 3 回合：培育牌成熟时，所有敌人附加穿孔 1；培育牌枯萎时，生命比例最低的队友修复 2 点体力极限，并回复等值生命。",
  },
];
