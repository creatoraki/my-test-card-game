import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "./transitions";

// 逐字机: 把一段叙事文本按「一个字一个字打出来」的节奏交给渲染层。
//
// 为什么不做成 CSS: 常见的 steps() + width 那套只对**等宽单行**有效 —— 中文换行后每行字数不同,
// width 裁切会把第二行整段吞掉。逐字必须落到文本内容上, 只能走 JS。
//
// ★ 节奏才是重点, 不是速度。匀速吐字读起来像机器打印, 没有「有人在讲」的感觉;
//   在标点处**多停一拍**, 一段话立刻有了断句和轻重 —— 这是「层次感」的全部来源。
// ⚠ 关掉动态效果时**直接给全文**(不是快放一遍): 那台机器上任何持续变化都是负担。
//   JS 侧的开关与场景过场、useCountUp 共用 ui/transitions.ts 的 prefersReducedMotion()。
// ★ delayMs: 等 CSS 那边的入场把这一块**显示出来**之后再起播。面板是从画布上方滑进来的,
//   不等的话开头几个字是在半空中打的, 白做。

// 标点 → 额外停顿(单位: 「几个字的时长」)。
// 逗号级停半拍, 句末停一拍半 —— 再长就拖了, 玩家会开始等而不是读。
const PAUSE: Record<string, number> = {
  "，": 1.6,
  "、": 1.1,
  "；": 1.6,
  "：": 1.6,
  ",": 1.6,
  "。": 3,
  "！": 3,
  "？": 3,
  "…": 2.4,
  "—": 2.4,
  ".": 3,
  "!": 3,
  "?": 3,
};

export interface Typed {
  /** 当前已经打出来的部分。 */
  shown: string;
  /** 全文是否已打完 —— 用来给「选项就位」之类的后续节拍开闸。 */
  done: boolean;
}

export function useTypewriter(text: string, delayMs = 0, cps = 34): Typed {
  const reduced = prefersReducedMotion();
  // ⚠ 关掉动态效果时连初值都直接给全文 —— 不能先渲染一个空串再跳。
  const [count, setCount] = useState(() => (reduced ? Infinity : 0));
  // 切字必须按码点走: 直接 text.slice 会在代理对(emoji/生僻字)中间断开, 渲染出半个字。
  const charsRef = useRef<string[]>([]);
  charsRef.current = Array.from(text);
  const total = charsRef.current.length;

  useEffect(() => {
    if (reduced || cps <= 0 || total === 0) {
      setCount(Infinity);
      return;
    }
    setCount(0);

    const chars = charsRef.current;
    const per = 1000 / cps;
    let raf = 0;
    const run = () => {
      const t0 = performance.now();
      // 每个字自己的「应出现时刻」: 前面所有字的基础时长 + 前面所有标点的额外停顿。
      // 预先累加成表, 免得每帧重算。
      const at: number[] = new Array(total);
      let acc = 0;
      for (let i = 0; i < total; i += 1) {
        acc += per;
        at[i] = acc;
        acc += (PAUSE[chars[i]] ?? 0) * per;
      }
      const step = (now: number) => {
        const t = now - t0;
        let n = 0;
        while (n < total && at[n] <= t) n += 1;
        setCount(n);
        if (n < total) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    const timer = delayMs > 0 ? window.setTimeout(run, delayMs) : (run(), 0);
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
    // text 进依赖: 换事件即重置游标, 自然重播。
  }, [text, delayMs, cps, total, reduced]);

  const done = count >= total;
  return {
    shown: done ? text : charsRef.current.slice(0, count).join(""),
    done,
  };
}
