// 三选一底栏按钮: 轮廓与装饰取自 pickButtonShapes(放弃 / 确认两种造型)。
// 底色层走 clip-path, 描边与辉光走按钮内的 SVG —— clip-path 会把 border / box-shadow 一起裁掉,
// 所以描边不能挂在被裁的那层上。
import { useId, type ReactNode } from "react";
import { cx } from "@/ui/common/shared/cx";
import { CONFIRM_SHAPE, SKIP_SHAPE } from "./pickButtonShapes";
import { toClipPolygon, toSvgPoints, type Rect } from "./pickGeometry";
import s from "./PickButton.module.css";

interface Props {
  rect: Rect;
  kind: "skip" | "confirm";
  disabled?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  onClick: () => void;
}

export function PickButton({ rect, kind, disabled, icon, children, onClick }: Props) {
  const { w, h } = rect;
  const shape = kind === "confirm" ? CONFIRM_SHAPE : SKIP_SHAPE;
  const outline = toSvgPoints(shape.outline);
  const blur = useId();

  return (
    <button
      type="button"
      className={cx(s.button, kind === "confirm" ? s.confirm : s.skip)}
      style={{ left: rect.x, top: rect.y, width: w, height: h }}
      disabled={disabled}
      onClick={onClick}
    >
      <span className={s.face} style={{ clipPath: toClipPolygon(shape.outline) }} />
      <svg className={s.edge} viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true">
        <defs>
          <filter id={blur} x="-30%" y="-60%" width="160%" height="220%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>
        {/* 外发光: SVG 内部模糊, 平铺加宽描边会出现硬边色带 */}
        <g filter={`url(#${blur})`}>
          <polygon className={s.haloWide} points={outline} />
          <polygon className={s.halo} points={outline} />
        </g>
        {shape.bay && <polygon className={s.bay} points={toSvgPoints(shape.bay)} />}
        {shape.plates.map((plate, index) => (
          <polygon key={index} className={s.plate} data-index={index} points={toSvgPoints(plate)} />
        ))}
        {shape.stripes.map((stripe, index) => (
          <polyline key={index} className={s.stripe} points={toSvgPoints(stripe)} />
        ))}
        <polygon className={s.line} points={outline} />
        <polygon className={s.innerLine} points={toSvgPoints(shape.inner)} />
        {shape.ridges.map((ridge, index) => (
          <g key={index}>
            <polyline className={s.ridgeGlow} points={toSvgPoints(ridge)} filter={`url(#${blur})`} />
            <polyline className={s.ridge} points={toSvgPoints(ridge)} />
          </g>
        ))}
      </svg>
      <span className={s.content}>
        {icon}
        <span className={s.label}>{children}</span>
      </span>
    </button>
  );
}
