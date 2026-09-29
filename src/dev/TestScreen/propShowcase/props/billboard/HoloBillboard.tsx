import type { CSSProperties } from "react";
import type { Kit } from "../../kit/PropSvg";
import { PropSvg } from "../../kit/PropSvg";
import { Bolt, Cable, Drip, Glass, GroundShadow, Panel, Placard, Shape, Trim, TrimV, Vent } from "../../kit/parts";
import { LightBar, LightCone, LightDot } from "../../kit/emissive";
import { BRASS, GLASS, GLOW, INK, STEEL } from "../../kit/palette";
import { BillboardPoster } from "./BillboardPoster";
import { HoloCat } from "./HoloCat";
import k from "../../kit/kit.module.css";

export const HOLO_BILLBOARD_SIZE = { width: 330, height: 300 } as const;

const DOWNLIGHTS = [100, 165, 230];
const PILLARS = [30, 280];

function Pillar({ kit, x }: { kit: Kit; x: number }) {
  return <g>
    <Panel kit={kit} x={x} y={49} w={20} h={233} r={2} fill="cylinder" grime={0.45} edge={0.3} />
    <Glass kit={kit} x={x + 6} y={70} w={8} h={180} r={1.5} lit />
    <rect x={x + 9} y={74} width={2} height={172} rx={1} fill="#1d5e60" />
    <Panel kit={kit} x={x - 4} y={49} w={28} h={9} r={1} fill="brassV" grime={0.3} />
    <Panel kit={kit} x={x - 2} y={58} w={24} h={5} r={1} fill="steelDarkV" edge={0.3} />
    <Trim kit={kit} x={x - 5} y={277} w={30} h={2.5} />
    <Panel kit={kit} x={x - 6} y={280} w={32} h={16} r={1.5} fill="steelDarkV" />
    <Bolt x={x - 2} y={288} r={1.4} />
    <Bolt x={x + 22} y={288} r={1.4} />
  </g>;
}

function BillboardBase({ kit }: { kit: Kit }) {
  return <g>
    <GroundShadow cx={165} cy={296} rx={152} />

    {PILLARS.map((x) => <Pillar key={x} kit={kit} x={x} />)}
    {/* 左柱涂鸦 */}
    <path d="M32 214 C36 204 42 222 46 208 C48 200 50 214 50 206" fill="none" stroke={GLOW.magenta} strokeWidth={2} strokeLinecap="round" opacity={0.55} />

    {/* 右柱挂旗 */}
    <rect x={300} y={72} width={24} height={3} rx={1.5} fill={kit.url("brassCyl")} stroke={INK} strokeWidth={0.7} />
    <path d="M304 75 L322 75 L322 122 L313 114 L304 122 Z" fill={GLASS.g2} stroke={INK} strokeWidth={1} />
    <path d="M304 75 L322 75 L322 122 L313 114 L304 122 Z" fill={kit.url("grime")} opacity={0.5} />
    <circle cx={313} cy={92} r={5} fill="none" stroke="#8ee8e2" strokeWidth={1} opacity={0.8} />
    <line x1={313} y1={88} x2={313} y2={100} stroke="#8ee8e2" strokeWidth={0.8} opacity={0.8} />
    {[103, 106].map((y) => <rect key={y} x={308} y={y} width={10} height={1.2} fill="#8ee8e2" opacity={0.6} />)}

    {/* 灯箱框 */}
    <Panel kit={kit} x={50} y={54} w={230} h={176} r={3} fill="steelV" />
    <Panel kit={kit} x={56} y={58} w={218} h={168} r={2} fill="steelDarkV" edge={0.3} />
    <BillboardPoster kit={kit} />
    <Trim kit={kit} x={56} y={225} w={218} h={2.5} />
    {[[54, 58], [276, 58], [54, 226], [276, 226]].map(([x, y]) => <Bolt key={`${x}-${y}`} x={x} y={y} r={1.5} />)}

    {/* 投影控制台 */}
    <Panel kit={kit} x={50} y={232} w={230} h={30} r={2} fill="steelDarkV" seam={2} />
    <Vent x={60} y={240} w={50} h={14} count={4} />
    <Vent x={220} y={240} w={50} h={14} count={4} />
    <Panel kit={kit} x={140} y={236} w={50} h={22} r={2} fill="steelLightV" grime={0.4} />
    <circle cx={165} cy={245} r={8.5} fill={kit.url("brassV")} stroke={INK} strokeWidth={1} />
    <circle cx={165} cy={245} r={5.8} fill={kit.url("glassLit")} stroke={INK} strokeWidth={0.8} />
    <circle cx={165} cy={245} r={2.6} fill={GLASS.g0} />
    <circle cx={163} cy={243} r={1.2} fill="#fff" opacity={0.7} />
    {[120, 128].map((x) => <circle key={x} cx={x} cy={247} r={1.8} fill="#1d3a2c" stroke={INK} strokeWidth={0.6} />)}
    <Placard x={196} y={241} w={18} h={10} tone="#9aa7ad" ink="#1e272c" lines={2} />

    {/* 横梁 + 垂线 */}
    <Panel kit={kit} x={50} y={262} w={230} h={6} r={1} fill="cylinder" edge={0.3} />
    <Cable d="M200 268 C214 284 252 286 280 272" width={3} />
    <Drip x={92} y={268} length={10} />
    <Drip x={236} y={230} length={8} />

    {/* 顶棚：弧形罩 + 天窗玻璃 + 灯槽 */}
    <Panel kit={kit} x={20} y={42} w={290} h={8} r={1} fill="steelDarkV" edge={0.3} />
    {DOWNLIGHTS.map((x) => <g key={x}>
      <ellipse cx={x} cy={50} rx={10} ry={3.2} fill={STEEL.s0} stroke={INK} strokeWidth={0.8} />
      <ellipse cx={x} cy={50} rx={7} ry={2} fill="#5a4522" />
    </g>)}
    <Shape kit={kit} d="M10 36 Q10 18 32 16 L298 16 Q320 18 320 36 L320 42 L10 42 Z" fill="steelV" />
    <path d="M14 30 Q16 20 32 19 L298 19 Q314 20 316 30" fill="none" stroke={STEEL.edge} strokeWidth={0.9} opacity={0.45} />
    {[30, 100, 170].map((x) => <Glass key={x} kit={kit} x={x} y={22} w={64} h={13} r={1.5} />)}
    <rect x={240} y={26} width={66} height={5} rx={2.5} fill="#143638" stroke={INK} strokeWidth={0.7} />
    <Trim kit={kit} x={14} y={40} w={302} h={3} />
    <TrimV kit={kit} x={235} y={22} h={14} w={2.5} />
    {[18, 312].map((x) => <Bolt key={x} x={x} y={34} r={1.5} />)}
    <path d="M10 36 L10 42 L14 42" fill="none" stroke={BRASS.b3} strokeWidth={0.8} opacity={0.6} />
  </g>;
}

