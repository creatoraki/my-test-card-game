import type { CardDef } from "../../../engine/types";
import { ACTUARY_ATTACK_CARDS } from "./attack";
import { ACTUARY_HEAL_CARDS } from "./heal";
import { ACTUARY_PASSIVE_CARDS } from "./passive";
import { ACTUARY_SUPPORT_CARDS } from "./support";

export const ACTUARY_CARD_DEFS: CardDef[] = [
  ...ACTUARY_HEAL_CARDS,
  ...ACTUARY_SUPPORT_CARDS,
  ...ACTUARY_PASSIVE_CARDS,
  ...ACTUARY_ATTACK_CARDS,
];
