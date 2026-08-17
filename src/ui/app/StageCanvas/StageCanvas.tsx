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
      <div className={cx(s.canvas, className)} {...canvasProps} style={style}>
        {children}
      </div>
    </div>
  );
}