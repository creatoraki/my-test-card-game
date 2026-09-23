// 卡牌注册入口。具体卡牌按角色拆分到 cards/<角色>/ 目录维护。

import type { CardDef } from "@/engine/types";
import { makeBasicCardDefs } from "./neutral/basicCards";
import { BOTANIST_CARD_DEFS } from "./botanist";
import { ALCHEMIST_CARD_DEFS } from "./alchemist";
import { PROPHET_CARD_DEFS } from "./prophet";
import { SWORDSMAN_CARD_DEFS } from "./swordsman";
import { NEUTRAL_CARD_DEFS } from "./neutral";
import { ACTUARY_CARD_DEFS } from "./actuary";

export const CARD_DEFS: CardDef[] = [
  ...makeBasicCardDefs("swordsman"),
  ...makeBasicCardDefs("prophet"),
  ...makeBasicCardDefs("botanist"),
  ...makeBasicCardDefs("alchemist"),
  ...makeBasicCardDefs("actuary"),
  ...SWORDSMAN_CARD_DEFS,
  ...PROPHET_CARD_DEFS,
  ...BOTANIST_CARD_DEFS,
  ...ALCHEMIST_CARD_DEFS,
  ...ACTUARY_CARD_DEFS,
  ...NEUTRAL_CARD_DEFS,
];
