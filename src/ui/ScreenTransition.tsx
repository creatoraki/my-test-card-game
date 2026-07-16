// 场景过场编排: 界面切换时把「瞬移」拆成 旧界面出场 → 黑场停顿 → 新界面入场。
//
// 用 render 回调而非 children: 出场期间要继续渲染的是「旧」界面, 而 App 传下来的
// screen 此刻已经是新的了 —— 只有回调形式才能按内部的 shown 去渲染旧界面。
//
// 串行(旧的先卸载、新的再挂载)是刻意的: 两个界面同时挂载会让 BattleScreen 双挂载,
// 背景视频双解码、素材双预热、定时器串批。串行则天然避开。
//
// 时序/特效全部来自 transitions.ts 的预设表, 本组件不含任何硬编码时长。

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Screen } from "../store/runStore";
import { resolveTransition, type TransitionSpec } from "./transitions";

interface Props {
  screen: Screen; // 目标界面(来自 runStore)
  render: (screen: Screen) => ReactNode; // 按界面渲染对应组件
}

type Phase = "idle" | "exit" | "enter";

export function ScreenTransition({ screen, render }: Props) {
  const [shown, setShown] = useState<Screen>(screen); // 当前实际渲染的界面
  const [phase, setPhase] = useState<Phase>("idle");
  const [spec, setSpec] = useState<TransitionSpec | null>(null); // 本次切换生效的预设
  const [runId, setRunId] = useState(0); // 递增批次号, 兼作 key 强制重放入场动画

  const seqRef = useRef(0); // 批次序号: 快速连点时作废旧批次的定时器回调
  const timersRef = useRef<number[]>([]);
  const phaseRef = useRef<Phase>("idle"); // phase 的同步镜像: 让下面的 effect 读到它又不必把它列进依赖
  phaseRef.current = phase;
  const clearTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };
  useEffect(() => () => clearTimers(), []);

  useEffect(() => {
    if (screen === shown) {
      // 目标又变回了当前正在渲染的界面(快速来回点)。只有「出场中」需要撤销 ——
      // 那批定时器再触发就会切到一个已经作废的目标。
      // 「入场中」绝不能碰: 这个分支在 swap 后的那一帧必然命中(shown 刚被设成 screen),
      // 清掉定时器会误杀收尾回调, 让动画类永久残留在 battle 的祖先上。
      if (phaseRef.current === "exit") {
        clearTimers();
        seqRef.current++;
        setPhase("idle");
        setSpec(null);
      }
      return;
    }

    const next = resolveTransition(shown, screen);

    // 零时长(总开关关闭 / 系统要求减少动效): 直接切, 不设定时器、不加动画类。
    if (next.exit.ms === 0 && next.enter.ms === 0) {
      clearTimers();
      seqRef.current++;
      setShown(screen);
      setPhase("idle");
      setSpec(null);
      return;
    }

    clearTimers();
    const seq = ++seqRef.current;
    setSpec(next);
    setPhase("exit");

    const swap = window.setTimeout(() => {
      if (seq !== seqRef.current) return;
      setShown(screen); // 旧界面在此刻卸载, 新界面挂载
      setPhase("enter");
      setRunId((n) => n + 1);

      const settle = window.setTimeout(() => {
        if (seq !== seqRef.current) return;
        setPhase("idle"); // 归位: 去掉动画类, 让 battle 回到无 transform 的静息态
        setSpec(null);
      }, next.enter.ms);
      timersRef.current.push(settle);
    }, next.exit.ms + next.hold);
    timersRef.current.push(swap);
  }, [screen, shown]);

  const fx = phase === "exit" ? spec?.exit : phase === "enter" ? spec?.enter : null;

  return (
    <>
      <div
        key={runId} // 重挂载 → 入场动画每次都从头播(与 HandCard/SkillCutInCard 的 key 重放范式一致)
        className={`screen-transition${fx ? ` screen-fx-${fx.name}` : ""}`}
        style={fx ? { animationDuration: `${fx.ms}ms` } : undefined}
      >
        {render(shown)}
      </div>
      {spec?.curtain && phase !== "idle" && (
        <div className={`screen-curtain curtain-${spec.curtain}`} aria-hidden />
      )}
    </>
  );
}
