import { useEffect, useState } from "react";

/** 入口砖列入场升起的兜底时长: 取三个场景里最长的一条(280ms 延迟 + 520ms)再留一点余量。 */
export const ENTRY_RISE_MS = 900;

/**
 * 入口砖列的「入场升起只播一次」开关。
 *
 * ⚠ 为什么需要它: 入场动画若常驻在 .entry 基础规则上, 浮层关闭演出结束、砖块身上的
 *   .is-revealing 被撤掉的那一帧, animation-name 会从「滑回」变回「升起」——浏览器把这
 *   当成一条新动画重播, 于是砖块先隐后升, 表现为最后闪现一下。
 *   把升起动画收进 [data-entry-rise] 作用域, 场景挂载 ENTRY_RISE_MS 后属性消失,
 *   此后砖块身上再没有任何可被重播的动画。
 *
 * 用法: 把返回值摊到入口砖**容器**上 —— <div {...useEntryRise()} />。
 */
export function useEntryRise() {
  const [rising, setRising] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setRising(false), ENTRY_RISE_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return { "data-entry-rise": rising ? "" : undefined };
}
