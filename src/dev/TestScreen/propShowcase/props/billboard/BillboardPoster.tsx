import type { Kit } from "../../kit/PropSvg";
import { INK } from "../../kit/palette";

/** 海报区域 60..270 × 62..222。 */
export const POSTER = { x: 60, y: 62, w: 210, h: 160 } as const;
const SUN = { cx: 165, cy: 152, r: 58 } as const;

const SKYLINE = "M60 206 L60 184 L70 184 L70 170 L80 170 L80 178 L92 178 L92 160 L100 160 L100 152 L106 152 L106 176 L118 176 L118 168 L128 168 L128 186 L140 186 L140 174 L150 174 L150 190 L182 190 L182 172 L192 172 L192 156 L198 156 L198 148 L204 148 L204 180 L214 180 L214 166 L226 166 L226 184 L240 184 L240 172 L252 172 L252 190 L270 190 L270 206 Z";
const WINDOWS: readonly (readonly [number, number])[] = [[73, 176], [95, 166], [102, 158], [110, 181], [122, 173], [186, 177], [195, 162], [200, 154], [208, 186], [218, 171], [244, 178]];

/** 背光旧海报：合成波落日 + 城市剪影 + 透视地格 + 右侧图形化标题块；右上角撕破露出灯管。 */
export function BillboardPoster({ kit }: { kit: Kit }) {
  const clip = kit.id("posterClip");
  return <g>
    <defs>
      <linearGradient id={kit.id("posterBg")} x1="0" y1="0" x2="0" y2="1">
        <stop offset={0} stopColor="#1f1034" />
        <stop offset={0.55} stopColor="#4a1a4c" />
        <stop offset={1} stopColor="#170a22" />
      </linearGradient>
      <linearGradient id={kit.id("sun")} x1="0" y1="0" x2="0" y2="1">
        <stop offset={0} stopColor="#ffd98a" />
        <stop offset={0.45} stopColor="#ff8a7a" />
        <stop offset={1} stopColor="#c0307a" />
      </linearGradient>
      <clipPath id={clip}><rect x={POSTER.x} y={POSTER.y} width={POSTER.w} height={POSTER.h} /></clipPath>
    </defs>
    <g clipPath={`url(#${clip})`}>
      <rect x={POSTER.x} y={POSTER.y} width={POSTER.w} height={POSTER.h} fill={kit.url("posterBg")} />
      {/* 星点 */}
      {[[76, 72], [98, 88], [132, 70], [210, 80], [246, 110], [88, 118], [226, 96]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={0.8} fill="#ffd6f0" opacity={0.7} />)}
      {/* 落日 + 横切条 */}
      <circle cx={SUN.cx} cy={SUN.cy} r={SUN.r} fill={kit.url("sun")} opacity={0.92} />
      {[146, 156, 165, 173, 180, 186].map((y, index) => <rect key={y} x={SUN.cx - SUN.r} y={y} width={SUN.r * 2} height={1.6 + index * 0.9} fill="#4a1a4c" />)}
      <circle cx={SUN.cx} cy={SUN.cy} r={SUN.r + 6} fill="none" stroke="#ff9ad0" strokeWidth={1} opacity={0.25} />
      {/* 城市剪影 */}
      <path d={SKYLINE} fill="#12081c" />
      {WINDOWS.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width={1.8} height={2.2} fill="#ffc46b" opacity={0.8} />)}
      {/* 透视地格 */}
      <rect x={POSTER.x} y={206} width={POSTER.w} height={16} fill="#1a0a24" />
      <g stroke="#ff5fa8" strokeWidth={0.7} opacity={0.55}>
        {[207, 209.5, 213, 217.5].map((y) => <line key={y} x1={POSTER.x} y1={y} x2={POSTER.x + POSTER.w} y2={y} />)}
        {[-120, -80, -48, -20, 0, 20, 48, 80, 120].map((dx) => <line key={dx} x1={SUN.cx + dx * 0.25} y1={206} x2={SUN.cx + dx * 1.2} y2={222} />)}
      </g>
      {/* 左上品牌角标 */}
      <circle cx={78} cy={78} r={8} fill="none" stroke="#ffd6f0" strokeWidth={1.4} opacity={0.8} />
      <path d="M72 80 L73 72 L76 75 L80 75 L83 72 L84 80 Z" fill="#ffd6f0" opacity={0.8} />
      <rect x={90} y={74} width={30} height={3} rx={1} fill="#ffd6f0" opacity={0.6} />
      <rect x={90} y={80} width={20} height={2} rx={1} fill="#ffd6f0" opacity={0.4} />
      {/* 右侧标题块 */}
      <rect x={228} y={120} width={34} height={8} rx={1} fill="#ffe3f1" opacity={0.85} />
      <rect x={228} y={131} width={26} height={8} rx={1} fill="#ffe3f1" opacity={0.85} />
      {[144, 149, 154].map((y) => <rect key={y} x={228} y={y} width={30} height={2} rx={1} fill="#ff9ad0" opacity={0.6} />)}
      <g fill="#ffe3f1" opacity={0.7}>
        {[0, 1, 2, 3, 4].flatMap((row) => [0, 1, 2, 3, 4].map((col) => (row * 3 + col * 7) % 4 === 0 || row === 0 || col === 0
          ? <rect key={`${row}-${col}`} x={242 + col * 3.6} y={160 + row * 3.6} width={3} height={3} />
          : null))}
      </g>
      {/* 水渍与脏污 */}
      <ellipse cx={96} cy={200} rx={30} ry={14} fill="#3a2410" opacity={0.28} />
      <path d="M200 62 Q204 90 198 112 Q206 90 208 62 Z" fill="#2a1a10" opacity={0.3} />
      <rect x={POSTER.x} y={POSTER.y} width={POSTER.w} height={POSTER.h} fill={kit.url("grime")} opacity={0.5} />
      {/* 撕破一角：背后的灯管 + 卷起的纸边 */}
      <path d="M232 62 L270 62 L270 108 L256 96 L250 80 L240 74 Z" fill="#0c1a1e" />
      <rect x={244} y={70} width={26} height={4} rx={2} fill="#bfefff" />
      <rect x={254} y={90} width={16} height={4} rx={2} fill="#bfefff" />
      <path d="M232 62 L240 74 L250 80 L256 96 L270 108 L262 112 L250 100 L244 84 L234 78 Z" fill="#d8c7b0" stroke={INK} strokeWidth={0.8} />
      <path d="M236 70 L244 80 L248 92" fill="none" stroke="#9c8a74" strokeWidth={0.8} />
      {/* 胶带 */}
      <rect x={58} y={210} width={22} height={7} fill="#d8d0b0" opacity={0.7} transform="rotate(-24 69 213)" />
    </g>
    {/* 玻璃罩面反光 */}
    <g fill="#e8fffd">
      <path d="M84 222 L108 222 L160 62 L136 62 Z" opacity={0.06} />
      <path d="M172 222 L180 222 L232 62 L224 62 Z" opacity={0.07} />
    </g>
    <rect x={POSTER.x} y={POSTER.y} width={POSTER.w} height={POSTER.h} fill="none" stroke={INK} strokeWidth={1.2} />
  </g>;
}
