import type { StatusInstance } from "../types";
import { OVERLOAD_STATUS_ID } from "../core/battleRules";
import { getStatusDef } from "../statuses";

// 噬魂的夺取与吸血分支共用同一规则。
export function isStealableBuff(status: StatusInstance): boolean {
  const def = getStatusDef(status.id);
  return status.stacks > 0 && status.id !== OVERLOAD_STATUS_ID &&
    def?.kind === "buff" && !def.mark && !def.undispellable;
}
