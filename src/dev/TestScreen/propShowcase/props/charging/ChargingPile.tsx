import type { CSSProperties } from "react";
import type { Kit } from "../../kit/PropSvg";
import { PropSvg } from "../../kit/PropSvg";
import { Bolt, Cable, Drip, Glass, GroundShadow, Panel, Placard, ScreenBase, Shape, Sleeve, Trim, TrimV, Vent } from "../../kit/parts";
import { LightBar, LightDot } from "../../kit/emissive";
import { BRASS, GLOW, INK, STEEL } from "../../kit/palette";
import { CHARGE_SCREEN, ChargingScreenUI } from "./ChargingScreen";
import k from "../../kit/kit.module.css";

export const CHARGING_PILE_SIZE = { width: 160, height: 320 } as const;

const BUTTONS = [
  { x: 62, dim: "#1f5a56", lit: GLOW.cyan },
  { x: 75, dim: "#5a4520", lit: GLOW.amber },
  { x: 88, dim: "#5a2440", lit: GLOW.magenta },
] as const;

/** 插枪：握把 + 黄铜枪头环 + 扳机护圈。 */
function ChargePlug({ kit }: { kit: Kit }) {
  return <g>
    <Shape kit={kit} d="M70 197 L90 197 L92 207 L88 230 L74 230 L68 207 Z" fill="steelDarkV" grime={0.4} stroke={1.2} />
    <rect x={71} y={194} width={18} height={5} rx={1.5} fill={kit.url("brassCyl")} stroke={INK} strokeWidth={0.9} />
    <path d="M74 212 Q80 222 86 212" fill="none" stroke={INK} strokeWidth={1.4} />
    <path d="M75 212 Q80 219 85 212" fill="none" stroke={STEEL.s4} strokeWidth={0.8} />
    {[203, 207].map((y) => <line key={y} x1={72} y1={y} x2={88} y2={y} stroke={INK} strokeWidth={0.6} opacity={0.7} />)}
    <line x1={71} y1={200} x2={71} y2={226} stroke={STEEL.s5} strokeWidth={0.8} opacity={0.5} />
    <rect x={76} y={224} width={8} height={4} rx={1} fill="#16383a" />
  </g>;
}

