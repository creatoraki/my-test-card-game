import type { CardDef } from "@/engine/types";

export const BOTANIST_TEMPORARY_CARDS: CardDef[] = [
  {
    id: "rotten-fruit",
    name: "腐烂的果实",
    ownerCharId: "botanist",
    cost: 1,
    cardType: "normal",
    targeting: "foe",
    temporary: true,
    exhaust: true,
    anim: "poison",
    effects: [
      {
        type: "APPLY_STATUS",
        status: "poison",
        stacksFromStat: { stat: "attack", multiplier: 0.7 },
        duration: 2,
        target: "primary",
      },
    ],
    text: "对一名敌人附加 {0} 层中毒，持续 2 回合。消耗。",
  },
  {
    id: "twin-flower-sprout",
    name: "双生花·子株",
    ownerCharId: "botanist",
    cost: 1,
    cardType: "normal",
    targeting: "ally",
    temporary: true,
    exhaust: true,
    anim: "heal",
    effects: [{ type: "HEAL", multiplier: 0.4, target: "primary" }],
    text: "为一名队友恢复 {0} 点生命。消耗。",
  },
];
