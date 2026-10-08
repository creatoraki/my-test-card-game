// 选中连接线: 从选中卡底部中点下折, 再左行汇入底栏提示区。改选时以 key 重挂, 重新播放描线动画。
// 线色沿横向渐隐: 卡底一端最亮, 左端收成暗紫(设计稿里横线越往左越淡)。
import { useId } from "react";
import { PANEL_H, PANEL_W, connectorPoints, toSvgPoints } from "./pickGeometry";
import s from "./PickConnector.module.css";

export function PickConnector({ index }: { index: number | null }) {
  const id = useId();
  if (index === null) return null;
  const points = connectorPoints(index);
  const d = toSvgPoints(points);
  const [startX] = points[0];
  const [endX, endY] = points[points.length - 1];
  const tone = `url(#${id})`;

  return (
    <svg
      key={index}
      className={s.connector}
      viewBox={`0 0 ${PANEL_W} ${PANEL_H}`}
      width={PANEL_W}
      height={PANEL_H}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={endX} y1="0" x2={startX} y2="0">
          <stop className={s.stopFar} offset="0" />
          <stop className={s.stopNear} offset="0.7" />
        </linearGradient>
      </defs>
      <polyline className={s.glow} points={d} pathLength={1} />
      <polyline className={s.core} points={d} pathLength={1} stroke={tone} />
      <rect className={s.dot} x={endX - 4} y={endY - 4} width={8} height={8} transform={`rotate(45 ${endX} ${endY})`} />
    </svg>
  );
}
