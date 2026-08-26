import { createPortal } from "react-dom";
import type { CSSProperties } from "react";
import type { ItemStack } from "@/items/types";
import ItemDetail from "@/ui/common/item/ItemDetail";
import { cssZoomOf } from "@/ui/hooks/stage";
import s from "./ItemTooltip.module.css";

// 全是设计 px(1920×1080 画布基准) —— 参与屏幕边界判断前一律乘 point.zoom 换成屏幕 px。
const TOOLTIP_WIDTH = 260;
const TOOLTIP_ESTIMATED_HEIGHT = 300;
const TOOLTIP_GAP = 18;
const TOOLTIP_MARGIN = 12;

export type TooltipPoint = {
  /** 锚点的真实屏幕 px(已乘画布 zoom) —— 浮窗是 body 上的 fixed 图层, 只认屏幕坐标。 */
  x: number;
  y: number;
  /** 触发元素所在画布的 CSS zoom。浮窗按它同步缩放, 与周围 UI 的大小比例才恒定。 */
  zoom: number;
};

/**
 * 由触发元素算出浮窗锚点。
 *
 * ⚠ 必须传元素、不能只传 DOMRect: 设计画布用 `zoom: var(--stage-scale)` 缩放(见
 *   app/styles/stageCanvas.module.css), 而 zoom 子树内 getBoundingClientRect() 返回的是
 *   **未乘 zoom 的设计 px**。1920 宽的窗口下 zoom=1, 两套坐标恰好重合, 所以只有窗口变小时
 *   才露馅 —— 锚点 x 偏大, 浮窗被左右翻转逻辑推到窗口外, 表现为"完全看不见浮窗"。
 *   换算依赖 cssZoomOf(), 它在老浏览器的 transform 兜底分支上回落到 1(那里本就是屏幕 px)。
 */
export function tooltipPointFromElement(el: Element): TooltipPoint {
  const rect = el.getBoundingClientRect();
  const zoom = cssZoomOf(el);
  return {
    x: rect.right * zoom,
    y: (rect.top + rect.height / 2) * zoom,
    zoom,
  };
}

export default function ItemTooltip({
  stack,
  point,
  themeStyle = {},
}: {
  stack: ItemStack;
  point: TooltipPoint;
  themeStyle?: CSSProperties;
}) {
  if (typeof document === "undefined") return null;

  // 屏幕 px 下的实际占位: 内层跟着画布 zoom 一起缩, 所以边界判断也要用缩过的尺寸。
  const zoom = point.zoom;
  const width = TOOLTIP_WIDTH * zoom;
  const height = TOOLTIP_ESTIMATED_HEIGHT * zoom;
  const gap = TOOLTIP_GAP * zoom;
  const margin = TOOLTIP_MARGIN * zoom;

  const right = point.x + gap;
  const left =
    right + width <= window.innerWidth - margin
      ? right
      : Math.max(margin, point.x - width - gap);
  const top = Math.min(
    Math.max(margin, point.y - height / 2),
    Math.max(margin, window.innerHeight - height - margin),
  );
  // 高度上限: 窗口高度是屏幕 px, 而内层的长度单位是设计 px, 故要先除回 zoom。
  const maxHeight = Math.min(TOOLTIP_ESTIMATED_HEIGHT, (window.innerHeight - margin * 2) / zoom);

  return createPortal(
    <div className={s["item-tooltip"]} style={{ left: `${left}px`, top: `${top}px` }} role="tooltip">
      {/* 画布缩放跟随层: 浮窗内容照旧全部按设计 px 书写, 由这一层 zoom 一次性缩到当前画布比例。 */}
      <div
        className={s["item-tooltip-zoom"]}
        style={{ ...themeStyle, zoom, "--tooltip-max-h": `${maxHeight}px` } as CSSProperties}
      >
        <ItemDetail stack={stack} className={s["item-tooltip-detail"]} />
      </div>
    </div>,
    document.body,
  );
}
