import type { CardDef } from "../../../engine/types";

export const PROPHET_PASSIVE_CARDS: CardDef[] = [
  {
    id: "domino",
    name: "多米诺",
    ownerCharId: "prophet",
    cost: 0,
    cardType: "passive",
    targeting: "self",
    rarity: "rare",
    passive: {
      on: ["cardDrawn", "cardPlayed", "cardDiscarded", "roundStart"],
      effects: [
        {
          type: "MARK_CARDS",
          amount: 1,
          mark: "domino",
          markPick: "handRandomUnmarked",
          markUnique: true,
        },
      ],
    },
    effects: [],
    text: "抽到时及持有期间，卡牌增益被消耗后，为一张未带增益的手牌附加【多米诺】。场上至多存在一个【多米诺】。",
  },
];
