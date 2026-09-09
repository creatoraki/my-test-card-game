// 落地余韵: 探索 → 战斗那条路线在「涟漪揭幕 → 战场落地」之间的最后一层演出。
//
// 本层由两片**平级**的固定层组成, 它们跨越 View Transition 的边界, 分工完全不同:
//
//   ① .battle-entry-veil (血色暗角) —— 在 swap 的那一次 flushSync 里就挂载,
//      于是它被烘进 VT 的**新快照**, 随涟漪一起被揭开。VT 结束、快照消失的那一帧,
//      真实 DOM 里的它仍是 opacity:1 —— 与快照里的像素一模一样 ⇒ 零跳变, 然后才开始淡出。
//      ★ 这正是这条路线曾经「涟漪播完画面突然暗一下」的解法: 暗角不能在接缝处凭空出现。
//
//   ② .battle-entry-grade (色调收敛) —— 色调迁移的第 ② 段。VT 存续期间画面是冻结的位图,
//      色调只能挂在 ::view-transition-new(root) 的 filter 上(vt-grade-new); 伪元素在
//      transition.finished 的那一刻连同快照一起消失, 曲线就断了一截, 由这层 backdrop-filter
//      在真实 DOM 上接住末态再收敛回中性。
//      ⚠ 它在 settling 之前**不能**声明 backdrop-filter: 那样会被烘进新快照, 与 vt-grade-new
//        叠成双重调色。
//
// ⚠ 两层必须平级, 不能把暗角塞进带 backdrop-filter 的父层里: backdrop-filter 会创建隔离组,
//   父层的 filter 在接缝处从 none 变为有值时, 子层的混合底会跟着变 —— 等于在同一帧又制造
//   一次跳变。顺序上色调层压在暗角之上, 才与快照里「先叠暗角、再整体调色」一致。
//
// 本组件不自管生命周期: 挂载/卸载与 settling 的翻转都由 ScreenTransition 编排,
// 与 BattleTransitionCurtain 同一套分工(编排在 ScreenTransition, 画面在组件)。
// 时长的唯一真相是 transitions.ts 的 BATTLE_GRADE_SETTLE_MS, 两边读同一个常量。

import type { CSSProperties } from "react";
import type { TransitionOrigin } from "@/ui/app/transitionOrigin";
import { BATTLE_GRADE_SETTLE_MS } from "@/ui/app/transitions";
import s from "./BattleEntryGrading.module.css";

interface Props {
  /** 当初点击进战斗的位置。血色暗角以它为圆心, 与裂纹、涟漪共用同一个源点。 */
  origin: TransitionOrigin | null;
  /** false = 涟漪期间的静止态(等着被烘进快照); true = VT 已结束, 开始收尾。 */
  settling: boolean;
}

export function BattleEntryGrading({ origin, settling }: Props) {
  // 兜底取屏幕中心: 键盘/程序化进战斗时没有点击坐标, 此时退化成居中收束即可。
  const x = origin?.x ?? window.innerWidth / 2;
  const y = origin?.y ?? window.innerHeight / 2;
  const style = {
    "--beg-ms": `${BATTLE_GRADE_SETTLE_MS}ms`,
    "--beg-ox": `${x}px`,
    "--beg-oy": `${y}px`,
  } as CSSProperties;
  // 空字符串属性值在 CSS 里靠 [data-settling] 命中即可; undefined 则整个属性不出现。
  const flag = settling ? "" : undefined;

  return (
    <>
      <div className={s["battle-entry-veil"]} style={style} data-settling={flag} aria-hidden />
      <div className={s["battle-entry-grade"]} style={style} data-settling={flag} aria-hidden />
    </>
  );
}
