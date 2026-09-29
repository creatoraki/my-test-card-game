import type { Kit } from "../../kit/PropSvg";
import { Bolt, Glass, Panel, ScreenBase } from "../../kit/parts";
import { BRASS, INK, STEEL } from "../../kit/palette";

/** 黄铜旋钮：外齿圈 + 内盘 + 摇柄。 */
export function GachaCrank({ kit, cx, cy }: { kit: Kit; cx: number; cy: number }) {
  const teeth = Array.from({ length: 16 }, (_, index) => index * 22.5);
  return <g>
    <circle cx={cx} cy={cy} r={21} fill={STEEL.s0} stroke={INK} strokeWidth={1.2} />
    {teeth.map((angle) => <rect key={angle} x={cx - 1.6} y={cy - 20} width={3.2} height={4} rx={0.6}
      fill={BRASS.b1} stroke={INK} strokeWidth={0.5} transform={`rotate(${angle} ${cx} ${cy})`} />)}
    <circle cx={cx} cy={cy} r={16} fill={kit.url("brassV")} stroke={INK} strokeWidth={1.2} />
    <circle cx={cx} cy={cy} r={12.5} fill="none" stroke={BRASS.b1} strokeWidth={1} />
    <path d={`M${cx - 11} ${cy - 5} A12 12 0 0 1 ${cx + 2} ${cy - 12}`} fill="none" stroke={BRASS.b4} strokeWidth={1.4} strokeLinecap="round" opacity={0.9} />
    {/* 摇柄 */}
    <g transform={`rotate(-32 ${cx} ${cy})`}>
      <rect x={cx - 19} y={cy - 4.5} width={38} height={9} rx={4.5} fill={kit.url("steelLightV")} stroke={INK} strokeWidth={1.2} />
      <line x1={cx - 16} y1={cy - 2.5} x2={cx + 16} y2={cy - 2.5} stroke={STEEL.edge} strokeWidth={0.8} opacity={0.7} />
      {[-12, -8, 8, 12].map((dx) => <line key={dx} x1={cx + dx} y1={cy - 3.5} x2={cx + dx} y2={cy + 3.5} stroke={INK} strokeWidth={0.6} opacity={0.6} />)}
      <circle cx={cx + 19} cy={cy} r={4.8} fill={kit.url("brassV")} stroke={INK} strokeWidth={1} />
      <circle cx={cx + 18} cy={cy - 1.4} r={1.4} fill={BRASS.b4} />
    </g>
    <circle cx={cx} cy={cy} r={5.5} fill={kit.url("cylinder")} stroke={INK} strokeWidth={1} />
    <circle cx={cx} cy={cy} r={2} fill={STEEL.s0} />
  </g>;
}

/** 投币模块：黄铜包边投币口 + 价格小屏 + 退币按钮。 */
export function GachaCoinModule({ kit, x, y }: { kit: Kit; x: number; y: number }) {
  return <g>
    <Panel kit={kit} x={x} y={y} w={38} h={52} r={2} fill="steelLightV" seam={2.5} grime={0.45} />
    {/* 投币口 */}
    <rect x={x + 12} y={y + 6} width={14} height={20} rx={2} fill={kit.url("brassV")} stroke={INK} strokeWidth={1} />
    <rect x={x + 17} y={y + 9} width={4} height={14} rx={1} fill="#030506" />
    <line x1={x + 13.5} y1={y + 7.5} x2={x + 24.5} y2={y + 7.5} stroke={BRASS.b4} strokeWidth={0.6} />
    {/* 价格小屏(亮面交给动效层) */}
    <ScreenBase kit={kit} x={x + 6} y={y + 32} w={26} h={9} bezel={1.8} />
    <g fill="#1f6e6a">
      <rect x={x + 8} y={y + 34} width={3} height={5} />
      <rect x={x + 12} y={y + 34} width={3} height={5} />
      <rect x={x + 18} y={y + 35} width={11} height={3} />
    </g>
    {/* 退币按钮 */}
    <circle cx={x + 10} cy={y + 46.5} r={2.6} fill={STEEL.s1} stroke={INK} strokeWidth={0.8} />
    <circle cx={x + 10} cy={y + 46.5} r={1.4} fill="#6a2a24" />
    <rect x={x + 16} y={y + 45} width={16} height={3} rx={1} fill={STEEL.s1} stroke={INK} strokeWidth={0.5} />
    <Bolt x={x + 4} y={y + 4} r={1.3} />
    <Bolt x={x + 34} y={y + 4} r={1.3} />
  </g>;
}

/** 出蛋口：内凹口 + 半透明翻盖 + 卡在口里的半颗胶囊。 */
export function GachaChute({ kit, x, y }: { kit: Kit; x: number; y: number }) {
  return <g>
    <Panel kit={kit} x={x} y={y} w={72} h={26} r={3} fill="steelDarkV" grime={0.5} />
    <rect x={x + 6} y={y + 4} width={60} height={18} rx={2} fill="#030607" stroke={INK} strokeWidth={1} />
    <rect x={x + 6} y={y + 4} width={60} height={5} fill="#000" opacity={0.6} />
    {/* 胶囊 */}
    <path d={`M${x + 24} ${y + 22} A10 10 0 0 1 ${x + 44} ${y + 22} Z`} fill={kit.url("cap-cyan")} stroke={INK} strokeWidth={0.9} />
    <path d={`M${x + 27} ${y + 17} A7 7 0 0 1 ${x + 33} ${y + 13.5}`} fill="none" stroke="#fff" strokeWidth={1.3} strokeLinecap="round" opacity={0.7} />
    {/* 翻盖 */}
    <Glass kit={kit} x={x + 6} y={y + 4} w={60} h={10} r={1} streaks={false} />
    <rect x={x + 6} y={y + 3} width={60} height={2.4} rx={1} fill={kit.url("cylinder")} stroke={INK} strokeWidth={0.6} />
  </g>;
}
