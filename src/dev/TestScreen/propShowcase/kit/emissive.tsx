import type { CSSProperties } from "react";
import type { Kit } from "./PropSvg";

/**
 * 发光件：底图里画"熄灭"的灯罩，动效层里叠这里的"点亮"版本——
 * 外圈大半径模糊光晕 + 本色灯芯 + 近白高光芯。熄灭时仍能看到灯具本身。
 */

interface EmitterProps {
  kit: Kit;
  color: string;
  core?: string;
  className?: string;
  style?: CSSProperties;
  halo?: number;
}

export function LightBar({ kit, x, y, w, h, color, core = "#ffffff", className, style, halo = 0.65 }: EmitterProps & { x: number; y: number; w: number; h: number }) {
  const r = Math.min(w, h) / 2;
  return <g className={className} style={style}>
    <rect x={x - 3} y={y - 3} width={w + 6} height={h + 6} rx={r + 3} fill={color} opacity={halo} filter={kit.url("bloomWide")} />
    <rect x={x} y={y} width={w} height={h} rx={r} fill={color} />
    <rect
      x={w > h ? x + 1 : x + w * 0.3}
      y={w > h ? y + h * 0.3 : y + 1}
      width={w > h ? w - 2 : w * 0.4}
      height={w > h ? h * 0.4 : h - 2}
      rx={r * 0.4}
      fill={core}
      opacity={0.85}
    />
  </g>;
}

export function LightDot({ kit, cx, cy, r, color, core = "#ffffff", className, style, halo = 0.7 }: EmitterProps & { cx: number; cy: number; r: number }) {
  return <g className={className} style={style}>
    <circle cx={cx} cy={cy} r={r * 2.4} fill={color} opacity={halo} filter={kit.url("bloomWide")} />
    <circle cx={cx} cy={cy} r={r} fill={color} />
    <circle cx={cx - r * 0.25} cy={cy - r * 0.25} r={r * 0.45} fill={core} opacity={0.9} />
  </g>;
}

/** 向下的筒灯光锥(近景候车亭同款暖光)。 */
export function LightCone({ kit, x, y, topWidth, bottomWidth, height, color, className, style }: {
  kit: Kit; x: number; y: number; topWidth: number; bottomWidth: number; height: number; color: string; className?: string; style?: CSSProperties;
}) {
  const id = kit.id(`cone-${Math.round(x)}-${Math.round(y)}`);
  return <g className={className} style={style}>
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset={0} stopColor={color} stopOpacity={0.42} />
        <stop offset={1} stopColor={color} stopOpacity={0} />
      </linearGradient>
    </defs>
    <path d={`M${x - topWidth / 2} ${y} L${x + topWidth / 2} ${y} L${x + bottomWidth / 2} ${y + height} L${x - bottomWidth / 2} ${y + height} Z`} fill={`url(#${id})`} />
  </g>;
}
