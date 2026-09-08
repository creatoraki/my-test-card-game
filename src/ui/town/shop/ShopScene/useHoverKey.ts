import { useCallback, useEffect, useRef, useState } from "react";

const HOVER_SETTLE_MS = 90;

/** 将货架悬浮同步到详情栏，但把快速扫过的格子合并成一次更新。 */
export function useHoverKey() {
  const [hovered, setHovered] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const hoveredRef = useRef<string | null>(null);
  const pendingRef = useRef<string | null | undefined>(undefined);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    pendingRef.current = undefined;
  }, []);

  const schedule = useCallback(
    (next: string | null) => {
      clearTimer();
      pendingRef.current = next;
      timerRef.current = window.setTimeout(() => {
        hoveredRef.current = next;
        setHovered(next);
        timerRef.current = null;
        pendingRef.current = undefined;
      }, HOVER_SETTLE_MS);
    },
    [clearTimer],
  );

  const onHoverStart = useCallback((key: string) => schedule(key), [schedule]);
  const onHoverEnd = useCallback(
    (key: string) => {
      if (hoveredRef.current === key || pendingRef.current === key) schedule(null);
    },
    [schedule],
  );
  const reset = useCallback(() => {
    clearTimer();
    hoveredRef.current = null;
    setHovered(null);
  }, [clearTimer]);

  useEffect(() => clearTimer, [clearTimer]);

  return { hovered, onHoverStart, onHoverEnd, reset };
}