function BillboardGlow({ kit }: { kit: Kit }) {
  return <g>
    {DOWNLIGHTS.map((x, index) => <g key={x}>
      <LightCone kit={kit} x={x} y={51} topWidth={14} bottomWidth={70} height={96} color={GLOW.amber} />
      <LightBar kit={kit} x={x - 7} y={49} w={14} h={2.4} color={GLOW.amber} core={GLOW.amberCore}
        className={index === 2 ? k.flicker : undefined} />
    </g>)}
    <LightBar kit={kit} x={240} y={26} w={66} h={5} color={GLOW.cyan} className={k.breath} />
    {PILLARS.map((x, index) => <LightBar key={x} kit={kit} x={x + 9} y={74} w={2} h={172} color={GLOW.cyan} halo={0.45}
      className={k.breath} style={{ "--delay": `${index * -1.2}s` } as CSSProperties} />)}
    {/* 撕口里的灯管 */}
    <LightBar kit={kit} x={250} y={70} w={20} h={4} color="#bfefff" halo={0.5} />
    <LightBar kit={kit} x={262} y={90} w={8} h={4} color="#bfefff" halo={0.5} />
    <HoloCat kit={kit} />
    <LightDot kit={kit} cx={165} cy={245} r={3} color={GLOW.cyan} className={k.breath} />
    <LightDot kit={kit} cx={120} cy={247} r={1.5} color={GLOW.green} className={k.blink} />
    <LightDot kit={kit} cx={128} cy={247} r={1.5} color={GLOW.amber} className={k.blink} style={{ "--delay": "-0.8s" } as CSSProperties} />
    <circle cx={313} cy={92} r={5} fill="none" stroke={GLOW.cyan} strokeWidth={1} filter={kit.url("bloom")} className={k.breath} />
  </g>;
}

/** 全息广告灯箱：候车亭式弧顶与筒灯 + 双透光立柱 + 背光旧海报 + 投影出的全息猫头。 */
export function HoloBillboard({ live = true }: { live?: boolean }) {
  return <PropSvg {...HOLO_BILLBOARD_SIZE} live={live}
    base={(kit) => <BillboardBase kit={kit} />}
    glow={(kit) => <BillboardGlow kit={kit} />}
  />;
}
