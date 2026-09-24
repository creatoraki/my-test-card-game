import type { CardDef } from "@/engine/types";
import { BOTANIST_BOW_CARDS } from "./bow";
import { BOTANIST_GARDEN_CARDS } from "./garden";
import { BOTANIST_PASSIVE_CARDS } from "./passive";
import { BOTANIST_SUPPORT_CARDS } from "./support";
import { BOTANIST_TEMPORARY_CARDS } from "./temporary";
import { BOTANIST_VENOM_CARDS } from "./venom";

export const BOTANIST_CARD_DEFS: CardDef[] = [
  ...BOTANIST_BOW_CARDS,
  ...BOTANIST_VENOM_CARDS,
  ...BOTANIST_GARDEN_CARDS,
  ...BOTANIST_SUPPORT_CARDS,
  ...BOTANIST_PASSIVE_CARDS,
  ...BOTANIST_TEMPORARY_CARDS,
];
