// 羁绊行为汇总 —— 加载时注册进 hookRegistry, 由 relics/types.runRelicHook 与遗物一起派发。
// 新增羁绊 = 在对应系别文件里加一条行为, 再在 data/roster/bonds 加一条定义。

import { registerBondBehaviors } from "../core/hookRegistry";
import type { BondBehavior } from "./types";
import { BLADE_BOND_BEHAVIORS } from "./behaviors/blade";
import { BULWARK_BOND_BEHAVIORS } from "./behaviors/bulwark";
import { CHRONO_BOND_BEHAVIORS } from "./behaviors/chrono";
import { FLOW_BOND_BEHAVIORS } from "./behaviors/flow";
import { ETCH_BOND_BEHAVIORS } from "./behaviors/etch";
import { KARMA_BOND_BEHAVIORS } from "./behaviors/karma";

export const BOND_BEHAVIOR_TABLE: Record<string, BondBehavior> = {
  ...BLADE_BOND_BEHAVIORS,
  ...BULWARK_BOND_BEHAVIORS,
  ...CHRONO_BOND_BEHAVIORS,
  ...FLOW_BOND_BEHAVIORS,
  ...ETCH_BOND_BEHAVIORS,
  ...KARMA_BOND_BEHAVIORS,
};

registerBondBehaviors(BOND_BEHAVIOR_TABLE);
