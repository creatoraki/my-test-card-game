import type { CSSProperties } from "react";
import type { Kit } from "../../kit/PropSvg";
import { PropSvg } from "../../kit/PropSvg";
import { Bolt, Cable, Drip, GaugeFace, Glass, GroundShadow, Moss, Panel, Placard, Shape, Sleeve, Trim, Vent } from "../../kit/parts";
import { LightBar, LightDot } from "../../kit/emissive";
import { BRASS, GLOW, INK, STEEL } from "../../kit/palette";
import { CabinetInterior, CUT_WIRE_TIP, INTERIOR } from "./CabinetInterior";
import k from "../../kit/kit.module.css";

export const POWER_CABINET_SIZE = { width: 230, height: 250 } as const;

const GAUGE = { cx: 54, cy: 106, r: 10 } as const;
const LAMPS = [
  { x: 78, dim: "#1d3a2c", lit: GLOW.green, delay: "0s" },
  { x: 90, dim: "#4a3a1c", lit: GLOW.amber, delay: "-0.5s" },
  { x: 102, dim: "#4a1e1c", lit: GLOW.red, delay: "-1.1s" },
] as const;

/** 闭合的左门：格栅 + 仪表 + 指示灯 + 高压警示牌 + 把手挂锁 + 涂鸦。 */
function LeftDoor({ kit }: { kit: Kit }) {
  return <g>
    <Panel kit={kit} x={30} y={50} w={84} h={168} r={2} fill="steelV" seam={3} grime={0.65} />
    {[64, 192].map((y) => <rect key={y} x={26.5} y={y} width={5} height={14} rx={1} fill={kit.url("cylinder")} stroke={INK} strokeWidth={0.8} />)}
    <Vent x={40} y={60} w={64} h={24} count={6} />
    <Drip x={52} y={84} length={16} />
    <Drip x={88} y={84} length={24} width={3} />

    <GaugeFace kit={kit} {...GAUGE} />
    {LAMPS.map(({ x, dim }) => <g key={x}>
      <circle cx={x} cy={106} r={4.5} fill={STEEL.s0} stroke={INK} strokeWidth={0.9} />
      <circle cx={x} cy={106} r={3} fill={dim} />
      <circle cx={x - 1} cy={105} r={0.9} fill="#fff" opacity={0.4} />
    </g>)}
    <Placard x={40} y={122} w={64} h={8} tone="#9aa7ad" ink="#1e272c" lines={1} />

    {/* 高压警示牌 */}
    <path d="M68 136 L90 174 L46 174 Z" fill="#caa03c" stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
    <path d="M68 136 L90 174 L46 174 Z" fill={kit.url("grime")} opacity={0.6} />
    <path d="M68 141 L86 171 L50 171 Z" fill="none" stroke={INK} strokeWidth={0.8} />
    <path d="M70 148 L62 161 L67 161 L64 169 L74 157 L69 157 L72 148 Z" fill={INK} />
    {[[68, 140], [52, 171], [84, 171]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={0.9} fill={BRASS.b3} />)}

    <Placard x={40} y={182} w={44} h={12} lines={3} />
    {/* 把手 + 挂锁 */}
    <rect x={104} y={128} width={5} height={36} rx={2.5} fill={kit.url("brassCyl")} stroke={INK} strokeWidth={0.9} />
    <path d="M102 170 A4.5 4.5 0 0 1 111 170" fill="none" stroke={STEEL.s5} strokeWidth={2} />
    <rect x={100} y={170} width={13} height={11} rx={1.5} fill={kit.url("brassV")} stroke={INK} strokeWidth={0.9} />
    <circle cx={106.5} cy={175} r={1.2} fill={INK} />
    {/* 涂鸦 + 撕剩的贴纸 */}
    <path d="M38 204 C46 192 54 212 62 198 C68 190 76 208 84 196 C88 190 94 204 100 198" fill="none" stroke={GLOW.magenta} strokeWidth={2.6} strokeLinecap="round" opacity={0.6} />
    <path d="M86 186 L100 184 L101 194 L92 196 Z" fill="#dcd4bc" stroke={INK} strokeWidth={0.6} opacity={0.8} />
  </g>;
}

