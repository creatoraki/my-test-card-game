import type { StatusDef } from "../types";
import { BUFF_STATUS_DEFS } from "./buffs";
import { CONTROL_STATUS_DEFS } from "./control";
import { DEBUFF_STATUS_DEFS } from "./debuffs";
import { DOT_STATUS_DEFS } from "./dot";
import { ACTUARY_STATUS_DEFS } from "./actuary";
import { SWORDSMAN_STATUS_DEFS } from "./swordsman";

export const STATUS_DEFS: Record<string, StatusDef> = {
  ...DOT_STATUS_DEFS,
  ...BUFF_STATUS_DEFS,
  ...DEBUFF_STATUS_DEFS,
  ...CONTROL_STATUS_DEFS,
  ...ACTUARY_STATUS_DEFS,
  ...SWORDSMAN_STATUS_DEFS,
};

export function getStatusDef(id: string): StatusDef | undefined {
  return STATUS_DEFS[id];
}
