import { createPortal } from "react-dom";
import { useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import type { ItemStack } from "@/items/types";
import ItemDetail from "@/ui/common/item/ItemDetail";
import { designScaleOf, stageHostOf } from "@/ui/hooks/stage";
import s from "./ItemTooltip.module.css";

// 全是设计 px(1920×1080 画布基准)。浮层就挂在画布内部, 跟着画布一起 zoom ⇒
// 这里不再有任何"屏幕 px"的概念, 也不需要乘/除缩放系数。
const TOOLTIP_GAP = 18;
const TOOLTIP_MARGIN = 12;

export type TooltipPoint = {
  /** 锚点(触发元素右缘中点)在 host 局部坐标系里的设计 px。 */
  x: number;
  y: number;
  /** 浮层要挂进去的那张设计画布 —— 挂在画布内, 坐标系才和画布内的一切 px 一致。 */
  host: HTMLElement;
};

/**
 * 由触发元素算出浮窗锚点。
 *
 * ⚠ 必须传元素、不能只传 DOMRect: 要拿元素去找它所属的画布(host), 并用画布矩形把锚点
 *   归一化成设计 px。这样浮层的定位与 CSS zoom 的坐标系语义完全解耦 —— 详见
 *   hooks/stage.ts 的 designScaleOf()。历史上这里用 currentCSSZoom 手工换算屏幕 px,
 *   在窗口小于 1920 时会把浮层推出可视区。
 */
export function tooltipPointFromElement(el: Element): TooltipPoint {
  const host = stageHostOf(el);
  const hostRect = host.getBoundingClientRect();
  const rect = el.getBoundingClientRect();
  const k = designScaleOf(host);
  return {
    x: (rect.right - hostRect.left) / k,
    y: (rect.top + rect.height / 2 - hostRect.top) / k,
    host,
  };
}

export interface TooltipPlacement {
  left: number;
  top: number;
  /** 浮层高度上限(设计 px) = 画布高度减两侧留白。渲染时就要下发, 否则量出的高度会超界。 */
  maxHeight: number;
  /** 首帧还没量到真实尺寸 —— 此时浮层先以 visibility:hidden 渲染, 免得闪一下错位。 */
  ready: boolean;
}

/**
 * 浮层放置: 量出浮层**真实**宽高(而不是写死的估算值), 再在 host 的边界盒内翻转与夹取。
 *
 * @param topOffset 缺省(undefined)= 垂直居中对齐锚点; 传数字 = 顶边落在锚点上方该距离处。
 */
export function useTooltipPlacement(
  point: TooltipPoint,
  ref: RefObject<HTMLElement | null>,
  topOffset?: number,
): TooltipPlacement {
  const boxHeight = point.host.clientHeight;
  const maxHeight = Math.max(0, boxHeight - TOOLTIP_MARGIN * 2);
  const [placed, setPlaced] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const host = point.host;
    // 浮层与 host 的矩形取自同一套坐标系, 同除以 k 即得设计 px(见 designScaleOf 的注释)。
    const k = designScaleOf(host);
    const rect = el.getBoundingClientRect();
    const width = rect.width / k;
    const height = rect.height / k;
    const boxW = host.clientWidth;
    const boxH = host.clientHeight;

    const right = point.x + TOOLTIP_GAP;
    const left =
      right + width <= boxW - TOOLTIP_MARGIN
        ? right
        : Math.max(TOOLTIP_MARGIN, point.x - width - TOOLTIP_GAP);
    const wanted = topOffset === undefined ? point.y - height / 2 : point.y - topOffset;
    const top = Math.min(
      Math.max(TOOLTIP_MARGIN, wanted),
      Math.max(TOOLTIP_MARGIN, boxH - height - TOOLTIP_MARGIN),
    );
    setPlaced({ left, top });
  }, [point, ref, topOffset]);

  return { left: placed?.left ?? 0, top: placed?.top ?? 0, maxHeight, ready: placed !== null };
}

/** 放置结果 → 浮层根节点的 inline style。各处换皮浮卡(商店仓库、出击背包)共用。 */
export function tooltipStyle(placement: TooltipPlacement): CSSProperties {
  return {
    left: `${placement.left}px`,
    top: `${placement.top}px`,
    visibility: placement.ready ? undefined : "hidden",
    "--tooltip-max-h": `${placement.maxHeight}px`,
  } as CSSProperties;
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
  const ref = useRef<HTMLDivElement>(null);
  const placement = useTooltipPlacement(point, ref);

  return createPortal(
    <div
      className={s["item-tooltip"]}
      ref={ref}
      style={{ ...themeStyle, ...tooltipStyle(placement) }}
      role="tooltip"
    >
      <ItemDetail stack={stack} className={s["item-tooltip-detail"]} />
    </div>,
    point.host,
  );
}
