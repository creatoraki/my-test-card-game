import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "./transitions";

// 数值滚动: 目标值一变, 就用 rAF 从**上一次显示的值**滚到新值(而不是每次从 0 起) ——
// 从 0 起会让「切到下一个角色」看起来像面板被清空重填, 从旧值起才读作「同一块仪表在换读数」。
//
// 为什么不做成 CSS: 数字是文本内容, CSS 动不了; @property + counter 那套在中文字体下对不齐,
// 而且拿不到「取整/带小数」的控制权。
//
// ⚠ 关掉动态效果时**直接返回终值**(不是快速播一遍): 那台机器上任何持续变化都是负担。
//   JS 侧的开关与场景过场共用 ui/transitions.ts 的 prefersReducedMotion()。
// ★ 起点是 0(挂载时)或上一次显示的值(目标变化时) —— 于是"整块重挂换人"与"原地改数"
//   两种用法都有滚动过程。
// ★ delayMs: 等 CSS 那边的错峰入场把这一块**显示出来**之后再开滚。浮层里的内容都要等面板
//   落定(--content-delay)才浮现, 不等的话数字在看不见的时候就滚完了, 白做。
export function useCountUp(target: number, delayMs = 0, durationMs = 460, decimals = 0): number {
  // ⚠ 关掉动态效果时连初值都直接给终值 —— 不能先渲染一个 0 再跳。
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0));
  // 起点必须走 ref 而不是读 state: effect 里读 state 会把 value 逼进依赖数组,
  // 于是每帧 setValue 都重启一次动画 ⇒ 永远滚不到终点。
  const fromRef = useRef(value);

  useEffect(() => {
    if (prefersReducedMotion() || durationMs <= 0) {
      fromRef.current = target;
      setValue(target);
      return;
    }
    const from = fromRef.current;
    if (from === target) return;

    const q = 10 ** decimals; // 量化到显示精度: 否则末尾会有一段肉眼看不见的空滚
    let raf = 0;
    const run = () => {
      const t0 = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / durationMs);
        // easeOutCubic: 起步快、收尾稳 —— 与项目里 cubic-bezier(.2,.72,.28,1) 的手感一致
        const k = 1 - (1 - t) ** 3;
        const v = Math.round((from + (target - from) * k) * q) / q;
        fromRef.current = v;
        setValue(v);
        if (t < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    const timer = delayMs > 0 ? window.setTimeout(run, delayMs) : (run(), 0);
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [target, delayMs, durationMs, decimals]);

  return value;
}
