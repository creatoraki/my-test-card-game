// ============================================================================
// 钩子注册表 —— 状态定义与行为型遗物的查表入口。本文件**不 import 任何运行时模块**。
//
// ★ 为什么要有这一层: 状态钩子与遗物行为要调用引擎原语(ops / 伤害管线), 而原语结算时又要回查
//   状态定义与遗物钩子。两边直接互相 import 就是运行时依赖环 —— 调整 import 顺序或开启代码分割后,
//   很容易在初始化阶段取到 undefined。
//   现在原语一侧只查这里的表; 表由 statuses/index 与 relicBehaviors/index 在自身加载时填入。
// ⚠ 使用前提: 引擎入口(engine/index 或 engine/battle)已加载 —— 两个入口都会带起 statuses 与
//   relicBehaviors 的注册。只 import 某个子模块单独调用、又没加载入口时, 表是空的。
// ============================================================================

import type { StatusDef } from "../types";
import type { RelicBehavior } from "../relics/types";

/** 状态定义表(按 id)。只读视图 —— 写入走 registerStatusDefs。 */
export const STATUS_DEFS: Readonly<Record<string, StatusDef>> = {};

/** 行为型遗物表(按遗物 id)。只读视图 —— 写入走 registerRelicBehaviors。 */
export const RELIC_BEHAVIORS: Readonly<Record<string, RelicBehavior>> = {};

export function registerStatusDefs(defs: Record<string, StatusDef>): void {
  Object.assign(STATUS_DEFS, defs);
}

export function registerRelicBehaviors(behaviors: Record<string, RelicBehavior>): void {
  Object.assign(RELIC_BEHAVIORS, behaviors);
}