function ChargingBase({ kit }: { kit: Kit }) {
  return <g>
    <GroundShadow cx={80} cy={316} rx={72} />

    {/* 右侧外接导管 */}
    <Cable d="M140 118 L140 298" width={4.5} />
    {[132, 190, 250].map((y) => <Sleeve key={y} kit={kit} x={136} y={y} w={8} h={5} brass />)}

    {/* 阶梯底座 */}
    <Panel kit={kit} x={18} y={298} w={124} h={18} r={2} fill="steelDarkV" />
    <Panel kit={kit} x={26} y={288} w={108} h={11} r={2} fill="steelV" />
    <rect x={50} y={304} width={60} height={4} rx={2} fill="#143638" stroke={INK} strokeWidth={0.7} />
    {[24, 136].map((x) => <Bolt key={x} x={x} y={306} r={1.6} />)}

    {/* 两侧装饰鳍 */}
    <Shape kit={kit} d="M34 112 L24 122 L24 288 L34 288 Z" fill="cylinder" grime={0.4} />
    <Shape kit={kit} d="M126 112 L136 122 L136 288 L126 288 Z" fill="cylinder" grime={0.4} />
    <TrimV kit={kit} x={23} y={124} h={162} w={2.5} />
    <TrimV kit={kit} x={134.5} y={124} h={162} w={2.5} />

    {/* 主柱 */}
    <Panel kit={kit} x={34} y={72} w={92} h={218} r={3} fill="steelV" />
    <Glass kit={kit} x={39} y={86} w={9} h={192} r={1.5} lit />
    <Glass kit={kit} x={112} y={86} w={9} h={192} r={1.5} lit />
    <rect x={42.5} y={90} width={2} height={184} rx={1} fill="#1d5e60" />
    <rect x={115.5} y={90} width={2} height={184} rx={1} fill="#1d5e60" />

    {/* 中央面板 */}
    <Panel kit={kit} x={52} y={82} w={56} h={200} r={2} fill="steelDarkV" seam={2.5} grime={0.55} />
    <ScreenBase kit={kit} {...CHARGE_SCREEN} bezel={2.5} />
    <ChargingScreenUI kit={kit} color="#1c5854" lit={false} />
    <path d="M58 93 L72 93 L58 108 Z" fill="#fff" opacity={0.05} />

    {/* 按键 */}
    {BUTTONS.map(({ x, dim }) => <g key={x}>
      <rect x={x - 1} y={156} width={12} height={8} rx={1.5} fill={STEEL.s0} stroke={INK} strokeWidth={0.8} />
      <rect x={x + 1} y={157.5} width={8} height={4.5} rx={1} fill={dim} />
    </g>)}

    {/* 刷卡区 */}
    <Panel kit={kit} x={60} y={168} w={40} h={16} r={1.5} fill="steelLightV" grime={0.4} />
    <rect x={64} y={172} width={20} height={2} rx={1} fill="#040607" />
    <g fill="none" stroke={STEEL.s1} strokeWidth={1} strokeLinecap="round">
      <path d="M89 172 A5 5 0 0 1 89 180" />
      <path d="M92 170.5 A7 7 0 0 1 92 181.5" />
    </g>
    <rect x={64} y={177} width={14} height={3} rx={1} fill={STEEL.s2} />

    {/* 插枪座 */}
    <Panel kit={kit} x={62} y={190} w={36} h={46} r={3} fill="steelLightV" seam={2} grime={0.45} />
    <rect x={67} y={193} width={26} height={40} rx={2} fill="#070b0d" />
    <ChargePlug kit={kit} />

    <Placard x={60} y={244} w={40} h={10} tone="#c2b27a" ink="#3a2e16" lines={2} icon="#d9a531" />
    <Vent x={60} y={258} w={40} h={10} count={3} />
    <rect x={54} y={272} width={52} height={6} fill={kit.url("hazard")} stroke={INK} strokeWidth={0.8} />

    {/* 顶盖 + 灯带槽 */}
    <Panel kit={kit} x={26} y={70} w={108} h={9} r={2} fill="steelDarkV" />
    <Trim kit={kit} x={30} y={77} w={100} h={2.2} />
    <rect x={40} y={80} width={80} height={2.5} rx={1.2} fill="#143638" />

    {/* 阶梯顶冠 */}
    <Shape kit={kit} d="M30 71 L30 60 L44 60 L44 47 L60 47 L60 33 L100 33 L100 47 L116 47 L116 60 L130 60 L130 71 Z" fill="steelV" />
    <g stroke={STEEL.edge} strokeWidth={0.8} opacity={0.5}>
      <line x1={31} y1={61.2} x2={44} y2={61.2} />
      <line x1={45} y1={48.2} x2={60} y2={48.2} />
      <line x1={61} y1={34.2} x2={99} y2={34.2} />
    </g>
    <Trim kit={kit} x={31} y={58} w={13} h={2} />
    <Trim kit={kit} x={116} y={58} w={13} h={2} />
    <Trim kit={kit} x={45} y={45} w={15} h={2} />
    <Trim kit={kit} x={100} y={45} w={15} h={2} />
    <Glass kit={kit} x={66} y={38} w={28} h={10} r={1.5} lit streaks={false} />
    <path d="M81 39.5 L76 44 L79.5 44 L78 47 L84 42 L80.5 42 L82 39.5 Z" fill="#1c5854" />
    <Vent x={64} y={52} w={32} h={12} count={4} />
    {[48, 112].map((x) => <Bolt key={x} x={x} y={54} r={1.4} />)}

    {/* 尖顶信标 */}
    <rect x={77} y={15} width={6} height={19} rx={1.5} fill={kit.url("brassCyl")} stroke={INK} strokeWidth={0.9} />
    <rect x={74} y={30} width={12} height={4} rx={1} fill={kit.url("steelDarkV")} stroke={INK} strokeWidth={0.8} />
    <path d="M75 15 A5 5 0 0 1 85 15 Z" fill="#5a3a1c" stroke={INK} strokeWidth={0.9} />
    <line x1={80} y1={4} x2={80} y2={10} stroke={BRASS.b2} strokeWidth={1.2} />

    {/* 挂钩 + 电缆：从枪尾垂下，挂过左鳍挂钩，再从线口回到柱内 */}
    <path d="M22 206 L18 206 L18 216 Q18 220 22 220" fill="none" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
    <path d="M22 206 L18 206 L18 216 Q18 220 22 220" fill="none" stroke={BRASS.b2} strokeWidth={1.8} strokeLinecap="round" />
    <Cable d="M80 230 C80 266 52 282 32 268 C16 256 14 232 20 218" width={5.5} />
    <Cable d="M20 218 C26 210 36 214 38 226 L40 246" width={5.5} />
    <Sleeve kit={kit} x={34} y={244} w={12} h={6} />
    <Sleeve kit={kit} x={75} y={236} w={10} h={5} brass />

    <Drip x={46} y={60} length={12} />
    <Drip x={104} y={79} length={18} width={3} />
    <Drip x={60} y={287} length={8} />
  </g>;
}

