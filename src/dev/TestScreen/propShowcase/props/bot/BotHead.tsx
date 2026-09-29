import type { CSSProperties } from "react";
import type { Kit } from "../../kit/PropSvg";
import { Bolt, Moss, Panel, ScreenBase, Shape, Vent } from "../../kit/parts";
import { LightBar, LightDot } from "../../kit/emissive";
import { BRASS, GLOW, INK, STEEL } from "../../kit/palette";
import k from "../../kit/kit.module.css";

/** 头部整体绕颈部向左歪。 */
export const HEAD_TILT = "rotate(-12 110 90)";
const HELMET = "M64 46 Q64 18 90 16 L130 16 Q156 18 156 46 L156 70 Q156 86 140 86 L80 86 Q64 86 64 70 Z";
const VISOR = { x: 73, y: 30, w: 74, h: 44 } as const;
const EYES = ["M86 54 Q95 61 104 54", "M116 54 Q125 61 134 54"];

/** 头盔：白色喷涂外壳 + 显示屏面罩 + 耳侧模块 + 天线；眼睛残影画在底图，亮起交给动效层。 */
export function BotHead({ kit }: { kit: Kit }) {
  return <g transform={HEAD_TILT}>
    {/* 耳侧模块 */}
    {[52, 156].map((x) => <g key={x}>
      <Panel kit={kit} x={x} y={36} w={12} h={32} r={4} fill="steelDarkV" edge={0.3} />
      <rect x={x + 2} y={44} width={8} height={16} rx={2} fill={kit.url("brassCyl")} stroke={INK} strokeWidth={0.7} />
      {[48, 52, 56].map((y) => <line key={y} x1={x + 2.5} y1={y} x2={x + 9.5} y2={y} stroke={BRASS.b0} strokeWidth={0.7} />)}
    </g>)}
    {/* 天线 */}
    <line x1={164} y1={38} x2={170} y2={11} stroke={INK} strokeWidth={3} strokeLinecap="round" />
    <line x1={164} y1={38} x2={170} y2={11} stroke={STEEL.s5} strokeWidth={1.3} strokeLinecap="round" />
    <rect x={161} y={30} width={7} height={5} rx={1} fill={kit.url("cylinder")} stroke={INK} strokeWidth={0.7} />
    <circle cx={170} cy={11} r={3.4} fill="#4a1e34" stroke={INK} strokeWidth={0.9} />

    {/* 头盔外壳 */}
    <Shape kit={kit} d={HELMET} fill="paintV" grime={0.6} />
    <path d="M70 34 Q72 22 90 20 L130 20 Q148 22 150 34" fill="none" stroke="#fff" strokeWidth={1} opacity={0.7} />
    <path d="M64 70 Q64 86 80 86 L140 86 Q156 86 156 70" fill="none" stroke="#000" strokeWidth={1.4} opacity={0.25} />
    <Vent x={96} y={18.5} w={28} h={6} count={2} />
    <rect x={80} y={25} width={60} height={2.4} rx={1.2} fill="#1f5a56" />
    {[70, 150].map((x) => <Bolt key={x} x={x} y={78} r={1.3} />)}

    {/* 面罩屏幕 */}
    <ScreenBase kit={kit} {...VISOR} r={9} bezel={3} />
    <g fill="none" stroke="#174a47" strokeWidth={3} strokeLinecap="round">
      {EYES.map((d) => <path key={d} d={d} />)}
    </g>
    <path d={`M${VISOR.x + 4} ${VISOR.y + 4} L${VISOR.x + 28} ${VISOR.y + 4} L${VISOR.x + 6} ${VISOR.y + 30} Z`} fill="#fff" opacity={0.07} />
    <path d={`M${VISOR.x + 56} ${VISOR.y + 2} L${VISOR.x + 62} ${VISOR.y + 2} L${VISOR.x + 46} ${VISOR.y + 42} L${VISOR.x + 40} ${VISOR.y + 42} Z`} fill="#fff" opacity={0.05} />
    <polyline points="140,32 133,44 137,50 128,62 131,70" fill="none" stroke="#d6f6f4" strokeWidth={0.8} opacity={0.65} />
    <polyline points="133,44 124,46" fill="none" stroke="#d6f6f4" strokeWidth={0.6} opacity={0.5} />
    {/* 下颌格栅 */}
    <Vent x={96} y={77} w={28} h={6} count={2} />

    <Moss x={86} y={17} scale={0.9} />
  </g>;
}

/** 头部发光：睡眼缓慢亮暗、额头灯槽、天线顶灯。 */
export function BotHeadGlow({ kit }: { kit: Kit }) {
  return <g transform={HEAD_TILT}>
    <g className={k.sleepy}>
      <rect x={VISOR.x} y={VISOR.y} width={VISOR.w} height={VISOR.h} rx={9} fill={GLOW.cyan} opacity={0.08} />
      <ellipse cx={110} cy={56} rx={30} ry={10} fill={GLOW.cyan} opacity={0.22} filter={kit.url("bloomWide")} />
      <g fill="none" stroke={GLOW.cyan} strokeWidth={3} strokeLinecap="round" filter={kit.url("bloom")}>
        {EYES.map((d) => <path key={d} d={d} />)}
      </g>
    </g>
    <LightBar kit={kit} x={80} y={25} w={60} h={2.4} color={GLOW.cyan} halo={0.4} className={k.breath} style={{ "--delay": "-1.4s" } as CSSProperties} />
    <LightDot kit={kit} cx={170} cy={11} r={2.6} color={GLOW.magenta} className={k.blink} />
  </g>;
}