function CabinetBase({ kit }: { kit: Kit }) {
  return <g>
    <GroundShadow cx={115} cy={246} rx={110} />

    {/* 顶上锯断的导管残桩：断口冒出几根线头 */}
    <path d="M66 14 C64 8 60 6 58 2 M70 13 C71 6 70 3 72 0 M74 14 C78 9 80 8 84 6" fill="none" stroke="#b8362f" strokeWidth={1.2} strokeLinecap="round" />
    <path d="M70 13 C71 6 70 3 72 0" fill="none" stroke="#c99a2e" strokeWidth={1.2} strokeLinecap="round" />
    <Cable d="M70 30 L70 14" width={8} />
    <ellipse cx={70} cy={14} rx={4.6} ry={1.6} fill={STEEL.s0} stroke={INK} strokeWidth={0.8} />
    <Sleeve kit={kit} x={64} y={20} w={12} h={5} brass />
    {/* 右侧拱起落地的外接电缆 */}
    <Cable d="M166 30 C168 14 206 12 220 32 C228 44 228 120 227 244" width={4.5} />
    <Cable d="M184 30 C188 22 204 22 212 34" width={2.6} color="#3a2a22" highlight="#8a6a5a" />
    <Sleeve kit={kit} x={222} y={150} w={10} h={5} />
    {/* 左侧落地导管 + 管卡 */}
    <Cable d="M24 74 L14 74 L14 240" width={5} />
    {[110, 170].map((y) => <rect key={y} x={9} y={y} width={16} height={5} rx={1} fill={kit.url("cylinder")} stroke={INK} strokeWidth={0.8} />)}

    {/* 基座 */}
    <Panel kit={kit} x={14} y={228} w={202} h={18} r={2} fill="steelDarkV" />
    <rect x={18} y={225} width={194} height={4} fill={kit.url("hazard")} stroke={INK} strokeWidth={0.8} />
    {[22, 208].map((x) => <Bolt key={x} x={x} y={238} r={1.6} />)}
    <Drip x={40} y={229} length={10} color="#5a3a1f" />

    {/* 柜体 */}
    <Panel kit={kit} x={22} y={40} w={186} h={188} r={3} fill="steelV" />
    {[[27, 45], [203, 45], [27, 223], [203, 223]].map(([x, y]) => <Bolt key={`${x}-${y}`} x={x} y={y} r={1.5} />)}
    <LeftDoor kit={kit} />
    <CabinetInterior kit={kit} />

    {/* 半开右门：侧向可见的门扇 */}
    <Shape kit={kit} d="M200 48 L224 57 L224 211 L200 220 Z" fill="steelDarkV" grime={0.6} />
    <path d="M204 60 L220 66 L220 202 L204 208 Z" fill="none" stroke={INK} strokeWidth={0.8} opacity={0.7} />
    <path d="M206 84 L218 88 L218 122 L206 120 Z" fill="#c9c3ae" stroke={INK} strokeWidth={0.6} opacity={0.75} />
    {[92, 98, 104, 110].map((y) => <line key={y} x1={208} y1={y} x2={216} y2={y + 1.5} stroke="#4a4436" strokeWidth={0.8} opacity={0.7} />)}
    <rect x={214} y={134} width={4} height={30} rx={2} fill={kit.url("brassCyl")} stroke={INK} strokeWidth={0.8} />

    {/* 顶盖 + 阶梯徽冠 */}
    <Shape kit={kit} d="M14 42 L216 42 L208 28 L22 28 Z" fill="steelDarkV" />
    <line x1={24} y1={29.5} x2={206} y2={29.5} stroke={STEEL.edge} strokeWidth={0.8} opacity={0.45} />
    <Trim kit={kit} x={18} y={40} w={194} h={3} />
    <Shape kit={kit} d="M88 28 L88 21 L98 21 L98 14 L132 14 L132 21 L142 21 L142 28 Z" fill="steelV" />
    <Glass kit={kit} x={103} y={16} w={24} h={9} r={1} lit streaks={false} />
    <path d="M116 17.5 L111 22 L114.5 22 L113 24.5 L119 20 L115.5 20 L117 17.5 Z" fill="#5a4520" />
    <Moss x={46} y={28} scale={1.1} hang={10} />
    <Moss x={176} y={28} scale={0.85} hang={6} />
    <Moss x={24} y={228} scale={0.8} />
  </g>;
}

function CabinetGlow({ kit }: { kit: Kit }) {
  const { cx, cy, r } = GAUGE;
  return <g>
    {/* 仪表指针 */}
    <g className={k.needle} style={{ "--pivot": `${cx}px ${cy}px` } as CSSProperties}>
      <line x1={cx} y1={cy} x2={cx + r * 0.55} y2={cy - r * 0.6} stroke={GLOW.amber} strokeWidth={1.1} strokeLinecap="round" filter={kit.url("bloom")} />
    </g>
    <circle cx={cx} cy={cy} r={1.4} fill={BRASS.b3} stroke={INK} strokeWidth={0.5} />
    {LAMPS.map(({ x, lit, delay }) => <LightDot key={x} kit={kit} cx={x} cy={106} r={2.8} color={lit} className={k.blink} style={{ "--delay": delay } as CSSProperties} />)}
    {/* 坏掉的柜内灯管 */}
    <LightBar kit={kit} x={INTERIOR.x + 6} y={INTERIOR.y + 4.5} w={INTERIOR.w - 12} h={3} color="#cdeff0" halo={0.5} className={k.flicker} />
    <path d="M116 17.5 L111 22 L114.5 22 L113 24.5 L119 20 L115.5 20 L117 17.5 Z" fill={GLOW.amber} filter={kit.url("bloom")} className={k.breath} />
    {/* 断线火花 */}
    <g className={k.spark}>
      <circle cx={CUT_WIRE_TIP.x} cy={CUT_WIRE_TIP.y + 2} r={10} fill={GLOW.amber} opacity={0.5} filter={kit.url("bloomWide")} />
      <path d={`M${CUT_WIRE_TIP.x} ${CUT_WIRE_TIP.y - 10} l3 8 l9 -3 l-7 7 l9 5 l-10 -1 l-2 9 l-4 -9 l-10 3 l7 -7 l-7 -7 l9 3 Z`} fill={GLOW.amberCore} filter={kit.url("bloom")} />
    </g>
  </g>;
}

/** 街区配电箱：阶梯徽冠铁柜，左门仪表与警示牌，右门半开露出断路器、铜排与垂落线束，断线处偶发电火花。 */
export function PowerCabinet({ live = true }: { live?: boolean }) {
  return <PropSvg {...POWER_CABINET_SIZE} live={live}
    base={(kit) => <CabinetBase kit={kit} />}
    glow={(kit) => <CabinetGlow kit={kit} />}
  />;
}
