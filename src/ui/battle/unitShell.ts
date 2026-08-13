// ============================================================================
// 「战斗单位外壳」的跨组件契约 —— 唯一真相点。
//
// 场上有两种外壳, 由两个不同的组件持有:
//   敌人 → battle/CombatantView 的 .combatant(场景里的立绘)
//   我方 → battle/AllyBar    的 .ally-slot(底部 HUD 的队伍卡)
// 它们的**几何**天差地别, 但**演出**必须完全一致: 前冲、受击抖动闪白、受益光晕、
// 阵亡压暗、可选中高亮、命中特效层与飘字的定位 —— 这些规则只该写一份。
//
// ★ 那一份写在 battle/fx/HitFxLayer 与各外壳自己的 module.css 里, 靠**data 属性**跨模块
//   命中(样式铁律 2): 类名会被 CSS Modules 哈希, 属性不会。于是 HitFxLayer 能写
//   `[data-unit][data-react="hit"]`, 同时命中两种外壳, 而不必知道任何一方的类名。
//   死亡表现另有 `data-death` 阶段属性: drain/vanish 期间保持活体外观, 只有 dead 才挂 `data-dead`。
//   濒死是我方 alive 且 hp === 0, 与 data-death 三阶段互斥。
//
// ⚠ 改这里的任何一个键 = 全库搜同名字符串, CSS 那侧没有类型保护。
// ⚠ 属性选择器与类选择器同权(0,1,0), 所以改造前后的层叠关系逐条不变。
// ============================================================================

import type { DeathPhase } from "@/ui/battle/deathChoreo";

/** 单位外壳的受击反应。null = 当前没有反应。 */
export type UnitReact = "hit" | "bless" | null;

/** 单位外壳的阵营。决定前冲方向(敌人在上朝下冲, 我方在下朝上冲)。 */
export type UnitSide = "enemy" | "player";

export interface UnitShellState {
  side: UnitSide;
  dead?: boolean;
  /** 我方仍存活但 HP 为 0 的濒死态, 与死亡演出阶段互斥。 */
  downed?: boolean;
  /** 纯 UI 的死亡表现阶段; dead 只表示闸门已放行的最终死亡态。 */
  death?: DeathPhase;
  /** 当前出牌的施法者 —— 播前冲。 */
  attacking?: boolean;
  /** 可作为当前卡的目标 —— 播描边高亮, 并接受点击。 */
  targetable?: boolean;
  /** 敌人正在蓄力预告。 */
  telegraph?: boolean;
  react?: UnitReact;
}

/**
 * 把外壳状态摊成一组 data-* 属性, 直接展开到单位根节点上。
 *
 *   <div {...unitShellAttrs({ side: "enemy", dead, attacking, react })} className={s.combatant}>
 *
 * ★ 值为假的键一律给 undefined 而不是 false —— React 会**整条略过** undefined 属性,
 *   给 false 则会渲染成 data-dead="false", 而 `[data-dead]` 只判存在性, 会当成真。
 */
export function unitShellAttrs(state: UnitShellState): Record<string, string | undefined> {
  return {
    "data-unit": "",
    "data-side": state.side,
    "data-dead": state.dead ? "" : undefined,
    "data-downed": state.downed ? "" : undefined,
    "data-death": state.death && state.death !== "alive" ? state.death : undefined,
    "data-attacking": state.attacking ? "" : undefined,
    "data-targetable": state.targetable ? "" : undefined,
    "data-telegraph": state.telegraph ? "" : undefined,
    "data-react": state.react ?? undefined,
  };
}
