import type { CSSProperties } from "react";
import type { Kit } from "../../kit/PropSvg";
import { PropSvg } from "../../kit/PropSvg";
import { Bolt, Cable, Drip, Foot, Glass, GroundShadow, Panel, Shape, Sleeve, Trim, TrimV, Vent } from "../../kit/parts";
import { LightBar, LightDot } from "../../kit/emissive";
import { GLOW, INK, STEEL } from "../../kit/palette";
import { GachaGlobe, GLOBE } from "./GachaGlobe";
import { GachaChute, GachaCoinModule, GachaCrank } from "./GachaControls";
import k from "../../kit/kit.module.css";

export const GACHA_SIZE = { width: 190, height: 280 } as const;

const BULBS = Array.from({ length: 9 }, (_, index) => 24 + index * 17.75);
const BULB_Y = 145;

function GachaBase({ kit }: { kit: Kit }) {
  return <g>
    <GroundShadow cx={95} cy={276} rx={88} />
    <Foot kit={kit} x={24} y={268} w={28} h={8} />
    <Foot kit={kit} x={138} y={268} w={28} h={8} />

    {/* 底座 + 灯槽 */}
    <Panel kit={kit} x={16} y={254} w={158} h={16} r={2} fill="steelDarkV" />
    <rect x={62} y={259.5} width={66} height={4} rx={2} fill="#143638" stroke={INK} strokeWidth={0.7} />
    {[22, 168].map((x) => <Bolt key={x} x={x} y={262} r={1.5} />)}

    {/* 机身 */}
    <Panel kit={kit} x={22} y={150} w={146} h={102} r={3} fill="steelV" />
    {[22, 152].map((x) => <g key={x}>
      <Panel kit={kit} x={x} y={150} w={16} h={102} r={2} fill="cylinder" grime={0.4} edge={0.3} />
      <Vent x={x + 3} y={196} w={10} h={32} count={7} />
      <Bolt x={x + 8} y={160} r={1.5} />
      <Bolt x={x + 8} y={242} r={1.5} />
    </g>)}
    <TrimV kit={kit} x={38} y={152} h={98} />
    <TrimV kit={kit} x={149} y={152} h={98} />

    {/* 操作面 */}
    <Panel kit={kit} x={44} y={157} w={102} h={63} r={2} fill="steelDarkV" seam={2.5} grime={0.5} />
    <GachaCrank kit={kit} cx={72} cy={189} />
    <GachaCoinModule kit={kit} x={102} y={162} />

    {/* 出蛋口 + 贴纸 */}
    <GachaChute kit={kit} x={50} y={223} />
    <g transform="rotate(8 136 236)">
      <rect x={126} y={226} width={20} height={20} rx={2} fill="#e9c7d6" stroke={INK} strokeWidth={0.8} />
      <circle cx={136} cy={235} r={5} fill="#ff5fa8" stroke={INK} strokeWidth={0.6} />
      <rect x={131} y={234.2} width={10} height={1.6} fill={INK} />
      <path d="M140 246 L146 240 L146 246 Z" fill="#a98a98" />
      <rect x={126} y={226} width={20} height={20} rx={2} fill={kit.url("grime")} opacity={0.6} />
    </g>
    <rect x={20} y={250} width={150} height={4} fill={kit.url("hazard")} stroke={INK} strokeWidth={0.8} />

    {/* 右侧冷却管 */}
    <Cable d="M168 158 C184 166 184 206 168 216" width={4.5} />
    <Sleeve kit={kit} x={174} y={166} w={8} h={4} brass />
    <Sleeve kit={kit} x={175} y={198} w={8} h={4} brass />

    {/* 玻璃罩(压在沿口之下) */}
    <GachaGlobe kit={kit} />

    {/* 沿口 + 灯座 */}
    <Panel kit={kit} x={12} y={136} w={166} h={18} r={5} fill="steelLightV" />
    <Trim kit={kit} x={16} y={134} w={158} h={3} />
    <Trim kit={kit} x={18} y={152} w={154} h={2.5} />
    {BULBS.map((x) => <g key={x}>
      <circle cx={x} cy={BULB_Y} r={3.8} fill={STEEL.s0} stroke={INK} strokeWidth={0.8} />
      <circle cx={x} cy={BULB_Y} r={2.6} fill="#4a3524" />
      <circle cx={x - 0.9} cy={BULB_Y - 0.9} r={0.8} fill="#fff" opacity={0.5} />
    </g>)}
    <Drip x={60} y={155} length={10} />
    <Drip x={134} y={155} length={15} width={3} />

    {/* 顶冠：阶梯式装饰牌 */}
    <Shape kit={kit} d="M72 24 L60 31 L60 27 L72 16 Z" fill="brassV" grime={0.3} stroke={1} />
    <Shape kit={kit} d="M118 24 L130 31 L130 27 L118 16 Z" fill="brassV" grime={0.3} stroke={1} />
    <Panel kit={kit} x={68} y={26} w={54} h={8} r={3} fill="cylinder" grime={0.4} edge={0.3} />
    <Shape kit={kit} d="M72 27 L72 15 L80 15 L80 7 L110 7 L110 15 L118 15 L118 27 Z" fill="steelV" />
    <line x1={73} y1={16.2} x2={80} y2={16.2} stroke={STEEL.edge} strokeWidth={0.8} opacity={0.5} />
    <line x1={81} y1={8.2} x2={109} y2={8.2} stroke={STEEL.edge} strokeWidth={0.8} opacity={0.5} />
    <Trim kit={kit} x={74} y={24} w={42} h={2} />
    <Glass kit={kit} x={84} y={10} w={22} h={12} r={1.5} lit streaks={false} />
    <g fill="none" stroke="#1f6e6a" strokeWidth={1.2}>
      <circle cx={95} cy={16} r={4} />
      <line x1={91} y1={16} x2={99} y2={16} />
    </g>
    <rect x={93} y={1} width={4} height={7} rx={1} fill={kit.url("brassCyl")} stroke={INK} strokeWidth={0.8} />
    <Bolt x={76} y={20} r={1.2} />
    <Bolt x={114} y={20} r={1.2} />
  </g>;
}

