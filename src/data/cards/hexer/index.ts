import type { CardDef } from "@/engine/types";
import { HEXER_ATTACK_CARDS } from "./attack";
import { HEXER_SUPPORT_CARDS } from "./support";
import { HEXER_UNCOMMON_CARDS } from "./uncommon";
import { HEXER_PASSIVE_CARDS } from "./passive";
import { HEXER_RARE_CARDS } from "./rare";

export const HEXER_CARD_DEFS: CardDef[] = [
  ...HEXER_ATTACK_CARDS,
  ...HEXER_SUPPORT_CARDS,
  ...HEXER_UNCOMMON_CARDS,
  ...HEXER_PASSIVE_CARDS,
  ...HEXER_RARE_CARDS,
];
