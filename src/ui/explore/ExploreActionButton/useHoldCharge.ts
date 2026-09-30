import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

/** 松手后充能回落到 0 的时长。 */
const DRAIN_MS = 320;

interface Options {
  /** 充满所需时长；≤0 视为不启用。 */
  duration: number;
  enabled: boolean;
  onComplete: () => void;
}

/** 长按充能：按住期间进度线性涨到 1 即触发 onComplete，中途松手 / 移出 / 失焦则快速回落。
 *  进度逐帧写到按钮的 --charge 变量上，不走 React 状态，充能过程不引发重渲染；
 *  只有「是否在充能」这个布尔值进状态，用来切换文案。 */
export function useHoldCharge<T extends HTMLElement>({ duration, enabled, onComplete }: Options) {
  const ref = useRef<T>(null);
  const [charging, setCharging] = useState(false);
  const frame = useRef(0);
  const last = useRef(0);
  const progress = useRef(0);
  const holding = useRef(false);
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;
  const active = enabled && duration > 0;

  const paint = (value: number) => ref.current?.style.setProperty("--charge", value.toFixed(4));

  const tick = useCallback((now: number) => {
    const dt = now - last.current;
    last.current = now;
    const step = holding.current ? dt / duration : -dt / DRAIN_MS;
    progress.current = Math.min(1, Math.max(0, progress.current + step));
    paint(progress.current);
    if (holding.current && progress.current >= 1) {
      holding.current = false;
      progress.current = 0;
      paint(0);
      frame.current = 0;
      setCharging(false);
      completeRef.current();
      return;
    }
    if (!holding.current && progress.current <= 0) {
      frame.current = 0;
      return;
    }
    frame.current = requestAnimationFrame(tick);
  }, [duration]);

  const run = useCallback(() => {
    if (frame.current) return;
    last.current = performance.now();
    frame.current = requestAnimationFrame(tick);
  }, [tick]);

  const start = useCallback(() => {
    if (!active || holding.current) return;
    holding.current = true;
    setCharging(true);
    run();
  }, [active, run]);

  const stop = useCallback(() => {
    if (!holding.current) return;
    holding.current = false;
    setCharging(false);
    run();
  }, [run]);

  useEffect(() => {
    if (!active) stop();
  }, [active, stop]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const isHoldKey = (key: string) => key === " " || key === "Enter";

  const handlers = {
    onPointerDown: (event: PointerEvent<T>) => {
      if (event.button === 0) start();
    },
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
    onBlur: stop,
    onContextMenu: (event: { preventDefault: () => void }) => event.preventDefault(),
    onKeyDown: (event: KeyboardEvent<T>) => {
      if (!isHoldKey(event.key)) return;
      event.preventDefault();
      if (!event.repeat) start();
    },
    onKeyUp: (event: KeyboardEvent<T>) => {
      if (isHoldKey(event.key)) stop();
    },
  };

  return { ref, charging, handlers: active ? handlers : undefined };
}
