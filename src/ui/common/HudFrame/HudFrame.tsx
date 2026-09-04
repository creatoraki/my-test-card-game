import { useMemo, type CSSProperties, type ReactNode } from "react";
import { buildHudFrame, HUD_FRAME_SPEC, type HudFrameSpec } from "./hudFrameGeometry";
import { buildCornerMosaic } from "./hudFrameMosaic";
import { useBoxSize } from "./useBoxSize";
import s from "./HudFrame.module.css";

// 赛博 HUD 外框(整屏级的那一圈粉色边框)。
//
// ★ 轮廓在 hudFrameGeometry.ts, 按容器的**真实像素**生成 path: 台阶/切角/断口是固定像素,
//   只有直线段随尺寸伸缩 —— viewBox 拉伸会把 45° 拉成别的角度, 所以这里不用它。
// ★ 一条线由三层描边叠出霓虹: 外晕(粗、低透明) → 粉色本体 → 白色线芯, 再加两层 drop-shadow。
// ★ 内容区用同一段闭合路径做 clip-path, 因此毛玻璃的边缘和线严丝合缝。

export type HudFrameProps = {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** 覆盖部分几何参数(切角、台阶、断口比例等)。 */
  spec?: Partial<HudFrameSpec>;
  /** 是否画角落的像素方块点阵。 */
  mosaic?: boolean;
  label?: string;
};

export function HudFrame({
  children,
  className,
  style,
  spec,
  mosaic = true,
  label,
}: HudFrameProps) {
  const { ref, size } = useBoxSize<HTMLDivElement>();
  const { width, height } = size;

  const merged = useMemo<HudFrameSpec>(() => ({ ...HUD_FRAME_SPEC, ...spec }), [spec]);
  const paths = useMemo(() => buildHudFrame(width, height, merged), [width, height, merged]);
  const cells = useMemo(
    () =>
      mosaic && width > 0
        ? [
            ...buildCornerMosaic(width, height, "topLeft"),
            ...buildCornerMosaic(width, height, "bottomRight"),
          ]
        : [],
    [mosaic, width, height],
  );

  return (
    <div
      ref={ref}
      className={className ? `${s.frame} ${className}` : s.frame}
      style={style}
      aria-label={label}
    >
      {paths && (
        <>
          <span className={s.glass} style={{ clipPath: `path("${paths.fill}")` }} aria-hidden />
          <svg
            className={s.canvas}
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            aria-hidden
          >
            {cells.length > 0 && (
              <g className={s.mosaic}>
                {cells.map((cell, i) => (
                  <rect
                    key={i}
                    x={cell.x}
                    y={cell.y}
                    width={cell.size}
                    height={cell.size}
                    opacity={cell.opacity}
                  />
                ))}
              </g>
            )}

            {/* 一条线画三遍: 外晕 → 本体 → 线芯。顺序即层次, 不能换。 */}
            <g className={s.line}>
              {[paths.upper, paths.lower].map((d, i) => (
                <g key={i}>
                  <path className={s.halo} d={d} />
                  <path className={s.body} d={d} />
                  <path className={s.core} d={d} />
                </g>
              ))}
            </g>
          </svg>
        </>
      )}

      <div className={s.content}>{children}</div>
    </div>
  );
}
