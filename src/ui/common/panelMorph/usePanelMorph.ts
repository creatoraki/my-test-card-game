import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { CLOSE_MS, CLOSE_TALLEN_MS, CLOSE_WIDEN_MS, MORPH_EASE, OPEN_MS, SLIDE_MS, WIDEN_MS, box, centered, designRectOf, type Rect } from "./panelChoreo";

export type PanelMorphPhase = "idle" | "opening" | "closing";

interface MorphState<Id extends string> {
  panel: Id | null;
  phase: PanelMorphPhase;
  origin: Rect | null;
}

const createIdle = <Id extends string>(): MorphState<Id> => ({ panel: null, phase: "idle", origin: null });

export function usePanelMorph<Id extends string>(options: {
  rects: Record<Id, Rect>;
  entryAttr: string;
}) {
  const { rects, entryAttr } = options;
  const [state, setState] = useState<MorphState<Id>>(() => createIdle<Id>());
  const stateRef = useRef(state);
  const panelRef = useRef<HTMLElement>(null);
  const guardRef = useRef<number | null>(null);
  stateRef.current = state;

  const clearGuard = useCallback(() => {
    if (guardRef.current !== null) {
      window.clearTimeout(guardRef.current);
      guardRef.current = null;
    }
  }, []);

  const openPanel = useCallback((panel: Id, entry: HTMLElement | null) => {
    if (stateRef.current.phase !== "idle") return;
    const origin = entry ? designRectOf(entry) : null;
    if (!origin) {
      setState({ panel, phase: "idle", origin: null });
      return;
    }
    flushSync(() => setState({ panel, phase: "opening", origin }));
  }, []);

  const closePanel = useCallback(() => {
    const current = stateRef.current;
    if (!current.panel || current.phase === "closing") return;
    const entry = document.querySelector<HTMLElement>(`[${entryAttr}="${current.panel}"]`);
    const origin = entry ? designRectOf(entry) : current.origin;
    if (!origin) {
      setState(createIdle<Id>());
      return;
    }
    flushSync(() => setState((previous) => ({ ...previous, phase: "closing", origin })));
  }, [entryAttr]);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel || !state.panel || state.phase === "idle") return;

    const opening = state.phase === "opening";
    const target = rects[state.panel];
    const origin = state.origin ?? target;
    const horizontal = { ...centered(target, origin.w, origin.h), y: origin.y };
    const wide = { ...centered(target, target.w, origin.h), y: origin.y };
    const from = opening ? origin : target;
    const to = opening ? target : origin;
    const keyframes = opening
      ? [
          { ...box(from), offset: 0 },
          { ...box(horizontal), offset: SLIDE_MS / OPEN_MS },
          { ...box(wide), offset: (SLIDE_MS + WIDEN_MS) / OPEN_MS },
          { ...box(to), offset: 1 },
        ]
      : [
          { ...box(from), offset: 0 },
          { ...box(wide), offset: CLOSE_TALLEN_MS / CLOSE_MS },
          { ...box(horizontal), offset: (CLOSE_TALLEN_MS + CLOSE_WIDEN_MS) / CLOSE_MS },
          { ...box(to), offset: 1 },
        ];

    const finish = () => {
      clearGuard();
      setState((previous) => {
        if (previous.panel !== state.panel || previous.phase !== state.phase) return previous;
        return opening ? { ...previous, phase: "idle" } : createIdle<Id>();
      });
    };

    if (typeof panel.animate !== "function" || (opening ? OPEN_MS : CLOSE_MS) <= 0) {
      finish();
      return;
    }

    const animation = panel.animate(keyframes, {
      duration: opening ? OPEN_MS : CLOSE_MS,
      easing: MORPH_EASE,
      fill: "both",
    });
    let done = false;
    const guardedFinish = () => {
      if (done) return;
      done = true;
      finish();
    };
    animation.addEventListener("finish", guardedFinish);
    guardRef.current = window.setTimeout(guardedFinish, (opening ? OPEN_MS : CLOSE_MS) + 120);

    return () => {
      clearGuard();
      animation.cancel();
    };
  }, [clearGuard, rects, state.panel, state.phase, state.origin]);

  useEffect(() => {
    if (!state.panel) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePanel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closePanel, state.panel]);

  useEffect(() => () => clearGuard(), [clearGuard]);

  return {
    panel: state.panel,
    phase: state.phase,
    ready: state.phase === "idle" && state.panel !== null,
    panelRef,
    openPanel,
    closePanel,
    hiddenEntry: state.panel,
  };
}
