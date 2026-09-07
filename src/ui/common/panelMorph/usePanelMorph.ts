import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { flushSync } from "react-dom";
import {
  CLOSE_MS,
  ENTRY_BACK_DELAY_MS,
  ENTRY_BACK_MS,
  MORPH_EASE,
  OPEN_MS,
  SLIDE_MS,
  WIDEN_MS,
  box,
  centered,
  designRectOf,
  type Rect,
} from "./panelChoreo";

/** 关闭时入口砖滑回的节拍。场景把它摊到入口容器上, 三份场景 CSS 共用同一组时长。 */
const ENTRY_VARS = {
  "--entry-back-ms": `${ENTRY_BACK_MS}ms`,
  "--entry-back-delay": `${ENTRY_BACK_DELAY_MS}ms`,
} as CSSProperties;

export type PanelMorphPhase = "idle" | "opening" | "closing";

interface MorphState<Id extends string> {
  panel: Id | null;
  phase: PanelMorphPhase;
  origin: Rect | null;
}

const createIdle = <Id extends string>(): MorphState<Id> => ({ panel: null, phase: "idle", origin: null });

export function usePanelMorph<Id extends string>(options: {
  rects: Record<Id, Rect>;
}) {
  const { rects } = options;
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
    flushSync(() => setState((previous) => ({ ...previous, phase: "closing" })));
  }, []);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel || !state.panel || state.phase === "idle") return;

    const opening = state.phase === "opening";
    const target = rects[state.panel];
    const origin = state.origin ?? target;

    const finish = () => {
      clearGuard();
      setState((previous) => {
        if (previous.panel !== state.panel || previous.phase !== state.phase) return previous;
        return opening ? { ...previous, phase: "idle" } : createIdle<Id>();
      });
    };

    if (!opening) {
      if (CLOSE_MS <= 0) {
        finish();
        return;
      }
      guardRef.current = window.setTimeout(finish, CLOSE_MS + 120);
      return clearGuard;
    }

    const horizontal = { ...centered(target, origin.w, origin.h), y: origin.y };
    const wide = { ...centered(target, target.w, origin.h), y: origin.y };
    const keyframes = [
      { ...box(origin), offset: 0 },
      { ...box(horizontal), offset: SLIDE_MS / OPEN_MS },
      { ...box(wide), offset: (SLIDE_MS + WIDEN_MS) / OPEN_MS },
      { ...box(target), offset: 1 },
    ];

    if (typeof panel.animate !== "function" || OPEN_MS <= 0) {
      finish();
      return;
    }

    const animation = panel.animate(keyframes, {
      duration: OPEN_MS,
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
    guardRef.current = window.setTimeout(guardedFinish, OPEN_MS + 120);

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
    entryVars: ENTRY_VARS,
  };
}
