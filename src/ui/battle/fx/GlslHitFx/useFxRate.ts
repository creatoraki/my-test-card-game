import { useLayoutEffect, useState, type RefObject } from "react";

/**
 * 挂载时读一次祖先的 --fx-rate(战斗倍速, 下限 0.25)。
 * 布局阶段读取: 早于共享宿主的第一帧推进, 爆点不会因倍速而错位。
 */
export function useFxRate(ref: RefObject<HTMLElement>): number {
  const [rate, setRate] = useState(1);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const cssRate = parseFloat(getComputedStyle(el).getPropertyValue("--fx-rate"));
    setRate(Math.max(0.25, Number.isFinite(cssRate) && cssRate > 0 ? cssRate : 1));
  }, [ref]);
  return rate;
}
