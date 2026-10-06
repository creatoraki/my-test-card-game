import type { StatusInstance } from "../types";
import { OVERLOAD_STATUS_ID } from "../core/battleRules";
import { getStatusDef } from "../statuses";

// 夺取增益(STEAL_BUFF)可选的增益: 可驱散、非标记、非过载。
export function isStealableBuff(status: StatusInstance): boolean {
  const def = getStatusDef(status.id);
  return status.stacks > 0 && status.id !== OVERLOAD_STATUS_ID &&
    def?.kind === "buff" && !def.mark && !def.undispellable;
}
