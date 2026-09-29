import type { Kit } from "../../kit/PropSvg";
import { BRASS, GLASS, INK } from "../../kit/palette";

export const GLOBE = { cx: 95, cy: 90, r: 60 } as const;

/** 胶囊配色：[亮, 中, 暗]。 */
const CAPSULE_COLORS = {
  pink: ["#ffb3d4", "#ff5fa8", "#8e2458"],
  cyan: ["#c4fffa", "#45e0d8", "#11706c"],
  amber: ["#ffe2a6", "#ffb347", "#8a5316"],
  violet: ["#d8ccff", "#8f7cff", "#3e2f8c"],
  red: ["#ffc0b4", "#ff6a5a", "#8a2a22"],
} as const;
type CapsuleColor = keyof typeof CAPSULE_COLORS;

/** 胶囊堆 [cx, cy, 颜色, 倾角]；越靠后(越高)的排越先画并压暗。 */
const CAPSULES: readonly (readonly [number, number, CapsuleColor, number])[] = [
  [66, 78, "red", -20], [92, 74, "amber", 15], [118, 80, "cyan", -35],
  [52, 98, "cyan", 30], [78, 96, "violet", -10], [104, 94, "pink", 40], [130, 100, "amber", -15],
  [42, 118, "amber", -40], [66, 116, "pink", 10], [92, 114, "cyan", -25], [118, 116, "red", 20], [142, 120, "violet", 35],
  [54, 136, "violet", 15], [80, 134, "amber", -30], [106, 134, "violet", 5], [132, 138, "pink", -20],
  [68, 152, "cyan", 25], [94, 152, "red", -5], [120, 154, "cyan", 30],
];

function Capsule({ kit, cx, cy, color, tilt, depth }: { kit: Kit; cx: number; cy: number; color: CapsuleColor; tilt: number; depth: number }) {
  const r = 12;
  return <g transform={`rotate(${tilt} ${cx} ${cy})`}>
    <circle cx={cx} cy={cy} r={r} fill={kit.url("paintV")} />
    <path d={`M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy} Z`} fill={kit.url(`cap-${color}`)} />
    {/* 半透明外壳下半的内部阴影 */}
    <path d={`M${cx - r} ${cy} A${r} ${r} 0 0 0 ${cx + r} ${cy}`} fill="none" stroke="#000" strokeWidth={3} opacity={0.18} transform={`translate(1.2 -1.4)`} />
    <rect x={cx - r} y={cy - 1.2} width={r * 2} height={2.4} fill={CAPSULE_COLORS[color][2]} />
    <line x1={cx - r} y1={cy - 1.2} x2={cx + r} y2={cy - 1.2} stroke="#fff" strokeWidth={0.5} opacity={0.5} />
    <path d={`M${cx - 7.5} ${cy - 5} A8 8 0 0 1 ${cx - 1} ${cy - 9.5}`} fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" opacity={0.75} />
    <circle cx={cx + 5} cy={cy + 6} r={1.3} fill="#fff" opacity={0.5} />
    <circle cx={cx} cy={cy} r={r} fill="none" stroke={INK} strokeWidth={1.1} />
    {depth > 0 && <circle cx={cx} cy={cy} r={r} fill={GLASS.g0} opacity={depth} />}
  </g>;
}

