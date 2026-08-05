import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/ui/app/transitions";

// 「同一个 key 的数值变了」脉冲。给出击背包/仓库的物品格用:
// 物品**新进来**时格子是一次真挂载, CSS 的 mount 动画就够了; 但「连买两个同款」只是
// stack.count 从 1 变 2, uid 不变、DOM 不重挂 —— 玩家会觉得点了没反应。
// 这个 hook 负责认出那种「原地改数」, 让调用方给命中的格子闪一下。
//
// ★ 只比较数值签名, 不比较对象: 调用方把 {uid: count} 摊平传进来, 谁增谁减一目了然,
//   也顺带避免了 stack 对象每次重建导致的假阳性。
// ★ 新出现的 key **不算**变化: 那种情况归 CSS 的挂载动画管, 两边都闪会重影。
// ⚠ 关掉动态效果时直接返回空集 —— 那台机器上任何持续变化都是负担。

// 模块级常量: setPulsed 传同一个引用才不会每次 setState 都触发新一轮渲染。
const EMPTY: ReadonlySet<string> = new Set();

export function useChangePulse(signature: Record<string, number>, ms = 360): ReadonlySet<string> {
  const previousRef = useRef<Record<string, number> | null>(null);
  const timerRef = useRef(0);
  const [pulsed, setPulsed] = useState<ReadonlySet<string>>(EMPTY);

  // 依赖只能是原始值: signature 每次渲染都是新对象, 直接进依赖数组会每帧重跑。
  const stamp = JSON.stringify(signature);

  useEffect(() => {
    const previous = previousRef.current;
    previousRef.current = signature;
    if (prefersReducedMotion() || previous === null) return;

    const changed = new Set<string>();
    for (const [key, count] of Object.entries(signature)) {
      const before = previous[key];
      if (before !== undefined && before !== count) changed.add(key);
    }
    // ⚠ 这里不能 return cleanup 去清定时器: 下一次「没有变化」的重跑会把上一次的闪光
    //   连同定时器一起掐掉, 高亮就永远留在格子上。定时器只在卸载时清。
    if (changed.size === 0) return;

    window.clearTimeout(timerRef.current);
    setPulsed(changed);
    timerRef.current = window.setTimeout(() => setPulsed(EMPTY), ms);
    // signature 已由 stamp 摘要代表, 不入依赖
  }, [stamp, ms]);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  return pulsed;
}
