// 剑士卡池汇总。攻击 / 功能防御 / 被动分表维护，本文件只做拼装。
import type { CardDef } from "../../../engine/types";
import { SWORDSMAN_ATTACK_CARDS } from "./attack";
import { SWORDSMAN_PASSIVE_CARDS } from "./passive";
import { SWORDSMAN_SUPPORT_CARDS } from "./support";

export const SWORDSMAN_CARD_DEFS: CardDef[] = [
  ...SWORDSMAN_ATTACK_CARDS,
  ...SWORDSMAN_SUPPORT_CARDS,
  ...SWORDSMAN_PASSIVE_CARDS,
];
