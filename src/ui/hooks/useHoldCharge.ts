import { useEffect, useRef, useState, type KeyboardEventHandler, type PointerEventHandler } from "react";
import { prefersReducedMotion } from "@/ui/app/transitions";

export interface UseHoldChargeOptions {
  ms: number;
  disabled?: boolean;
  onComplete: () => void;
}

export interface UseHoldChargeResult {
  progress: number;
  holding: boolean;
  bind: {
    onPointerDown: PointerEventHandler<HTMLElement>;
    onPointerUp: PointerEventHandler<HTMLElement>;
    onPointerLeave: PointerEventHandler<HTMLElement>;
    onPointerCancel: PointerEventHandler<HTMLElement>;
    onKeyDown: KeyboardEventHandler<HTMLElement>;
    onKeyUp: KeyboardEventHandler<HTMLElement>;
  };
}

export function useHoldCharge({ ms, disabled = false, onComplete }: UseHoldChargeOptions): UseHoldChargeResult {
  const [progress, setProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const startedAtRef = useRef(0);
  const frameRef = useRef(0);
  const holdingRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const cancel = () => {
    window.cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
    holdingRef.current = false;
    setHolding(false);
    setProgress(0);
  };

  const complete = () => {
    window.cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
    holdingRef.current = false;
    setHolding(false);
    setProgress(0);
    onCompleteRef.current();
  };

  const start = () => {
    if (disabled || holdingRef.current) return;
    if (prefersReducedMotion() || ms <= 0) {
      complete();
      return;
    }

    startedAtRef.current = performance.now();
    holdingRef.current = true;
    setHolding(true);
    setProgress(0);

    const frame = (now: number) => {
      if (!holdingRef.current) return;
      const next = Math.min(1, (now - startedAtRef.current) / ms);
      setProgress(next);
      if (next >= 1) {
        complete();
        return;
      }
      frameRef.current = window.requestAnimationFrame(frame);
    };
    frameRef.current = window.requestAnimationFrame(frame);
  };

  useEffect(() => {
    if (!disabled) return;
    cancel();
  }, [disabled]);

  useEffect(() => () => window.cancelAnimationFrame(frameRef.current), []);

  return {
    progress,
    holding,
    bind: {
      onPointerDown: (event) => {
        if (event.button !== 0) return;
        start();
      },
      onPointerUp: () => cancel(),
      onPointerLeave: () => cancel(),
      onPointerCancel: () => cancel(),
      onKeyDown: (event) => {
        if ((event.key !== "Enter" && event.key !== " ") || event.repeat) return;
        event.preventDefault();
        start();
      },
      onKeyUp: (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        cancel();
      },
    },
  };
}