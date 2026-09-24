import type { CardDef } from "@/engine/types";
import { PROPHET_ATTACK_CARDS } from "./attack";
import { PROPHET_SUPPORT_CARDS } from "./support";
import { PROPHET_UTILITY_CARDS } from "./utility";
import { PROPHET_PROPHECY_CARDS } from "./prophecy";
import { PROPHET_PASSIVE_CARDS } from "./passive";
import { PROPHET_TEMPORARY_CARDS } from "./temporary";

export const PROPHET_CARD_DEFS: CardDef[] = [
  ...PROPHET_ATTACK_CARDS,
  ...PROPHET_SUPPORT_CARDS,
  ...PROPHET_UTILITY_CARDS,
  ...PROPHET_PROPHECY_CARDS,
  ...PROPHET_PASSIVE_CARDS,
  ...PROPHET_TEMPORARY_CARDS,
];
