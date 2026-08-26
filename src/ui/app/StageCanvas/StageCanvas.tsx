import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { useRef } from "react";
import { cx } from "@/ui/common/cx";
import { useStageScale } from "@/ui/hooks/stage";
import s from "../styles/stageCanvas.module.css";

export interface StageCanvasProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "className" | "style" | "children"> {
  viewportClassName?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function StageCanvas({
  viewportClassName,
  className,
  style,
  children,
  ...canvasProps
}: StageCanvasProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const { scale: stageScale, padX, padY } = useStageScale(viewportRef);

  return (
    <div
      className={cx(s.viewport, viewportClassName)}
      ref={viewportRef}
      style={{
        "--stage-scale": stageScale,
        "--stage-pad-x": `${padX}px`,
        "--stage-pad-y": `${padY}px`,
      } as CSSProperties}
    >
      {/* data-stage-canvas: 画布的身份标记。画布内元素要给浮层(ItemTooltip 一族)定位时,
          用 closest("[data-stage-canvas]") 找到这张画布, 再按它归一化出设计 px 坐标 ——
          全程不碰 zoom 换算。属性不参与 Modules 哈希, 是跨模块能命中的唯一通道。 */}
      <div className={cx(s.canvas, className)} data-stage-canvas="" {...canvasProps} style={style}>
        {children}
      </div>
    </div>
  );
}