import { useEffect, useRef, useState, type ReactNode } from "react";
import type { SortieStep } from "@/store/sortieStore";
import { prefersReducedMotion } from "@/ui/app/transitions";
import { cx } from "@/ui/common/cx";
import s from "./SortieStepViewport.module.css";

const STEP_SLIDE_MS = 420;

type SlideDirection = "forward" | "back";

interface StepTransition {
  from: SortieStep;
  to: SortieStep;
  direction: SlideDirection;
}

interface Props {
  step: SortieStep;
  map: ReactNode;
  prep: ReactNode;
  onTransitioningChange: (transitioning: boolean) => void;
}

export function SortieStepViewport({
  step,
  map,
  prep,
  onTransitioningChange,
}: Props) {
  const visibleStepRef = useRef<SortieStep>(step);
  const mapPanelRef = useRef<HTMLDivElement>(null);
  const prepPanelRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const sequenceRef = useRef(0);
  const [visibleStep, setVisibleStep] = useState(step);
  const [transition, setTransition] = useState<StepTransition | null>(null);

  useEffect(() => {
    if (step === visibleStepRef.current) return;

    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const sequence = ++sequenceRef.current;
    const from = visibleStepRef.current;
    const direction: SlideDirection = step === "prep" ? "forward" : "back";
    visibleStepRef.current = step;
    setVisibleStep(step);

    if (prefersReducedMotion()) {
      setTransition(null);
      onTransitioningChange(false);
      return;
    }

    setTransition({ from, to: step, direction });
    onTransitioningChange(true);
    timerRef.current = window.setTimeout(() => {
      if (sequence !== sequenceRef.current) return;
      timerRef.current = null;
      setTransition(null);
      onTransitioningChange(false);
    }, STEP_SLIDE_MS);
  }, [onTransitioningChange, step]);

  useEffect(() => {
    const locked = transition !== null;
    const panels = [
      { element: mapPanelRef.current, active: !locked && visibleStep === "map" },
      { element: prepPanelRef.current, active: !locked && visibleStep === "prep" },
    ];
    panels.forEach(({ element, active }) => {
      if (element) element.inert = !active;
    });
  }, [transition, visibleStep]);

  useEffect(
    () => () => {
      sequenceRef.current += 1;
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      onTransitioningChange(false);
    },
    [onTransitioningChange],
  );

  const renderPanel = (panelStep: SortieStep, content: ReactNode) => {
    const isCurrent = !transition && visibleStep === panelStep;
    const isExiting = transition?.from === panelStep;
    const isEntering = transition?.to === panelStep;
    const direction = transition?.direction;
    const className = cx(
      s.panel,
      isCurrent && s.active,
      !isCurrent && !isExiting && !isEntering && s.inactive,
      isExiting && direction === "forward" && s.exitForward,
      isExiting && direction === "back" && s.exitBack,
      isEntering && direction === "forward" && s.enterForward,
      isEntering && direction === "back" && s.enterBack,
    );
    const ref = panelStep === "map" ? mapPanelRef : prepPanelRef;

    return (
      <div
        ref={ref}
        className={className}
        aria-hidden={!isCurrent}
        data-step={panelStep}
      >
        {content}
      </div>
    );
  };

  return (
    <section className={cx(s.viewport, transition && s.transitioning)} aria-label="出击步骤">
      {renderPanel("map", map)}
      {renderPanel("prep", prep)}
    </section>
  );
}