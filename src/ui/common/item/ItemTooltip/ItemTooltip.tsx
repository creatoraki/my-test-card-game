import { createPortal } from "react-dom";
import { useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { getItemDef } from "@/data";
import type { ItemStack } from "@/items/types";
import type { SlotAction } from "@/ui/common/item/ItemActionMask";
import { cx } from "@/ui/common/shared/cx";
import { designScaleOf, stageHostOf } from "@/ui/app/shared/stage";
import { ItemTooltipActions } from "./ItemTooltipActions";
import { ItemTooltipCard } from "./ItemTooltipCard";
import s from "./ItemTooltip.module.css";

// 全是设计 px(1920×1080 画布基准)。浮层就挂在画布内部, 跟着画布一起 zoom ⇒
// 这里不再有任何"屏幕 px"的概念, 也不需要乘/除缩放系数。
const TOOLTIP_GAP = 18;
const TOOLTIP_MARGIN = 12;

export type TooltipPoint = {
  /** 锚点在 host 局部坐标系里的设计 px。 */
  x: number;
  y: number;
  /** 默认从右侧展开；left 从左侧展开；vertical 优先下方、放不下翻到上方；top 优先上方、放不下翻到下方。 */
  direction?: TooltipDirection;
  /** 浮层要挂进去的那张设计画布 —— 挂在画布内, 坐标系才和画布内的一切 px 一致。 */
  host: HTMLElement;
};

export type TooltipDirection = "left" | "right" | "vertical" | "top";

/**
 * 由触发元素算出浮窗锚点。
 *
 * ⚠ 必须传元素、不能只传 DOMRect: 要拿元素去找它所属的画布(host), 并用画布矩形把锚点
 *   归一化成设计 px。这样浮层的定位与 CSS zoom 的坐标系语义完全解耦 —— 详见
 *   ui/app/shared/stage.ts 的 designScaleOf()。历史上这里用 currentCSSZoom 手工换算屏幕 px,
 *   在窗口小于 1920 时会把浮层推出可视区。
 */
export function tooltipPointFromElement(el: Element, direction: TooltipDirection = "right"): TooltipPoint {
  const host = stageHostOf(el);
  const hostRect = host.getBoundingClientRect();
  const rect = el.getBoundingClientRect();
  const k = designScaleOf(host);
  return {
    x: (
      direction === "vertical" || direction === "top"
        ? rect.left + rect.width / 2 - hostRect.left
        : (direction === "left" ? rect.left : rect.right) - hostRect.left
    ) / k,
    y: (
      direction === "vertical"
        ? rect.bottom - hostRect.top
        : direction === "top"
          ? rect.top - hostRect.top
          : rect.top + rect.height / 2 - hostRect.top
    ) / k,
    host,
    direction,
  };
}

export interface TooltipPlacement {
  left: number;
  top: number;
  /**
   * top 方向且放在锚点上方时给出: 浮层底边到 host 底边的距离(设计 px)。
   * 此时按底边定位 —— 浮层之后再长高(如详情浮层展开操作区)也只会向上长, 不会压到锚点。
   */
  bottom?: number;
  /** 浮层高度上限(设计 px) = 画布高度减两侧留白(底边定位时 = 锚点上方可用高度)。渲染时就要下发, 否则量出的高度会超界。 */
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
  const [placed, setPlaced] = useState<{ left: number; top: number; bottom?: number } | null>(null);
  const maxHeight = Math.max(
    0,
    placed?.bottom === undefined
      ? boxHeight - TOOLTIP_MARGIN * 2
      : boxHeight - placed.bottom - TOOLTIP_MARGIN,
  );

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
    const vertical = point.direction === "vertical" || point.direction === "top";
    const topward = point.direction === "top";
    const leftward = point.direction === "left";

    const right = point.x + TOOLTIP_GAP;
    const left = vertical
      ? Math.min(
          Math.max(TOOLTIP_MARGIN, point.x - width / 2),
          Math.max(TOOLTIP_MARGIN, boxW - width - TOOLTIP_MARGIN),
        )
      : leftward
        ? point.x - width - TOOLTIP_GAP >= TOOLTIP_MARGIN
          ? point.x - width - TOOLTIP_GAP
          : Math.min(
              Math.max(TOOLTIP_MARGIN, right),
              Math.max(TOOLTIP_MARGIN, boxW - width - TOOLTIP_MARGIN),
            )
      : right + width <= boxW - TOOLTIP_MARGIN
        ? right
        : Math.max(TOOLTIP_MARGIN, point.x - width - TOOLTIP_GAP);
    const below = point.y + TOOLTIP_GAP;
    const above = point.y - height - TOOLTIP_GAP;
    const wanted = vertical
      ? topward
        ? above >= TOOLTIP_MARGIN
          ? above
          : below
        : below + height <= boxH - TOOLTIP_MARGIN
          ? below
          : above
      : topOffset === undefined
        ? point.y - height / 2
        : point.y - topOffset;
    const top = Math.min(
      Math.max(TOOLTIP_MARGIN, wanted),
      Math.max(TOOLTIP_MARGIN, boxH - height - TOOLTIP_MARGIN),
    );
    // 放得下上方时 top 与 bottom 两种写法等价; 改用 bottom 是为了之后长高时底边钉住不动。
    const bottom = topward && above >= TOOLTIP_MARGIN ? boxH - point.y + TOOLTIP_GAP : undefined;
    setPlaced({ left, top, bottom });
  }, [point, ref, topOffset]);

  return {
    left: placed?.left ?? 0,
    top: placed?.top ?? 0,
    bottom: placed?.bottom,
    maxHeight,
    ready: placed !== null,
  };
}