function GachaGlow({ kit }: { kit: Kit }) {
  return <g>
    {BULBS.map((x, index) => <LightDot
      key={x} kit={kit} cx={x} cy={BULB_Y} r={2.5}
      color={index % 2 ? GLOW.magenta : GLOW.amber}
      className={k.marquee}
      style={{ "--delay": `${(index % 2) * -0.6}s` } as CSSProperties}
    />)}
    {/* 罩内背光 */}
    <ellipse cx={GLOBE.cx} cy={GLOBE.cy + 40} rx={46} ry={18} fill={GLOW.cyan} opacity={0.18} filter={kit.url("bloomWide")} className={k.breath} />
    {/* 顶冠徽记 */}
    <g className={k.breath} style={{ "--delay": "-1.2s" } as CSSProperties}>
      <rect x={84} y={10} width={22} height={12} rx={1.5} fill={GLOW.cyan} opacity={0.22} />
      <g fill="none" stroke={GLOW.cyan} strokeWidth={1.3} filter={kit.url("bloom")}>
        <circle cx={95} cy={16} r={4} />
        <line x1={91} y1={16} x2={99} y2={16} />
      </g>
    </g>
    {/* 价格屏 */}
    <g className={k.breath} style={{ "--delay": "-0.4s" } as CSSProperties} fill={GLOW.cyan} filter={kit.url("bloom")}>
      <rect x={110} y={196} width={3} height={5} />
      <rect x={114} y={196} width={3} height={5} />
      <rect x={120} y={197} width={11} height={3} />
    </g>
    <LightDot kit={kit} cx={112} cy={208.5} r={1.3} color={GLOW.red} className={k.blink} />
    <LightBar kit={kit} x={62} y={259.5} w={66} h={4} color={GLOW.cyan} className={k.breath} style={{ "--delay": "-0.8s" } as CSSProperties} />
  </g>;
}

/** 霓虹扭蛋机：黄铜经线玻璃罩 + 阶梯顶冠 + 摇柄投币面板 + 跑马灯沿口。 */
export function GachaMachine({ live = true }: { live?: boolean }) {
  return <PropSvg {...GACHA_SIZE} live={live}
    base={(kit) => <GachaBase kit={kit} />}
    glow={(kit) => <GachaGlow kit={kit} />}
  />;
}
