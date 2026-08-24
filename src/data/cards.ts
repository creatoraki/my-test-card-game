// 卡牌注册入口。具体卡牌按角色拆分到 cards/<角色>/ 目录维护。

import type { CardDef } from "../engine/types";
import { makeBasicCardDefs } from "./basicCards";
import { BOTANIST_CARD_DEFS } from "./cards/botanist";
import { PROPHET_CARD_DEFS } from "./cards/prophet";
import { SWORDSMAN_CARD_DEFS } from "./cards/swordsman";
import { NEUTRAL_CARD_DEFS } from "./cards/neutral";

export const CARD_DEFS: CardDef[] = [
  ...makeBasicCardDefs("swordsman"),
  ...makeBasicCardDefs("prophet"),
  ...makeBasicCardDefs("botanist"),
  ...SWORDSMAN_CARD_DEFS,
  ...PROPHET_CARD_DEFS,
  ...BOTANIST_CARD_DEFS,
  ...NEUTRAL_CARD_DEFS,
];
