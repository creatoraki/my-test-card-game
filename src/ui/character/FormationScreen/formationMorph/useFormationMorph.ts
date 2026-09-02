// 编队态 ↔ 详情态的态机 —— 「页面切换」在这一版里只是同一页内的一次元素重组。
//
// ★ 两态在过场期间**同时挂载**: 去程时卡阵留在场上演飞散, 回程时详情栏留在场上演收拢,
//   被点的那一位由 MorphFlyer 的副本从一端飞到另一端。谁在场由 mode + phase 共同决定:
//     roster 层: mode === "roster" || phase === "toDetail"
//     detail 层: charId 存在 && (mode === "detail" || phase === "toRoster")
//
// ⚠ 去程的落点是常量(FIGURE_RECT), 回程的落点必须**测**: 卡阵可能滚动过, 也可能因为
//   唤醒了新队员而排布不同。故回程分两步 —— 先提交 roster 层让卡阵挂载, 再在
//   useLayoutEffect(布局已定、绘制未起)里量出那张卡, 补上飞行描述。中间那一帧卡是隐藏的,
//   看不见空档。

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { BACK_MORPH_MS, FIGURE_RECT, MORPH_MS, designRectOf, type Rect } from "./morphChoreo";

export interface Flight {
  charId: string;
  from: Rect;
  to: Rect;
  ms: number;
  /** true = 回程(立绘 → 卡), 用于决定字号/圆角的插值方向。 */
  reverse: boolean;
}

interface MorphState {
  mode: "roster" | "detail";
  phase: "idle" | "toDetail" | "toRoster";
  /** 详情态在看谁; 过场期间 = 正在飞的那一位。 */
  charId: string | null;
  flight: Flight | null;
}

const IDLE: MorphState = { mode: "roster", phase: "idle", charId: null, flight: null };

/** 卡阵里认领某张卡用的属性, 与 CrewCard 上的 data-crew-card 一致。 */
export const crewCardSelector = (charId: string) =>
  `[data-crew-card="${CSS.escape(charId)}"]`;

export function useFormationMorph() {
  const [state, setState] = useState<MorphState>(IDLE);
  const stateRef = useRef(state);
  stateRef.current = state;

  // 进详情: 点击那一刻量下这张卡的位置, 同步提交换态 —— 必须 flushSync,
  // 否则 MorphFlyer 拿到的起点会是"卡阵已经开始飞散之后"的位置。
  const openDetail = useCallback((charId: string, el: HTMLElement | null) => {
    if (stateRef.current.phase !== "idle") return;
    const from = el ? designRectOf(el) : null;
    if (!from) {
      // 量不到就老老实实瞬切, 不做半截动画。
      setState({ mode: "detail", phase: "idle", charId, flight: null });
      return;
    }
    flushSync(() => {
      setState({
        mode: "detail",
        phase: "toDetail",
        charId,
        flight: { charId, from, to: FIGURE_RECT, ms: MORPH_MS, reverse: false },
      });
    });
  }, []);

  // 回编队: 先把卡阵放回场上, 落点留给下面的 useLayoutEffect 去量。
  const backToRoster = useCallback(() => {
    const current = stateRef.current;
    if (current.mode !== "detail" || current.phase !== "idle" || !current.charId) return;
    setState({ mode: "roster", phase: "toRoster", charId: current.charId, flight: null });
  }, []);

  useLayoutEffect(() => {
    if (state.phase !== "toRoster" || state.flight || !state.charId) return;
    const el = document.querySelector<HTMLElement>(crewCardSelector(state.charId));
    // 卡阵是新挂载的, 滚动位置回到了顶部 —— 队员多到要滚第二行时, 目标卡可能不在可视区内,
    // 先把它带回视野再量, 否则飞行落点会在网格外面。
    el?.scrollIntoView({ block: "nearest", inline: "nearest" });
    const to = el ? designRectOf(el) : null;
    if (!to) {
      setState(IDLE);
      return;
    }
    setState((prev) =>
      prev.phase === "toRoster" && prev.charId
        ? {
            ...prev,
            flight: { charId: prev.charId, from: FIGURE_RECT, to, ms: BACK_MORPH_MS, reverse: true },
          }
        : prev,
    );
  }, [state.phase, state.flight, state.charId]);

  // 飞行结束: 收起副本, 亮出目标元素。
  const finishFlight = useCallback(() => {
    setState((prev) =>
      prev.phase === "idle"
        ? prev
        : {
            mode: prev.mode,
            phase: "idle",
            charId: prev.mode === "detail" ? prev.charId : null,
            flight: null,
          },
    );
  }, []);

  // 兜底: 万一 MorphFlyer 没挂上(例如目标角色在过场中途被移出名册), 也不能把页面卡在过场态。
  useEffect(() => {
    if (state.phase === "idle" || state.flight) return;
    const timer = window.setTimeout(() => finishFlight(), 700);
    return () => window.clearTimeout(timer);
  }, [state.phase, state.flight, finishFlight]);

  return {
    mode: state.mode,
    phase: state.phase,
    charId: state.charId,
    flight: state.flight,
    /** 过场期间必须藏起来的那张卡/立绘栏 —— 它此刻由飞行层代演。 */
    hiddenId: state.phase === "idle" ? null : state.charId,
    showRoster: state.mode === "roster" || state.phase === "toDetail",
    showDetail: Boolean(state.charId) && (state.mode === "detail" || state.phase === "toRoster"),
    openDetail,
    backToRoster,
    finishFlight,
  };
}
