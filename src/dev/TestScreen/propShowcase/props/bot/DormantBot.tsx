import type { CSSProperties } from "react";
import type { Kit } from "../../kit/PropSvg";
import { PropSvg } from "../../kit/PropSvg";
import { Bolt, Cable, Drip, GroundShadow, Moss, Panel, Placard, ScreenBase, Shape, Vent } from "../../kit/parts";
import { LightBar, LightDot } from "../../kit/emissive";
import { GLOW, INK, STEEL } from "../../kit/palette";
import { BotHead, BotHeadGlow } from "./BotHead";
import k from "../../kit/kit.module.css";

export const DORMANT_BOT_SIZE = { width: 220, height: 236 } as const;

const CHEST = "M66 104 Q66 94 76 94 L144 94 Q154 94 154 104 L150 158 Q148 168 138 168 L82 168 Q72 168 70 158 Z";
const HEART = "98,121 104,121 107,115 111,127 114,121 122,121";
const SHOULDER_LIGHTS = [{ x: 60, delay: "0s" }, { x: 160, delay: "-1.3s" }];

/** 关节球：暗色金属 + 受光点 + 中心轴。 */
function Joint({ kit, cx, cy, r }: { kit: Kit; cx: number; cy: number; r: number }) {
  return <g>
    <circle cx={cx} cy={cy} r={r} fill={kit.url("cylinder")} stroke={INK} strokeWidth={1} />
    <circle cx={cx} cy={cy} r={r * 0.45} fill={STEEL.s1} stroke={INK} strokeWidth={0.6} />
    <circle cx={cx - r * 0.35} cy={cy - r * 0.4} r={r * 0.2} fill={STEEL.edge} opacity={0.7} />
  </g>;
}

/** 腿：前伸坐姿，正视只见膝盖、小腿与脚。 */
function Leg({ kit, x }: { kit: Kit; x: number }) {
  return <g>
    <Panel kit={kit} x={x + 4} y={170} w={40} h={24} r={9} fill="paintV" grime={0.6} edge={0.4} />
    <Panel kit={kit} x={x + 8} y={196} w={32} h={20} r={3} fill="steelDarkV" grime={0.5} />
    <Vent x={x + 12} y={200} w={24} h={10} count={3} />
    <Shape kit={kit} d={`M${x - 2} 230 L${x + 4} 213 L${x + 44} 213 L${x + 50} 230 Z`} fill="paintV" grime={0.6} />
    <line x1={x + 6} y1={216} x2={x + 42} y2={216} stroke="#fff" strokeWidth={0.8} opacity={0.6} />
    <Panel kit={kit} x={x - 4} y={228} w={56} h={6} r={1.5} fill="steelDarkV" edge={0.2} />
    <rect x={x + 14} y={220} width={20} height={3} rx={1} fill="#d97a32" stroke={INK} strokeWidth={0.6} />
    {/* 膝盖护甲 */}
    <circle cx={x + 24} cy={194} r={12} fill={kit.url("paintV")} stroke={INK} strokeWidth={1.3} />
    <circle cx={x + 24} cy={194} r={12} fill={kit.url("grime")} opacity={0.6} />
    <path d={`M${x + 16} ${188} A10 10 0 0 1 ${x + 28} ${184}`} fill="none" stroke="#fff" strokeWidth={1.2} opacity={0.7} />
    <circle cx={x + 24} cy={194} r={5} fill="none" stroke={INK} strokeWidth={0.8} opacity={0.6} />
  </g>;
}

