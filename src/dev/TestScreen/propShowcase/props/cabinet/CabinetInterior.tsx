import type { Kit } from "../../kit/PropSvg";
import { Bolt, Cable, Panel } from "../../kit/parts";
import { BRASS, INK, STEEL } from "../../kit/palette";

/** 柜门洞区域 118..200 × 50..218。 */
export const INTERIOR = { x: 118, y: 50, w: 82, h: 168 } as const;
/** 断线头位置(火花在动效层)。 */
export const CUT_WIRE_TIP = { x: 162, y: 200 } as const;

const BREAKER_ROWS = [60, 88, 116];
const BREAKER_COLS = [125, 136, 147, 158, 169, 180];
/** 跳闸的那一个断路器。 */
const TRIPPED = { row: 88, col: 158 };

/** 垂出的线束：[路径, 外皮色, 高光色, 粗细]。 */
const WIRES: readonly (readonly [string, string, string, number])[] = [
  ["M130 172 C132 196 126 214 134 236", "#b8362f", "#ff8a7a", 3],
  ["M140 172 C144 198 152 212 146 236", "#c99a2e", "#ffe08a", 3],
  ["M152 172 C156 186 172 200 176 222 C178 230 186 236 196 238", "#2f6fc0", "#8ec0ff", 3],
  ["M164 172 C166 184 160 192 162 200", "#1e272c", "#6a7c86", 3.2],
  ["M176 172 C184 190 190 206 208 214", "#3c8a3a", "#b8e36a", 2.6],
];

function Breaker({ kit, x, y, tripped }: { kit: Kit; x: number; y: number; tripped: boolean }) {
  return <g>
    <rect x={x} y={y} width={9.5} height={20} rx={1} fill={kit.url("paintV")} stroke={INK} strokeWidth={0.8} />
    <rect x={x} y={y} width={9.5} height={20} rx={1} fill={kit.url("grime")} opacity={0.7} />
    <rect x={x + 2.5} y={y + 5} width={4.5} height={9} rx={0.8} fill="#1b2226" />
    <rect x={x + 3} y={tripped ? y + 9.5 : y + 5.5} width={3.5} height={4} rx={0.6} fill={tripped ? "#d8453a" : "#e9ecec"} />
    <rect x={x + 1.5} y={y + 16} width={6.5} height={2} fill="#6e7a80" />
  </g>;
}

/** 半开柜门里的配电线路：内胆背板 + 三排断路器(一只跳闸) + 铜排 + 端子排 + 垂落线束。 */
export function CabinetInterior({ kit }: { kit: Kit }) {
  const { x, y, w, h } = INTERIOR;
  return <g>
    <rect x={x} y={y} width={w} height={h} rx={1.5} fill="#040708" stroke={INK} strokeWidth={1.3} />
    <Panel kit={kit} x={x + 3} y={y + 3} w={w - 6} h={h - 6} r={1} fill="steelDarkV" grime={0.75} edge={0} stroke={0.8} />
    {/* 顶部灯管座 */}
    <rect x={x + 6} y={y + 4.5} width={w - 12} height={3} rx={1.5} fill="#27393b" stroke={INK} strokeWidth={0.6} />

    {BREAKER_ROWS.map((rowY) => <g key={rowY}>
      <rect x={122} y={rowY + 8} width={74} height={4} fill={kit.url("cylinder")} stroke={INK} strokeWidth={0.6} />
      {BREAKER_COLS.map((colX) => <Breaker key={colX} kit={kit} x={colX} y={rowY} tripped={rowY === TRIPPED.row && colX === TRIPPED.col} />)}
      <rect x={124} y={rowY + 22} width={68} height={2.2} fill="#c9c3ae" opacity={0.55} />
    </g>)}

    {/* 铜排 */}
    {[144, 150, 156].map((barY, index) => <g key={barY}>
      <rect x={124} y={barY} width={70} height={3.5} rx={0.5} fill={kit.url("brassV")} stroke={INK} strokeWidth={0.6} />
      <rect x={124 + index * 22} y={barY - 1} width={4} height={5.5} fill={BRASS.b1} stroke={INK} strokeWidth={0.5} />
    </g>)}
    {[128, 190].map((boltX) => <Bolt key={boltX} x={boltX} y={152} r={1.4} />)}

    {/* 端子排 */}
    <rect x={124} y={164} width={70} height={9} fill={STEEL.s1} stroke={INK} strokeWidth={0.7} />
    {Array.from({ length: 10 }, (_, index) => <g key={index}>
      <rect x={126 + index * 6.8} y={165.5} width={5} height={6} fill="#6e7a80" stroke={INK} strokeWidth={0.4} />
      <circle cx={128.5 + index * 6.8} cy={168.5} r={1.2} fill={STEEL.s0} />
    </g>)}

    {/* 门框在内胆上投下的阴影 */}
    <rect x={x + 3} y={y + 3} width={w - 6} height={10} fill="#000" opacity={0.35} />
    <rect x={x + 3} y={y + 3} width={6} height={h - 6} fill="#000" opacity={0.3} />
    {/* 散乱的扎线 */}
    <path d="M124 186 Q150 178 196 190" fill="none" stroke="#2a3136" strokeWidth={1.2} />
    <path d="M124 196 Q140 188 170 200" fill="none" stroke="#7a3a2a" strokeWidth={1} opacity={0.8} />

    {WIRES.map(([d, color, hi, width]) => <Cable key={d} d={d} width={width} color={color} highlight={hi} />)}
    {/* 断线裸铜 */}
    <path d={`M${CUT_WIRE_TIP.x} ${CUT_WIRE_TIP.y - 1} L${CUT_WIRE_TIP.x + 1.5} ${CUT_WIRE_TIP.y + 3} M${CUT_WIRE_TIP.x - 1} ${CUT_WIRE_TIP.y} L${CUT_WIRE_TIP.x - 2} ${CUT_WIRE_TIP.y + 3.5}`} stroke={BRASS.b3} strokeWidth={0.9} strokeLinecap="round" />
  </g>;
}
