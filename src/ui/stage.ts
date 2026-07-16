import { useEffect, useLayoutEffect, useState } from "react";

// 战斗画面的设计分辨率。画布(.screen.battle)恒为 1920×1080, 由 --stage-scale 等比缩放去适配
// 窗口 —— 故画布内所有 px(站位 dx/dy、立绘尺寸、侧栏宽、字号)都是"设计 px", 与实际分辨率无关,
// 任何窗口尺寸下构图完全一致。这是 data/encounters.ts 的手工站位能长期成立的前提。
export const STAGE = {
  width: 1920,
  height: 1080,
  // 缩放上限: 沿用改造前"最大 2560×1440, 更大的显示器四周留黑边"的取舍。想让 4K 铺满就删掉此项。
  maxScale: 2560 / 1920,
} as const;

// 观测容器实际尺寸, 返回等比缩放系数 k = min(w/1920, h/1080)(上限 STAGE.maxScale)。
// 观测元素而非 window: 容器是 width/height:100%, 将来外面若套了别的 chrome 也不会算错。
// 容器尚未测量到(w/h 为 0)时返回上一次的有效值, 缺省 1 —— 避免首帧闪一下 scale(0)。
export function useStageScale(ref: React.RefObject<HTMLElement | null>): number {
  const [scale, setScale] = useState(1);
  // 装载后同步测一次: 首帧就拿到正确的 k, 不经过 scale(1) 的闪跳
  useLayoutEffect(() => {
    const el = ref.current;
    if (el) setScale(fit(el.clientWidth, el.clientHeight));
  }, [ref]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const box = entry.contentRect;
      setScale(fit(box.width, box.height));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  return scale;
}

function fit(w: number, h: number): number {
  if (w <= 0 || h <= 0) return 1;
  return Math.min(w / STAGE.width, h / STAGE.height, STAGE.maxScale);
}

// 画布局部坐标系(设计 px, 原点 = 画布左上角)里的一个矩形。
export interface DesignBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

// getBoundingClientRect() 量到的是屏幕 px; 画布内的元素要用它定位时必须先换算回设计 px,
// 否则会连同 --stage-scale 被再缩放一次。canvas = .screen.battle 的屏幕矩形, k = 当前缩放。
export function toDesignBox(rect: DOMRect, canvas: DOMRect, k: number): DesignBox {
  return {
    left: (rect.left - canvas.left) / k,
    top: (rect.top - canvas.top) / k,
    right: (rect.right - canvas.left) / k,
    bottom: (rect.bottom - canvas.top) / k,
  };
}
