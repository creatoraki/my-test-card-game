// ============================================================================
// 程序化 CSS 特效的公共小工具。
//
// fxTime: 与 BladeSlashFx 同一语义的速率钩子 —— 祖先下发 --fx-rate, 变大 = 整体加速,
//         下限 0.25。时间写成 calc 字符串, 改速率不需要重挂载组件。
// fxAnim: 单动画的 delay + duration 简写。
// mulberry32: 固定种子 PRNG, 几何表在模块加载时烘一次, 重播时布局逐 px 相同。
// ============================================================================

import type { CSSProperties } from "react";

export const fxTime = (milliseconds: number) =>
  `calc(${milliseconds}ms / max(var(--fx-rate, 1), 0.25))`;

export const fxAnim = (delay: number, duration: number): CSSProperties => ({
  animationDelay: fxTime(delay),
  animationDuration: fxTime(duration),
});

/** 多段动画(animation-name 逗号列表)的 delay/duration 简写, 顺序与 CSS 中的名字一致。 */
export const fxAnims = (...segments: [delay: number, duration: number][]): CSSProperties => ({
  animationDelay: segments.map(([delay]) => fxTime(delay)).join(", "),
  animationDuration: segments.map(([, duration]) => fxTime(duration)).join(", "),
});

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 基于固定种子的区间取值器。 */
export function seededRange(seed: number) {
  const rnd = mulberry32(seed);
  return (min: number, max: number) => min + rnd() * (max - min);
}

/** 自定义属性写法的类型收口, 避免每处都 `as string`。 */
export const cssVars = (vars: Record<`--${string}`, string | number>) => vars as CSSProperties;
