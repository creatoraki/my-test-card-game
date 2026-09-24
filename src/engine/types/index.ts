// ============================================================================
// 核心类型定义 —— 引擎与 UI 共享。此目录只定义类型, 不含逻辑。
// 按领域分文件, 由本文件统一导出 —— 调用方一律从 engine/types 引入。
// ============================================================================

export type { DamageModifiers, DamageModifierSink } from "../damage/types";
export type * from "./base";
export type * from "./effects";
export type * from "./cards";
export type * from "./statuses";
export type * from "./stats";
export type * from "./combatants";
export type * from "./battleState";
export type * from "./engineOps";
export type * from "./anim";
export type * from "./prophecy";
