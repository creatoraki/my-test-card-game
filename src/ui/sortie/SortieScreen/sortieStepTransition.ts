import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { SortieStep } from "@/store/sortie/sortieStore";

// ★ 步骤切换的时序唯一真相点: 旧步骤先离场, ENTER_DELAY 后新步骤错峰入场, 两段重叠。
//   CSS 一律读 sortieMotionVars() 下发的 --sx-* 变量, 不要在样式表里另写时长。
const EXIT_MS = 240;
const ENTER_DELAY_MS = 140;
const ENTER_MS = 420;
const STAGGER_MS = 40;
/** 入场最多错峰到第 3 档(0 / 1 / 2 / 3 个 STAGGER), 收尾要等最后一块落定。 */
const TOTAL_MS = ENTER_DELAY_MS + ENTER_MS + STAGGER_MS * 3;

/** 单个步骤此刻的动效态。intro = 进入出击页的首次入场。 */
export type StepMotion = "intro" | "enter" | "idle" | "exit" | "hidden";

export interface SortieStepTransition {
  visibleStep: SortieStep;
  exitingStep: SortieStep | null;
  transitioning: boolean;
  intro: boolean;
}

export function sortieMotionVars(): CSSProperties {
  return {
    "--sx-exit": `${EXIT_MS}ms`,
    "--sx-delay": `${ENTER_DELAY_MS}ms`,
    "--sx-enter": `${ENTER_MS}ms`,
    "--sx-stagger": `${STAGGER_MS}ms`,
    "--sx-total": `${TOTAL_MS}ms`,
  } as CSSProperties;
}

export function stepMotion(target: SortieStep, t: SortieStepTransition): StepMotion {
  if (t.visibleStep === target) {
    if (t.transitioning) return "enter";
    return t.intro ? "intro" : "idle";
  }
  return t.exitingStep === target ? "exit" : "hidden";
}

/** 可交互 = 静息态或首次入场。过场中两个步骤都不吃输入。 */
export function isMotionActive(motion: StepMotion): boolean {
  return motion === "idle" || motion === "intro";
}

export function useSortieStepTransition(step: SortieStep): SortieStepTransition {
  const [visibleStep, setVisibleStep] = useState(step);
  const [exitingStep, setExitingStep] = useState<SortieStep | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [intro, setIntro] = useState(true);
  const seqRef = useRef(0);
  const transitionTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (step === visibleStep) return;

    const seq = ++seqRef.current;
    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
    }

    setExitingStep(visibleStep);
    setVisibleStep(step);
    setIntro(false);
    setTransitioning(true);

    transitionTimerRef.current = window.setTimeout(() => {
      transitionTimerRef.current = null;
      if (seq !== seqRef.current) return;
      setExitingStep(null);
      setTransitioning(false);
    }, TOTAL_MS);
  }, [step, visibleStep]);

  useEffect(() => () => {
    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
    }
  }, []);

  return { visibleStep, exitingStep, transitioning, intro };
}
