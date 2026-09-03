import { useCallback, useEffect, useRef, useState } from "react";
import { MORPH_MS, SWAP_IN_MS, SWAP_OUT_MS, type ForgeView } from "./forgeMorph";

export type ForgeMorphPhase = "idle" | "out" | "in";

export interface ForgeMorphState {
  view: ForgeView;
  phase: ForgeMorphPhase;
  busy: boolean;
  switchTo: (next: ForgeView) => void;
}

export function useForgeMorph(initialView: ForgeView, onViewChange?: (view: ForgeView) => void): ForgeMorphState {
  const [view, setView] = useState(initialView);
  const [phase, setPhase] = useState<ForgeMorphPhase>("idle");
  const timerRef = useRef<number | null>(null);
  const onViewChangeRef = useRef(onViewChange);
  onViewChangeRef.current = onViewChange;

  useEffect(() => {
    return () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const switchTo = useCallback(
    (next: ForgeView) => {
      if (phase !== "idle" || next === view) return;
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
      setPhase("out");
      timerRef.current = window.setTimeout(() => {
        setView(next);
        onViewChangeRef.current?.(next);
        setPhase("in");
        timerRef.current = window.setTimeout(() => {
          timerRef.current = null;
          setPhase("idle");
        }, MORPH_MS + SWAP_IN_MS);
      }, SWAP_OUT_MS);
    },
    [phase, view],
  );

  useEffect(() => {
    if (phase !== "idle" || view === initialView) return;
    switchTo(initialView);
  }, [initialView, phase, switchTo, view]);

  return { view, phase, busy: phase !== "idle", switchTo };
}
