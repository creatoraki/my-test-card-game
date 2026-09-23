import { useEffect, useLayoutEffect, useState } from "react";

// 画布(.screen.battle)恒为 1920×1080, 由 --stage-scale 等比缩放去适配窗口 —— 故画布内所有 px
// (站位 dx/dy、立绘尺寸、侧栏宽、字号)都是"设计 px", 与实际分辨率无关, 任何窗口尺寸下构图完全一致。
// 这是 data/encounters.ts 的手工站位能长期成立的前提。
export const STAGE = {
  width: 1920,
  height: 1080,
  // 缩放上限: 沿用改造前"最大 2560×1440, 更大的显示器四周留黑边"的取舍。想让 4K 铺满就删掉此项。
  maxScale: 2560 / 1920,
} as const;

export interface StageLayout {
  scale: number;
  padX: number;
  padY: number;
}

// 先按 DPR 吸附，再由 fit() 量化到 1920×k×dpr 为整数的缩放值。
// 用户接受画布略小、黑边略宽来换取清晰度；极小尺寸仍由 fit() 的最终量化统一处理。
function snapToDevicePixels(k: number): number {
  const dpr = window.devicePixelRatio || 1;
  const step = 1 / dpr;
  if (k < step) return k;
  return Math.floor(k * dpr) / dpr;
}

// 观测容器实际尺寸, 返回等比缩放与设备像素对齐后的 viewport padding。
// 观测元素而非 window: 容器是 width/height:100%, 将来外面若套了别的 chrome 也不会算错。
// 容器尚未测量到(w/h 为 0)时返回上一次的有效值, 缺省 1 —— 避免首帧闪一下 scale(0)。
export function useStageScale(ref: React.RefObject<HTMLElement | null>): StageLayout {
  const [layout, setLayout] = useState<StageLayout>({ scale: 1, padX: 0, padY: 0 });
  // 装载后同步测一次: 首帧就拿到正确的 k, 不经过 scale(1) 的闪跳
  useLayoutEffect(() => {
    const el = ref.current;
    if (el) setLayout(fit(el.clientWidth, el.clientHeight));
  }, [ref]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setLayout(fit(el.clientWidth, el.clientHeight));
    const ro = new ResizeObserver(([entry]) => {
      const target = entry.target as HTMLElement;
      setLayout(fit(target.clientWidth, target.clientHeight));
    });
    ro.observe(el);
    let media = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
    const listen = () => {
      if (media.addEventListener) {
        media.addEventListener("change", onResolutionChange);
      } else {
        media.addListener?.(onResolutionChange);
      }
    };
    const unlisten = () => {
      if (media.removeEventListener) {
        media.removeEventListener("change", onResolutionChange);
      } else {
        media.removeListener?.(onResolutionChange);
      }
    };
    const onResolutionChange = () => {
      measure();
      unlisten();
      media = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
      listen();
    };
    listen();
    return () => {
      ro.disconnect();
      unlisten();
    };
  }, [ref]);

  return layout;
}

function fit(w: number, h: number): StageLayout {
  if (w <= 0 || h <= 0) return { scale: 1, padX: 0, padY: 0 };
  const dpr = window.devicePixelRatio || 1;
  const snapped = snapToDevicePixels(Math.min(w / STAGE.width, h / STAGE.height, STAGE.maxScale));
  const scale = Math.floor(STAGE.width * snapped * dpr) / (STAGE.width * dpr);
  return {
    scale,
    padX: Math.round((w - STAGE.width * scale) / 2 * dpr) / dpr,
    padY: Math.round((h - STAGE.height * scale) / 2 * dpr) / dpr,
  };
}

// 画布局部坐标系(设计 px, 原点 = 画布左上角)里的一个矩形。
export interface DesignBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface DesignRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// 画布内的元素 → 它所属的那张设计画布(带 data-stage-canvas 标记, 见 app/StageCanvas)。
// 找不到就回落到 document.body —— 那里没有 zoom, 下面的归一化恒等, 同一套代码照样正确。
export function stageHostOf(el: Element): HTMLElement {
  return el.closest<HTMLElement>("[data-stage-canvas]") ?? document.body;
}

/**
 * host 的 getBoundingClientRect() 坐标系相对「设计 px」的倍率。
 *
 * ★ 画布内元素要给浮层定位时, 一律走这条路: 锚点矩形与 host 矩形取自**同一套坐标系**,
 *   两者相减再除以本函数的返回值, 就得到画布局部的设计 px —— 全程不需要知道
 *   「CSS zoom 子树里 getBoundingClientRect() 到底带不带 zoom」。
 * ⚠ 这条约定在不同浏览器/版本上并不一致(zoom 分支 vs @supports not (zoom:1) 的 transform
 *   兜底分支也不同), 一旦判反, zoom===1 的大窗口下恒等看不出问题, 窗口一小浮层就跑飞。
 *   所以新代码**不要**依赖 currentCSSZoom, 用这里的归一化。
 * host.clientWidth 是不含 zoom 的布局宽度: 画布恒为 1920, body 则是视口宽。
 */
export function designScaleOf(host: HTMLElement): number {
  const width = host.clientWidth;
  const rect = host.getBoundingClientRect();
  return width > 0 && rect.width > 0 ? rect.width / width : 1;
}

// 将画布内元素的窗口矩形换算为设计 px，供同页形变和浮层定位共用。
export function designRectOf(el: HTMLElement): DesignRect | null {
  const canvas = el.closest<HTMLElement>("[data-stage-canvas]");
  if (!canvas) return null;
  const canvasRect = canvas.getBoundingClientRect();
  if (canvasRect.width <= 0) return null;
  const scale = canvasRect.width / STAGE.width;
  const rect = el.getBoundingClientRect();
  return {
    x: (rect.left - canvasRect.left) / scale,
    y: (rect.top - canvasRect.top) / scale,
    w: rect.width / scale,
    h: rect.height / scale,
  };
}

// 画布当前生效的 CSS zoom(见 app/styles/stageCanvas.module.css 的 .canvas)。
// ⚠ 仅在确实需要「CSS zoom 值本身」时用。要做坐标换算请用上面的 designScaleOf() ——
//   它不依赖 currentCSSZoom 的语义, 两条渲染分支上都正确。
export function cssZoomOf(el: Element): number {
  const zoom = (el as HTMLElement & { currentCSSZoom?: number }).currentCSSZoom;
  return typeof zoom === "number" && zoom > 0 ? zoom : 1;
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
