// 售货机器人的「嘴」—— 台词调度。
//
// 分工: 说**什么**是数据(data/vendorLines.ts), 说**成什么样**是组件(VendorBubble),
// 什么时候说、说多久、被打断了怎么办 —— 只有这里知道。
//
// 三条规则:
//   1. 事件台词永远插队: 玩家刚点了买入, 机器人却还在念闲聊, 反馈就断了。
//   2. 一次只有一句。气泡是同一个位置, 排队等于让玩家看着一句已经过时的话。
//   3. active 为 false(步骤切走 / 组件卸载)时所有 timer 必须清干净 —— 出击准备页
//      本身会被整块卸载, 残留的 setState 会打在已卸载的树上。

import { useCallback, useEffect, useRef, useState } from "react";
import { pickVendorLine, type VendorLineKind } from "@/data";

/** 气泡停留时长。够读完两行中文, 又不至于挡住画面太久。 */
const BUBBLE_MS = 4500;
/** 闲聊间隔的随机区间。★ 固定间隔会让机器人显得像个计时器而不是个人。 */
const IDLE_MIN_MS = 14000;
const IDLE_MAX_MS = 22000;

export interface VendorLine {
  /** 自增序号。作为气泡的 key ⇒ 连说两次同一句也能重放进场动画。 */
  id: number;
  text: string;
}

const nextIdleDelay = () => IDLE_MIN_MS + Math.random() * (IDLE_MAX_MS - IDLE_MIN_MS);

export function useVendorChatter(active: boolean): {
  line: VendorLine | null;
  say: (kind: VendorLineKind) => void;
} {
  const [line, setLine] = useState<VendorLine | null>(null);
  const seqRef = useRef(0);
  const lastTextRef = useRef<string | null>(null);
  const hideTimerRef = useRef(0);
  const idleTimerRef = useRef(0);
  const activeRef = useRef(active);
  activeRef.current = active;

  const clearTimers = useCallback(() => {
    window.clearTimeout(hideTimerRef.current);
    window.clearTimeout(idleTimerRef.current);
  }, []);

  // ⚠ say / scheduleIdle 必须是稳定引用: 它们会被丢进 StockShelf 与背包的回调链,
  //   每渲染换一个新函数会把下游的 memo 全部击穿。故一律读 ref, 不依赖任何 state。
  //   两者互相调用(说完排下一次闲聊 / 闲聊到点就说), 用 ref 打破这个循环依赖。
  const sayRef = useRef<(kind: VendorLineKind) => void>(() => {});

  // 只负责「排下一次闲聊」这一件事。★ 唯一写 idleTimerRef 的地方 —— 曾经在 say 里和
  //   定时回调里各写一次, 结果两条闲聊链并行跑, 机器人开始自言自语。
  const scheduleIdle = useCallback(() => {
    window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(() => sayRef.current("idle"), nextIdleDelay());
  }, []);

  const say = useCallback(
    (kind: VendorLineKind) => {
      if (!activeRef.current) return;
      const text = pickVendorLine(kind, lastTextRef.current);
      lastTextRef.current = text;
      seqRef.current += 1;
      setLine({ id: seqRef.current, text });

      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = window.setTimeout(() => setLine(null), BUBBLE_MS);
      // 说完一句就把闲聊倒计时推后 —— 玩家在操作时不该被闲聊打断。
      scheduleIdle();
    },
    [scheduleIdle],
  );

  sayRef.current = say;

  useEffect(() => {
    if (!active) {
      clearTimers();
      setLine(null);
      return;
    }
    say("greet");
    return clearTimers;
  }, [active, clearTimers, say]);

  return { line, say };
}