function BotBase({ kit }: { kit: Kit }) {
  return <g>
    <GroundShadow cx={110} cy={232} rx={104} />
    {/* 漏油 */}
    <ellipse cx={156} cy={233} rx={28} ry={3} fill="#07090b" opacity={0.8} />
    <path d="M138 232.5 Q150 231 160 232" stroke="#6a8a9a" strokeWidth={0.6} opacity={0.5} fill="none" />

    {/* 背包电池与肩后排气筒 */}
    <Panel kit={kit} x={60} y={90} w={100} h={72} r={6} fill="steelDarkV" />
    {[54, 154].map((x) => <g key={x}>
      <Panel kit={kit} x={x} y={80} w={12} h={30} r={3} fill="cylinder" grime={0.5} edge={0.3} />
      <rect x={x + 2} y={78} width={8} height={3} rx={1} fill={STEEL.s0} stroke={INK} strokeWidth={0.6} />
    </g>)}

    {/* 左臂：垂落，手掌撑地 */}
    <g transform="rotate(12 56 112)">
      <Panel kit={kit} x={48} y={112} w={16} h={38} r={6} fill="paintV" grime={0.6} edge={0.4} />
    </g>
    <Joint kit={kit} cx={47} cy={154} r={7} />
    <g transform="rotate(8 44 156)">
      <Panel kit={kit} x={35} y={156} w={18} h={44} r={6} fill="paintV" grime={0.6} edge={0.4} />
      <rect x={38} y={180} width={12} height={3} rx={1} fill="#d97a32" stroke={INK} strokeWidth={0.5} />
    </g>
    <Shape kit={kit} d="M26 232 L28 206 L54 206 L58 232 Z" fill="steelDarkV" grime={0.5} />
    {[34, 40, 46, 52].map((x) => <line key={x} x1={x} y1={222} x2={x + 0.5} y2={232} stroke={INK} strokeWidth={0.9} />)}
    <rect x={28} y={206} width={26} height={4} fill={kit.url("cylinder")} stroke={INK} strokeWidth={0.7} />

    {/* 骨盆 + 髋关节 */}
    <Panel kit={kit} x={78} y={160} w={64} h={22} r={5} fill="steelDarkV" />
    <Joint kit={kit} cx={82} cy={176} r={8} />
    <Joint kit={kit} cx={138} cy={176} r={8} />

    <Leg kit={kit} x={54} />
    <Leg kit={kit} x={118} />
    <Drip x={70} y={216} length={10} />

    {/* 胸甲 */}
    <Shape kit={kit} d={CHEST} fill="paintV" grime={0.6} />
    <path d="M72 100 Q72 98 78 98 L142 98 Q148 98 148 100" fill="none" stroke="#fff" strokeWidth={1} opacity={0.75} />
    <path d="M71.5 108 L71.5 156" stroke="#1f5a56" strokeWidth={1.6} strokeLinecap="round" />
    <path d="M148.5 108 L148.5 156" stroke="#1f5a56" strokeWidth={1.6} strokeLinecap="round" />
    <Vent x={76} y={106} w={12} h={26} count={5} />
    <Vent x={132} y={106} w={12} h={26} count={5} />
    <Panel kit={kit} x={92} y={104} w={36} h={30} r={3} fill="paintV" seam={2} grime={0.5} />
    <ScreenBase kit={kit} x={97} y={110} w={26} h={16} r={1.5} bezel={1.8} />
    <polyline points={HEART} fill="none" stroke="#174a47" strokeWidth={1.4} strokeLinejoin="round" />
    <Placard x={96} y={128} w={28} h={4} tone="#9aa7ad" ink="#1e272c" lines={1} />
    <Panel kit={kit} x={86} y={146} w={48} h={16} r={2} fill="steelDarkV" edge={0.3} />
    <Vent x={90} y={149} w={40} h={10} count={3} />
    {[80, 140].map((x) => <Bolt key={x} x={x} y={140} r={1.4} />)}
    {/* 故障封条 */}
    <g transform="rotate(-16 110 136)">
      <rect x={62} y={132} width={96} height={7} fill={kit.url("hazard")} stroke={INK} strokeWidth={0.8} />
      <rect x={62} y={132} width={96} height={7} fill={kit.url("grime")} opacity={0.5} />
      <path d="M158 132 L164 134 L160 139 L158 139 Z" fill="#caa03c" stroke={INK} strokeWidth={0.6} />
    </g>
    <Drip x={140} y={160} length={14} />

    {/* 肩甲 */}
    <Shape kit={kit} d="M50 102 Q50 88 64 88 L78 88 L78 120 L60 120 Q50 120 50 110 Z" fill="paintV" grime={0.6} />
    <Shape kit={kit} d="M170 102 Q170 88 156 88 L142 88 L142 120 L160 120 Q170 120 170 110 Z" fill="paintV" grime={0.6} />
    {SHOULDER_LIGHTS.map(({ x }) => <rect key={x} x={x - 4} y={108} width={8} height={3} rx={1.5} fill="#1f5a56" stroke={INK} strokeWidth={0.5} />)}
    <path d="M56 92 Q58 90 66 90" fill="none" stroke="#fff" strokeWidth={1} opacity={0.7} />
    <path d="M164 92 Q162 90 154 90" fill="none" stroke="#fff" strokeWidth={1} opacity={0.7} />

    {/* 右臂：搭在右膝 */}
    <g transform="rotate(-14 162 112)">
      <Panel kit={kit} x={154} y={112} w={16} h={36} r={6} fill="paintV" grime={0.6} edge={0.4} />
    </g>
    <Joint kit={kit} cx={170} cy={150} r={7} />
    <g transform="rotate(38 170 150)">
      <Panel kit={kit} x={161} y={150} w={18} h={40} r={6} fill="paintV" grime={0.6} edge={0.4} />
      <rect x={164} y={172} width={12} height={3} rx={1} fill="#d97a32" stroke={INK} strokeWidth={0.5} />
    </g>
    <Shape kit={kit} d="M132 184 L150 180 L154 196 L136 200 Z" fill="steelDarkV" grime={0.5} />
    {[138, 143, 148].map((x) => <line key={x} x1={x} y1={191} x2={x - 1} y2={199} stroke={INK} strokeWidth={0.9} />)}

    {/* 颈部：波纹颈管 + 线束 */}
    <Cable d="M98 96 C96 90 98 86 100 82" width={2.6} color="#b8362f" highlight="#ff8a7a" />
    <Cable d="M122 96 C124 90 122 86 120 82" width={2.6} color="#2f6fc0" highlight="#8ec0ff" />
    <Panel kit={kit} x={100} y={80} w={20} h={16} r={3} fill="cylinder" grime={0.4} edge={0.3} />
    {[84, 88, 92].map((y) => <line key={y} x1={101} y1={y} x2={119} y2={y} stroke={INK} strokeWidth={0.8} opacity={0.7} />)}

    <BotHead kit={kit} />
    <Moss x={62} y={89} scale={0.75} hang={8} />
  </g>;
}

