import type { CardDef } from "@/engine/types";

export const BOTANIST_TEMPORARY_CARDS: CardDef[] = [
  {
    // 培育牌枯萎后的替换卡(见 engine/deck/deck.witherCards)。按主目标阵营二选一结算。
    id: "withered-fruit",
    name: "枯萎的果实",
    ownerCharId: "botanist",
    cost: 0,
    cardType: "normal",
    targeting: "any",
    temporary: true,
    exhaust: true,
    anim: "poison",
    effects: [
      {
        type: "APPLY_STATUS",
        status: "poison",
        stacksFromStat: { stat: "attack", multiplier: 0.25 },
        duration: 2,
        target: "primary",
        condition: "primaryIsFoe",
      },
      { type: "HEAL", multiplier: 0.3, target: "primary", condition: "primaryIsAlly" },
    ],
    text: "选择任意一名角色。敌人：附加 {0} 层中毒，持续 2 拍。队友：恢复 {1} 点生命。消耗。",
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
