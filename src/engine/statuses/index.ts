import type { StatusDef } from "../types";
import { registerStatusDefs } from "../core/hookRegistry";
import { BUFF_STATUS_DEFS } from "./buffs";
import { CONTROL_STATUS_DEFS } from "./control";
import { DEBUFF_STATUS_DEFS } from "./debuffs";
import { DOT_STATUS_DEFS } from "./dot";
import { ACTUARY_STATUS_DEFS } from "./actuary";
import { SWORDSMAN_STATUS_DEFS } from "./swordsman";
import { BOTANIST_STATUS_DEFS } from "./botanist";
import { PROPHET_STATUS_DEFS } from "./prophet";
import { PROPHECY_STATUS_DEFS } from "./prophecy";
import { ABANDONED_FLOOR_STATUS_DEFS } from "./abandonedFloor";
import { ALCHEMIST_STATUS_DEFS } from "./alchemist";

export const STATUS_DEFS: Record<string, StatusDef> = {
  ...DOT_STATUS_DEFS,
  ...BUFF_STATUS_DEFS,
  ...DEBUFF_STATUS_DEFS,
  ...CONTROL_STATUS_DEFS,
  ...ACTUARY_STATUS_DEFS,
  ...SWORDSMAN_STATUS_DEFS,
  ...BOTANIST_STATUS_DEFS,
  ...PROPHET_STATUS_DEFS,
  ...PROPHECY_STATUS_DEFS,
  ...ABANDONED_FLOOR_STATUS_DEFS,
  ...ALCHEMIST_STATUS_DEFS,
};

// 填入钩子注册表 —— 引擎原语查的是那张表, 不直接 import 本文件(否则成环)。
registerStatusDefs(STATUS_DEFS);

export function getStatusDef(id: string): StatusDef | undefined {
  return STATUS_DEFS[id];
}
