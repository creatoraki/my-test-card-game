import { useEffect, useLayoutEffect, useRef, useState } from "react";

export type BoxSize = { width: number; height: number };

/** 监听元素的真实像素尺寸: 外框要按像素画 path, 拿不到宽高就画不出等比的台阶与切角。 */
export function useBoxSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<BoxSize>({ width: 0, height: 0 });

  // 装载后先同步测一次, 首帧就有轮廓, 不闪空框。
  useLayoutEffect(() => {
    const el = ref.current;
    if (el) setSize({ width: el.clientWidth, height: el.clientHeight });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const target = entry.target as HTMLElement;
      setSize((prev) =>
        prev.width === target.clientWidth && prev.height === target.clientHeight
          ? prev
          : { width: target.clientWidth, height: target.clientHeight },
      );
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, size };
}
