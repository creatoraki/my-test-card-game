import { useEffect, useRef, useState } from "react";
import type { SortieStep } from "@/store/sortieStore";
import { prefersReducedMotion } from "@/ui/app/transitions";

const SORTIE_STEP_TRANSITION_MS = 460;

export interface SortieStepTransition {
  visibleStep: SortieStep;
  transitioning: boolean;
  intro: boolean;
}

export function useSortieStepTransition(step: SortieStep): SortieStepTransition {
  const [visibleStep, setVisibleStep] = useState(step);
  const [transitioning, setTransitioning] = useState(false);
  const [intro, setIntro] = useState(true);
  const seqRef = useRef(0);
  const transitionTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (step === visibleStep) return;

    const seq = ++seqRef.current;
    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }

    const reducedMotion = prefersReducedMotion();
    setVisibleStep(step);
    setIntro(false);
    setTransitioning(!reducedMotion);

    if (reducedMotion) return;

    transitionTimerRef.current = window.setTimeout(() => {
      transitionTimerRef.current = null;
      if (seq !== seqRef.current) return;
      setTransitioning(false);
    }, SORTIE_STEP_TRANSITION_MS);
  }, [step, visibleStep]);

  useEffect(() => () => {
    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
    }
  }, []);

  return { visibleStep, transitioning, intro };
}