function BotGlow({ kit }: { kit: Kit }) {
  return <g>
    <BotHeadGlow kit={kit} />
    <polyline points={HEART} fill="none" stroke={GLOW.cyan} strokeWidth={1.4} strokeLinejoin="round" filter={kit.url("bloom")}
      className={k.sleepy} style={{ "--delay": "-0.6s" } as CSSProperties} />
    <g className={k.breath} style={{ "--delay": "-2s" } as CSSProperties}>
      <LightBar kit={kit} x={70.7} y={108} w={1.6} h={48} color={GLOW.cyan} halo={0.3} />
      <LightBar kit={kit} x={147.7} y={108} w={1.6} h={48} color={GLOW.cyan} halo={0.3} />
    </g>
    {SHOULDER_LIGHTS.map(({ x, delay }) => <LightBar key={x} kit={kit} x={x - 4} y={108} w={8} h={3} color={GLOW.amber} halo={0.5}
      className={k.blink} style={{ "--delay": delay } as CSSProperties} />)}
    <LightDot kit={kit} cx={57} cy={84} r={1.2} color={GLOW.red} className={k.blink} style={{ "--delay": "-0.7s" } as CSSProperties} />
  </g>;
}

/** 休眠服务机器人：白色喷涂硬壳瘫坐在地，歪头的面罩上一双缓慢亮暗的睡眼，胸前贴着故障封条。 */
export function DormantBot({ live = true }: { live?: boolean }) {
  return <PropSvg {...DORMANT_BOT_SIZE} live={live}
    base={(kit) => <BotBase kit={kit} />}
    glow={(kit) => <BotGlow kit={kit} />}
  />;
}
