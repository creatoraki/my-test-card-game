import type { CardDef } from "@/engine/types";
import { BOTANIST_ATTACK_CARDS } from "./attack";
import { BOTANIST_PASSIVE_CARDS } from "./passive";
import { BOTANIST_SUPPORT_CARDS } from "./support";
import { BOTANIST_TEMPORARY_CARDS } from "./temporary";

export const BOTANIST_CARD_DEFS: CardDef[] = [
  ...BOTANIST_ATTACK_CARDS,
  ...BOTANIST_SUPPORT_CARDS,
  ...BOTANIST_PASSIVE_CARDS,
  ...BOTANIST_TEMPORARY_CARDS,
];