/** 放置结果 → 浮层根节点的 inline style。ItemTooltip / HoverTooltip / RailTooltip 共用。 */
export function tooltipStyle(placement: TooltipPlacement): CSSProperties {
  const vertical: CSSProperties = placement.bottom === undefined
    ? { top: `${placement.top}px` }
    : { top: "auto", bottom: `${placement.bottom}px` };
  return {
    left: `${placement.left}px`,
    ...vertical,
    visibility: placement.ready ? undefined : "hidden",
    "--tooltip-max-h": `${placement.maxHeight}px`,
  } as CSSProperties;
}

/**
 * 详情浮层的「交互态」: 物品格点击进入交互模式后, 同一张浮层底部长出操作区(见 ItemTooltipActions)。
 * actions 为空 = 仍是普通悬浮详情(不接收指针)。
 */
export interface ItemTooltipInteraction {
  actions: readonly SlotAction[] | null;
  /** 物品格的包裹层 —— 点它不算「点外部」。 */
  anchor: HTMLElement;
  onDismiss: () => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
}

export default function ItemTooltip({
  stack,
  point,
  themeStyle = {},
  className,
  interaction,
}: {
  stack: ItemStack;
  point: TooltipPoint;
  themeStyle?: CSSProperties;
  className?: string;
  interaction?: ItemTooltipInteraction;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const placement = useTooltipPlacement(point, ref);
  const actions = interaction?.actions?.length ? interaction.actions : null;
  const def = getItemDef(stack.itemId);

  return createPortal(
    <div
      className={cx(s["item-tooltip"], actions && s["is-interactive"], className)}
      ref={ref}
      style={{ ...themeStyle, ...tooltipStyle(placement) }}
      role={actions ? "dialog" : "tooltip"}
      aria-label={actions ? `${def.name}的操作` : undefined}
      {...(actions ? { "data-item-action-tooltip": "" } : null)}
      onPointerEnter={actions ? interaction?.onPointerEnter : undefined}
      onPointerLeave={actions ? interaction?.onPointerLeave : undefined}
    >
      {/* 与 BUFF 详情同款的 TooltipCard; 交互态的操作栏作为卡片底栏长出来。 */}
      <ItemTooltipCard
        stack={stack}
        footer={actions && interaction && (
          <ItemTooltipActions
            actions={actions}
            anchor={interaction.anchor}
            rootRef={ref}
            onDismiss={interaction.onDismiss}
          />
        )}
      />
    </div>,
    point.host,
  );
}
