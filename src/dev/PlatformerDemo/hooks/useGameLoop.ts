import { useEffect, useRef } from "react";

const STEP = 1 / 120;
const MAX_FRAME = 0.1;

/**
 * rAF 驱动的固定步长循环：step 以 1/120 秒推进逻辑，render 每帧调用一次写 DOM。
 * 回调存 ref，调用方无需 memo；页面隐藏后恢复时丢弃积压时间，避免一次性快进。
 */
export function useGameLoop(step: (dt: number) => void, render: (frameDt: number) => void) {
  const callbacks = useRef({ step, render });
  callbacks.current = { step, render };

  useEffect(() => {
    let request = 0;
    let previous: number | undefined;
    let accumulator = 0;
    const tick = (now: number) => {
      if (document.hidden) {
        previous = undefined;
      } else {
        const frame = previous === undefined ? 0 : Math.min(MAX_FRAME, (now - previous) / 1000);
        previous = now;
        accumulator += frame;
        while (accumulator >= STEP) {
          callbacks.current.step(STEP);
          accumulator -= STEP;
        }
        callbacks.current.render(frame);
      }
      request = requestAnimationFrame(tick);
    };
    request = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(request);
  }, []);
}
