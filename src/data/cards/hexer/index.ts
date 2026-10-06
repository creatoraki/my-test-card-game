import type { CardDef } from "@/engine/types";
import { HEXER_STRIKE_CARDS } from "./strike";
import { HEXER_CURSE_CARDS } from "./curse";
import { HEXER_TORMENT_CARDS } from "./torment";
import { HEXER_SUPPORT_CARDS } from "./support";
import { HEXER_PASSIVE_CARDS } from "./passive";
import { HEXER_RITUAL_CARDS } from "./ritual";

// 按职能分文件: 直伤 / 施咒 / 痛楚兑现 / 功能防御 / 被动 / 仪式。稀有度写在各卡的 rarity 上。
export const HEXER_CARD_DEFS: CardDef[] = [
  ...HEXER_STRIKE_CARDS,
  ...HEXER_CURSE_CARDS,
  ...HEXER_TORMENT_CARDS,
  ...HEXER_SUPPORT_CARDS,
  ...HEXER_PASSIVE_CARDS,
  ...HEXER_RITUAL_CARDS,
];
