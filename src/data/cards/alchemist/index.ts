import type { CardDef } from "../../../engine/types";
import { ALCHEMIST_ATTACK_CARDS } from "./attack";
import { ALCHEMIST_DEFENSE_CARDS } from "./defense";
import { ALCHEMIST_PASSIVE_CARDS } from "./passive";
import { ALCHEMIST_REWARD_CARDS } from "./rewards";
import { ALCHEMIST_SUPPORT_CARDS } from "./support";

export const ASSEMBLE_REWARD_POOLS = {
  attack: ["over-catalysis", "chain-burst"],
  defense: ["phase-membrane", "rejuvenation-potion", "tonic-potion"],
  support: ["reflux-potion", "inspiration-potion"],
  passive: ["bounty-hunter", "infinite-ledger"],
} as const;

export const ALCHEMIST_CARD_DEFS: CardDef[] = [
  ...ALCHEMIST_ATTACK_CARDS,
  ...ALCHEMIST_DEFENSE_CARDS,
  ...ALCHEMIST_SUPPORT_CARDS,
  ...ALCHEMIST_PASSIVE_CARDS,
  ...ALCHEMIST_REWARD_CARDS,
];