/** 扭蛋玻璃罩：内部胶囊堆 + 背光 + 玻璃反光 + 裂纹 + 黄铜经线罩架。 */
export function GachaGlobe({ kit }: { kit: Kit }) {
  const { cx, cy, r } = GLOBE;
  const clip = kit.id("globeClip");
  return <g>
    <defs>
      {(Object.keys(CAPSULE_COLORS) as CapsuleColor[]).map((key) => <radialGradient key={key} id={kit.id(`cap-${key}`)} cx="0.35" cy="0.3" r="0.8">
        <stop offset={0} stopColor={CAPSULE_COLORS[key][0]} />
        <stop offset={0.5} stopColor={CAPSULE_COLORS[key][1]} />
        <stop offset={1} stopColor={CAPSULE_COLORS[key][2]} />
      </radialGradient>)}
      <radialGradient id={kit.id("globeBack")} cx="0.5" cy="0.85" r="0.8">
        <stop offset={0} stopColor="#1f6d70" />
        <stop offset={0.55} stopColor="#0b2d31" />
        <stop offset={1} stopColor="#041214" />
      </radialGradient>
      <radialGradient id={kit.id("globeTint")} cx="0.36" cy="0.3" r="0.8">
        <stop offset={0} stopColor="#c8fffa" stopOpacity={0.2} />
        <stop offset={0.6} stopColor="#2f8e92" stopOpacity={0.08} />
        <stop offset={1} stopColor="#06181b" stopOpacity={0.55} />
      </radialGradient>
      <clipPath id={clip}><circle cx={cx} cy={cy} r={r - 1} /></clipPath>
    </defs>

    <g clipPath={`url(#${clip})`}>
      <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} fill={kit.url("globeBack")} />
      {/* 背板网格 */}
      <g stroke="#2f8e92" strokeWidth={0.5} opacity={0.25}>
        {[-40, -20, 0, 20, 40].map((dx) => <line key={dx} x1={cx + dx} y1={cy - r} x2={cx + dx} y2={cy + r} />)}
        {[-40, -20, 0, 20].map((dy) => <line key={dy} x1={cx - r} y1={cy + dy} x2={cx + r} y2={cy + dy} />)}
      </g>
      {CAPSULES.map(([x, y, color, tilt], index) => <Capsule key={index} kit={kit} cx={x} cy={y} color={color} tilt={tilt} depth={index < 3 ? 0.35 : index < 7 ? 0.18 : 0} />)}
      <circle cx={cx} cy={cy} r={r} fill={kit.url("globeTint")} />
      {/* 反光：左上大弧 + 右上窗形高光 */}
      <path d={`M${cx - 44} ${cy - 10} A46 46 0 0 1 ${cx - 6} ${cy - 50}`} fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" opacity={0.28} />
      <path d={`M${cx - 48} ${cy + 6} A50 50 0 0 1 ${cx - 46} ${cy - 4}`} fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" opacity={0.3} />
      <path d={`M${cx + 18} ${cy - 50} Q${cx + 34} ${cy - 44} ${cx + 42} ${cy - 30} L${cx + 36} ${cy - 27} Q${cx + 29} ${cy - 39} ${cx + 15} ${cy - 44} Z`} fill="#fff" opacity={0.2} />
      {/* 裂纹 */}
      <g fill="none" stroke="#e9fffd" strokeWidth={0.8} strokeLinecap="round" opacity={0.7}>
        <polyline points={`${cx + 58},${cy - 14} ${cx + 42},${cy - 8} ${cx + 35},${cy - 14} ${cx + 22},${cy}`} />
        <polyline points={`${cx + 42},${cy - 8} ${cx + 45},${cy + 8} ${cx + 38},${cy + 18}`} />
        <polyline points={`${cx + 35},${cy - 14} ${cx + 31},${cy - 28}`} />
        <polyline points={`${cx + 22},${cy} ${cx + 12},${cy + 2}`} />
      </g>
      <path d={`M${cx + 58} ${cy - 14} L${cx + 42} ${cy - 8} L${cx + 35} ${cy - 14} L${cx + 44} ${cy - 20} Z`} fill="#fff" opacity={0.08} />
    </g>

    {/* 黄铜经线罩架：墨线打底 + 黄铜 + 受光细线 */}
    <g fill="none">
      <ellipse cx={cx} cy={cy} rx={36} ry={r} stroke={INK} strokeWidth={4} />
      <ellipse cx={cx} cy={cy} rx={36} ry={r} stroke={BRASS.b2} strokeWidth={2.4} />
      <ellipse cx={cx} cy={cy} rx={36} ry={r} stroke={BRASS.b4} strokeWidth={0.6} opacity={0.7} transform="translate(-0.6 -0.4)" />
      <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke={INK} strokeWidth={4} />
      <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke={BRASS.b2} strokeWidth={2.4} />
      <line x1={cx - 0.5} y1={cy - r} x2={cx - 0.5} y2={cy + r} stroke={BRASS.b4} strokeWidth={0.6} opacity={0.7} />
    </g>
    <circle cx={cx} cy={cy} r={r - 2} fill="none" stroke={GLASS.g4} strokeWidth={0.9} opacity={0.35} />
    <circle cx={cx} cy={cy} r={r} fill="none" stroke={INK} strokeWidth={1.8} />
  </g>;
}
