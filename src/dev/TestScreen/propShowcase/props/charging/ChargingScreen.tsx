import type { CSSProperties } from "react";
import type { Kit } from "../../kit/PropSvg";
import k from "../../kit/kit.module.css";

/** 屏幕区域：57..103 × 92..150。底图用暗色画一遍"熄屏残影"，动效层用亮色再画一遍。 */
export const CHARGE_SCREEN = { x: 57, y: 92, w: 46, h: 58 } as const;

const CELLS = [0, 1, 2, 3, 4];
const BARS = [6, 9, 7, 12, 10, 14, 11];
const GRAPH = "60,138 65,134 70,136 75,129 80,131 85,125 90,127 95,121 100,123";

/** 充电界面：状态栏 + 电池电量格 + 功率曲线 + 柱状图。lit 时电量格逐格点亮。 */
export function ChargingScreenUI({ kit, color, lit }: { kit: Kit; color: string; lit: boolean }) {
  const filter = lit ? kit.url("bloom") : undefined;
  return <g fill={color} stroke="none">
    {/* 状态栏 */}
    <circle cx={61} cy={96} r={1.3} />
    <circle cx={65} cy={96} r={1.3} opacity={0.6} />
    <rect x={80} y={95} width={20} height={2} rx={1} opacity={0.7} />
    <rect x={59} y={99.5} width={42} height={0.7} opacity={0.4} />
    {/* 电池 */}
    <g filter={filter}>
      <rect x={64} y={104} width={30} height={14} rx={2} fill="none" stroke={color} strokeWidth={1.2} />
      <rect x={94.5} y={108} width={2.5} height={6} rx={0.8} />
      {CELLS.map((index) => <rect
        key={index}
        x={66 + index * 5.5} y={106} width={4.3} height={10} rx={0.6}
        className={lit ? k.charge : undefined}
        style={lit ? { "--delay": `${index * 0.4}s` } as CSSProperties : undefined}
      />)}
    </g>
    {/* 闪电角标 */}
    <path d="M100 103 L96.5 109 L99 109 L97.5 114 L102 107.5 L99.5 107.5 L101 103 Z" filter={filter} />
    {/* 功率曲线 */}
    <polyline points={GRAPH} fill="none" stroke={color} strokeWidth={1} strokeLinejoin="round" opacity={0.9} />
    <rect x={59} y={140.5} width={42} height={0.6} opacity={0.4} />
    {/* 柱状图 */}
    {BARS.map((height, index) => <rect key={index} x={62 + index * 5.5} y={148 - height * 0.5} width={3.4} height={height * 0.5} opacity={0.75} />)}
  </g>;
}
