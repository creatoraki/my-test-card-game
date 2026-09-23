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
          duration: 2,
          target: "self",
          condition: "eventIsSourceCard",
        },
      ],
    },
    text: "被动：抽到本卡时，植物学家获得根系网络，持续 2 回合。",
  },
  {
    id: "ivy-shelter",
    name: "常春藤庇护",
    ownerCharId: "botanist",
    cost: 0,
    cardType: "passive",
    targeting: "allAllies",
    rarity: "common",
    anim: "buff",
    effects: [],
    handAura: { cardId: "rotten-fruit", cost: 0 },
    text: "被动：持有时，所有腐烂的果实费用为 0。",
  },
];
