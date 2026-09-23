import { ops } from "../core/ops";
import { dealDamage } from "./pipeline";

// 晚绑定: ops 不 import 伤害管线(那会成环), 由这里在加载时把实现挂上去。
ops.dealDamage = dealDamage;

export { dealDamage };
export { previewDamage } from "./preview";
export { applyDamageModifiers, collectDamageModifiers } from "./modifiers";
export { runGuardHooks, runStatusHooks } from "./hooks";
export type { DamageModifiers, DamageModifierSink } from "./types";
