import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { SortieStep } from "@/store/sortieStore";
import { prefersReducedMotion } from "@/ui/app/transitions";

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => {
    ready: Promise<void>;
    finished: Promise<void>;
  };
};

const VT_SORTIE_ATTR = "vtSortie";

export const VT_SLICE_WINDOW = 3;

export function sliceVtName(offset: number): string {
  if (Math.abs(offset) > VT_SLICE_WINDOW) return "none";
  if (offset === 0) return "vt-sortie-slice-c";
  return `vt-sortie-slice-${offset < 0 ? "m" : "p"}${Math.abs(offset)}`;
}

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

  useEffect(() => {
    if (step === visibleStep) return;

    const seq = ++seqRef.current;
    const root = document.documentElement;
    const from = visibleStep;
    const commit = () =>
      flushSync(() => {
        setVisibleStep(step);
        setIntro(false);
        setTransitioning(true);
      });

    const viewDocument = document as ViewTransitionDocument;
    const transition = !prefersReducedMotion()
      ? viewDocument.startViewTransition?.(commit)
      : undefined;

    if (!transition) {
      flushSync(() => {
        setVisibleStep(step);
        setIntro(false);
      });
      setTransitioning(false);
      return;
    }

    root.dataset[VT_SORTIE_ATTR] = `${from}>${step}`;
    transition.finished.finally(() => {
      delete root.dataset[VT_SORTIE_ATTR];
      if (seq !== seqRef.current) return;
      setTransitioning(false);
    });
  }, [step, visibleStep]);

  return { visibleStep, transitioning, intro };
}