function ChargingGlow({ kit }: { kit: Kit }) {
  return <g>
    <ChargingScreenUI kit={kit} color={GLOW.cyan} lit />
    <rect x={CHARGE_SCREEN.x} y={CHARGE_SCREEN.y} width={CHARGE_SCREEN.w} height={CHARGE_SCREEN.h} fill={GLOW.cyan} opacity={0.08} />
    {BUTTONS.map(({ x, lit }, index) => <LightBar key={x} kit={kit} x={x + 1} y={157.5} w={8} h={4.5} color={lit} halo={0.5}
      className={k.breath} style={{ "--delay": `${index * -0.7}s` } as CSSProperties} />)}
    <LightBar kit={kit} x={42.5} y={90} w={2} h={184} color={GLOW.cyan} halo={0.45} className={k.breath} />
    <LightBar kit={kit} x={115.5} y={90} w={2} h={184} color={GLOW.cyan} halo={0.45} className={k.breath} style={{ "--delay": "-1.2s" } as CSSProperties} />
    <LightBar kit={kit} x={40} y={80} w={80} h={2.5} color={GLOW.cyan} className={k.breath} style={{ "--delay": "-0.6s" } as CSSProperties} />
    <LightBar kit={kit} x={50} y={304} w={60} h={4} color={GLOW.cyan} halo={0.5} />
    <path d="M81 39.5 L76 44 L79.5 44 L78 47 L84 42 L80.5 42 L82 39.5 Z" fill={GLOW.cyan} filter={kit.url("bloom")} className={k.breath} />
    <rect x={76} y={224} width={8} height={4} rx={1} fill={GLOW.cyan} filter={kit.url("bloom")} className={k.blink} />
    <LightDot kit={kit} cx={80} cy={12.5} r={3.5} color={GLOW.amber} className={k.blink} style={{ "--delay": "-0.3s" } as CSSProperties} />
  </g>;
}

/** 街角充电桩：阶梯式装饰顶冠 + 双侧透光玻璃条 + 充电界面 + 挂在侧钩上的插枪电缆。 */
export function ChargingPile({ live = true }: { live?: boolean }) {
  return <PropSvg {...CHARGING_PILE_SIZE} live={live}
    base={(kit) => <ChargingBase kit={kit} />}
    glow={(kit) => <ChargingGlow kit={kit} />}
  />;
}
