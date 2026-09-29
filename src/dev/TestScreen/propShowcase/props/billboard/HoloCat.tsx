import type { CSSProperties } from "react";
import type { Kit } from "../../kit/PropSvg";
import { GLOW } from "../../kit/palette";
import k from "../../kit/kit.module.css";

const CX = 165;
const CY = 136;

/** 以 (0,0) 为头部中心的猫头轮廓。 */
const HEAD = "M-40 30 C-50 12 -50 -12 -40 -28 L-44 -58 L-18 -40 C-6 -44 6 -44 18 -40 L44 -58 L40 -28 C50 -12 50 12 40 30 C26 46 -26 46 -40 30 Z";
const PARTICLES: readonly (readonly [number, number, number])[] = [
  [-34, 62, 0], [-18, 58, -0.8], [-4, 64, -1.6], [10, 60, -2.4], [24, 62, -0.4], [36, 58, -1.2], [-26, 66, -2], [18, 66, -2.8],
];

/** 全息猫头：投影光锥 + 扫描线填充 + 线稿五官 + 胸前铃铛 + 底座光环 + 上浮粒子；整体偶发闪断。 */
export function HoloCat({ kit }: { kit: Kit }) {
  const clip = kit.id("holoClip");
  return <g>
    <defs>
      <clipPath id={clip}><path d={HEAD} transform={`translate(${CX} ${CY})`} /></clipPath>
      <linearGradient id={kit.id("holoCone")} x1="0" y1="1" x2="0" y2="0">
        <stop offset={0} stopColor={GLOW.cyan} stopOpacity={0.5} />
        <stop offset={1} stopColor={GLOW.cyan} stopOpacity={0} />
      </linearGradient>
      <pattern id={kit.id("holoLines")} width={4} height={3} patternUnits="userSpaceOnUse">
        <rect width={4} height={1.2} fill={GLOW.cyan} opacity={0.4} />
      </pattern>
    </defs>

    {/* 投影光锥 */}
    <path d={`M${CX - 7} 244 L${CX + 7} 244 L${CX + 52} 176 L${CX - 52} 176 Z`} fill={kit.url("holoCone")} opacity={0.7} />

    <g className={k.flicker}>
      {/* 底座光环 */}
      <g fill="none" stroke={GLOW.cyan} filter={kit.url("bloom")}>
        <ellipse cx={CX} cy={200} rx={38} ry={6} strokeWidth={1.4} opacity={0.9} />
        <ellipse cx={CX} cy={200} rx={26} ry={4} strokeWidth={0.8} opacity={0.6} />
      </g>
      <g transform={`translate(${CX} ${CY})`}>
        <path d={HEAD} fill={GLOW.cyan} opacity={0.14} filter={kit.url("bloomWide")} />
        <path d={HEAD} fill={GLOW.cyan} opacity={0.08} />
      </g>
      <g clipPath={`url(#${clip})`}>
        <rect x={CX - 52} y={CY - 60} width={104} height={110} fill={kit.url("holoLines")} />
        <rect x={CX - 52} y={CY - 66} width={104} height={12} fill={GLOW.cyanCore} opacity={0.3}
          className={k.scan} style={{ "--scan-distance": "118px" } as CSSProperties} />
      </g>
      <g transform={`translate(${CX} ${CY})`} fill="none" stroke={GLOW.cyan} strokeLinecap="round" strokeLinejoin="round" filter={kit.url("bloom")}>
        <path d={HEAD} strokeWidth={2} />
        {/* 内耳 */}
        <path d="M-37 -32 L-40 -50 L-24 -39 M37 -32 L40 -50 L24 -39" strokeWidth={1} opacity={0.8} />
        {/* 额头电路纹 */}
        <path d="M0 -38 L0 -28 L-6 -22 M0 -28 L6 -22 M-12 -36 L-12 -30 M12 -36 L12 -30" strokeWidth={0.8} opacity={0.7} />
        {/* 眼睛 */}
        {[-17, 17].map((x) => <g key={x}>
          <ellipse cx={x} cy={-2} rx={9} ry={11} strokeWidth={1.4} />
          <ellipse cx={x} cy={0} rx={3.6} ry={7.5} fill={GLOW.cyan} stroke="none" opacity={0.85} />
          <circle cx={x - 2.5} cy={-6} r={2} fill={GLOW.cyanCore} stroke="none" />
        </g>)}
        {/* 鼻口 */}
        <path d="M-3 13 L3 13 L0 16.5 Z" fill={GLOW.cyan} strokeWidth={0.8} />
        <path d="M-8 20 Q-4 24 0 19.5 Q4 24 8 20" strokeWidth={1.1} />
        {/* 胡须 */}
        <path d="M-24 12 L-46 8 M-24 17 L-46 18 M-24 22 L-42 27 M24 12 L46 8 M24 17 L46 18 M24 22 L42 27" strokeWidth={0.8} opacity={0.8} />
        {/* 项圈 + 铃铛 */}
        <path d="M-30 39 Q0 52 30 39" strokeWidth={1.4} />
        <circle cx={0} cy={50} r={4} strokeWidth={1.2} />
        <line x1={-2} y1={51.5} x2={2} y2={51.5} strokeWidth={0.8} />
      </g>
      {/* 上浮粒子 */}
      {PARTICLES.map(([dx, dy, delay]) => <rect key={`${dx}-${dy}`}
        x={CX + dx} y={CY + dy} width={2} height={2} fill={GLOW.cyanCore}
        className={k.rise} style={{ "--delay": `${delay}s` } as CSSProperties} />)}
    </g>
  </g>;
}
