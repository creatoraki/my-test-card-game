import type { Kit } from "./PropSvg";
import { BRASS, INK, STEEL } from "./palette";

/**
 * 硬表面零件：与近景素材同一套构造逻辑——
 * 每块面板 = 深色描边 + 材质渐变 + 颗粒脏污 + 左上受光亮边 + 右下暗边 + 内圈缝线。
 */

export type Material = "steelV" | "steelDarkV" | "steelLightV" | "cylinder" | "brassV" | "brassCyl" | "paintV" | "paintCyl" | "glassV" | "glassLit";

export interface Box { x: number; y: number; w: number; h: number; r?: number }

/** 倒角面板。seam: 内缩缝线距离，0 表示不画。 */
export function Panel({ kit, x, y, w, h, r = 2, fill = "steelV", grime = 0.55, seam = 0, stroke = 1.4, edge = 0.5 }: Box & {
  kit: Kit;
  fill?: Material;
  grime?: number;
  seam?: number;
  stroke?: number;
  edge?: number;
}) {
  const light = fill.startsWith("brass") ? BRASS.b4 : fill.startsWith("paint") ? "#ffffff" : STEEL.edge;
  return <g>
    <rect x={x} y={y} width={w} height={h} rx={r} fill={kit.url(fill)} />
    {grime > 0 && <rect x={x} y={y} width={w} height={h} rx={r} fill={kit.url("grime")} opacity={grime} />}
    {edge > 0 && <>
      <line x1={x + r + 0.5} y1={y + 1.1} x2={x + w - r - 0.5} y2={y + 1.1} stroke={light} strokeWidth={1} opacity={edge} />
      <line x1={x + 1.1} y1={y + r + 0.5} x2={x + 1.1} y2={y + h - r - 0.5} stroke={light} strokeWidth={0.8} opacity={edge * 0.5} />
      <line x1={x + r} y1={y + h - 1.1} x2={x + w - r} y2={y + h - 1.1} stroke="#000" strokeWidth={1.2} opacity={0.45} />
      <line x1={x + w - 1.1} y1={y + r} x2={x + w - 1.1} y2={y + h - r} stroke="#000" strokeWidth={1} opacity={0.35} />
    </>}
    {seam > 0 && <rect x={x + seam} y={y + seam} width={w - seam * 2} height={h - seam * 2} rx={Math.max(0, r - 1)} fill="none" stroke={INK} strokeWidth={0.8} opacity={0.6} />}
    <rect x={x} y={y} width={w} height={h} rx={r} fill="none" stroke={INK} strokeWidth={stroke} />
  </g>;
}

/** 任意多边形面板：路径描边 + 材质 + 脏污。 */
export function Shape({ kit, d, fill = "steelV", grime = 0.55, stroke = 1.4 }: { kit: Kit; d: string; fill?: Material; grime?: number; stroke?: number }) {
  return <g>
    <path d={d} fill={kit.url(fill)} />
    {grime > 0 && <path d={d} fill={kit.url("grime")} opacity={grime} />}
    <path d={d} fill="none" stroke={INK} strokeWidth={stroke} strokeLinejoin="round" />
  </g>;
}

/** 黄铜包边条：细长高光条，贴在面板边缘。 */
export function Trim({ kit, x, y, w, h = 3 }: { kit: Kit; x: number; y: number; w: number; h?: number }) {
  return <g>
    <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={kit.url("brassV")} stroke={INK} strokeWidth={0.9} />
    <line x1={x + 1.5} y1={y + h * 0.35} x2={x + w - 1.5} y2={y + h * 0.35} stroke={BRASS.b4} strokeWidth={0.6} opacity={0.9} />
  </g>;
}

/** 竖向黄铜包边。 */
export function TrimV({ kit, x, y, h, w = 3 }: { kit: Kit; x: number; y: number; h: number; w?: number }) {
  return <g>
    <rect x={x} y={y} width={w} height={h} rx={w / 2} fill={kit.url("brassCyl")} stroke={INK} strokeWidth={0.9} />
    <line x1={x + w * 0.4} y1={y + 1.5} x2={x + w * 0.4} y2={y + h - 1.5} stroke={BRASS.b4} strokeWidth={0.5} opacity={0.8} />
  </g>;
}

/** 螺栓：六角暗底 + 受光点。 */
export function Bolt({ x, y, r = 1.8 }: { x: number; y: number; r?: number }) {
  return <g>
    <circle cx={x} cy={y} r={r} fill={STEEL.s2} stroke={INK} strokeWidth={0.7} />
    <path d={`M${x - r * 0.55} ${y} L${x + r * 0.55} ${y}`} stroke={INK} strokeWidth={0.6} />
    <circle cx={x - r * 0.35} cy={y - r * 0.4} r={r * 0.35} fill={STEEL.edge} opacity={0.75} />
  </g>;
}

/** 通风格栅：暗槽 + 每片叶片下缘受光。 */
export function Vent({ x, y, w, h, count, vertical = false }: { x: number; y: number; w: number; h: number; count: number; vertical?: boolean }) {
  const step = (vertical ? w : h) / count;
  return <g>
    <rect x={x} y={y} width={w} height={h} rx={1} fill={STEEL.s0} stroke={INK} strokeWidth={0.9} />
    {Array.from({ length: count }, (_, index) => vertical
      ? <g key={index}>
        <rect x={x + index * step + step * 0.2} y={y + 1.5} width={step * 0.45} height={h - 3} fill={STEEL.s3} />
        <line x1={x + index * step + step * 0.2} y1={y + 1.5} x2={x + index * step + step * 0.2} y2={y + h - 1.5} stroke={STEEL.s5} strokeWidth={0.6} opacity={0.7} />
      </g>
      : <g key={index}>
        <rect x={x + 1.5} y={y + index * step + step * 0.2} width={w - 3} height={step * 0.45} fill={STEEL.s3} />
        <line x1={x + 1.5} y1={y + index * step + step * 0.65} x2={x + w - 1.5} y2={y + index * step + step * 0.65} stroke={STEEL.s5} strokeWidth={0.6} opacity={0.7} />
      </g>)}
  </g>;
}

/** 玻璃面板：内透光渐变 + 两道斜向反光 + 顶部内沿亮线。 */
export function Glass({ kit, x, y, w, h, r = 2, lit = false, streaks = true }: Box & { kit: Kit; lit?: boolean; streaks?: boolean }) {
  const s1 = w * 0.18;
  return <g>
    <rect x={x} y={y} width={w} height={h} rx={r} fill={kit.url(lit ? "glassLit" : "glassV")} />
    {streaks && <g fill="#e8fffd">
      <path d={`M${x + w * 0.12} ${y + h} L${x + w * 0.12 + s1} ${y + h} L${x + w * 0.55} ${y} L${x + w * 0.55 - s1} ${y} Z`} opacity={0.07} />
      <path d={`M${x + w * 0.5} ${y + h} L${x + w * 0.56} ${y + h} L${x + w * 0.86} ${y} L${x + w * 0.8} ${y} Z`} opacity={0.06} />
    </g>}
    <line x1={x + r + 1} y1={y + 1.4} x2={x + w - r - 1} y2={y + 1.4} stroke="#a8fff7" strokeWidth={0.9} opacity={0.45} />
    <rect x={x} y={y} width={w} height={h} rx={r} fill="none" stroke={INK} strokeWidth={1.3} />
  </g>;
}

/** 线缆：深色外皮 + 受光高光，可叠加若干束线套。 */
export function Cable({ d, width = 4, color = STEEL.s1, highlight = STEEL.s4 }: { d: string; width?: number; color?: string; highlight?: string }) {
  return <g fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} stroke={INK} strokeWidth={width + 1.8} />
    <path d={d} stroke={color} strokeWidth={width} />
    <path d={d} stroke={highlight} strokeWidth={Math.max(0.7, width * 0.22)} opacity={0.6} transform={`translate(${-width * 0.18} ${-width * 0.22})`} />
  </g>;
}

/** 束线套/管接头：套在线缆或管道上的短金属环。 */
export function Sleeve({ kit, x, y, w, h, brass = false }: { kit: Kit; x: number; y: number; w: number; h: number; brass?: boolean }) {
  return <rect x={x} y={y} width={w} height={h} rx={1} fill={kit.url(brass ? "brassCyl" : "cylinder")} stroke={INK} strokeWidth={0.9} />;
}

/** 标签牌：浅底 + 条状"字迹"(图形化，不出现文字)。 */
export function Placard({ x, y, w, h, tone = "#c9c3ae", ink = "#4a4436", lines = 2, icon }: {
  x: number; y: number; w: number; h: number; tone?: string; ink?: string; lines?: number; icon?: string;
}) {
  const left = icon ? x + h : x + 2.5;
  return <g>
    <rect x={x} y={y} width={w} height={h} rx={1} fill={tone} stroke={INK} strokeWidth={0.8} />
    {icon && <rect x={x + 2} y={y + 2} width={h - 4} height={h - 4} rx={0.8} fill={icon} />}
    {Array.from({ length: lines }, (_, index) => <rect
      key={index}
      x={left}
      y={y + 2.2 + index * ((h - 4) / lines)}
      width={(x + w - 2.5 - left) * (index === lines - 1 ? 0.6 : 1)}
      height={Math.max(0.9, (h - 4) / lines - 1.3)}
      fill={ink}
      opacity={0.75}
    />)}
  </g>;
}

/** 圆形仪表：黄铜表圈 + 暗色表盘 + 刻度；指针交给动效层。 */
export function GaugeFace({ kit, cx, cy, r }: { kit: Kit; cx: number; cy: number; r: number }) {
  const ticks = Array.from({ length: 9 }, (_, index) => -135 + index * 33.75);
  return <g>
    <circle cx={cx} cy={cy} r={r + 2} fill={kit.url("brassV")} stroke={INK} strokeWidth={1} />
    <circle cx={cx} cy={cy} r={r} fill="#0d1a1b" stroke={INK} strokeWidth={0.8} />
    {ticks.map((angle) => {
      const rad = (angle - 90) * Math.PI / 180;
      return <line key={angle}
        x1={cx + Math.cos(rad) * r * 0.72} y1={cy + Math.sin(rad) * r * 0.72}
        x2={cx + Math.cos(rad) * r * 0.9} y2={cy + Math.sin(rad) * r * 0.9}
        stroke={angle > 60 ? "#ff6a5a" : "#9fd9d2"} strokeWidth={0.8} />;
    })}
    <path d={`M${cx - r * 0.7} ${cy - r * 0.2} A${r * 0.75} ${r * 0.75} 0 0 1 ${cx + r * 0.2} ${cy - r * 0.72}`} fill="none" stroke="#fff" strokeWidth={0.8} opacity={0.18} />
  </g>;
}

/** 屏幕底：黑色边框 + 屏面 + 扫描线。 */
export function ScreenBase({ kit, x, y, w, h, r = 1.5, bezel = 2.5 }: Box & { kit: Kit; bezel?: number }) {
  return <g>
    <rect x={x - bezel} y={y - bezel} width={w + bezel * 2} height={h + bezel * 2} rx={r + 1} fill={STEEL.s0} stroke={INK} strokeWidth={1.2} />
    <rect x={x} y={y} width={w} height={h} rx={r} fill={kit.url("screen")} />
    <rect x={x} y={y} width={w} height={h} rx={r} fill={kit.url("scanlines")} opacity={0.5} />
  </g>;
}

/** 地面支脚：黄铜底环 + 暗色脚墩。 */
export function Foot({ kit, x, y, w, h = 6 }: { kit: Kit; x: number; y: number; w: number; h?: number }) {
  return <g>
    <rect x={x} y={y} width={w} height={h} rx={1} fill={kit.url("steelDarkV")} stroke={INK} strokeWidth={1.1} />
    <rect x={x + 1} y={y - 1.5} width={w - 2} height={2} rx={1} fill={kit.url("brassV")} stroke={INK} strokeWidth={0.6} />
  </g>;
}

/** 贴地接触阴影。 */
export function GroundShadow({ cx, cy, rx, ry = 5 }: { cx: number; cy: number; rx: number; ry?: number }) {
  return <g>
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#000" opacity={0.35} />
    <ellipse cx={cx} cy={cy} rx={rx * 0.8} ry={ry * 0.6} fill="#000" opacity={0.4} />
  </g>;
}

/** 锈迹流痕。 */
export function Drip({ x, y, length, width = 2.4, color = "#6d3a1f", opacity = 0.55 }: { x: number; y: number; length: number; width?: number; color?: string; opacity?: number }) {
  const w = width / 2;
  return <path d={`M${x - w} ${y} Q${x - w * 0.5} ${y + length * 0.65} ${x} ${y + length} Q${x + w * 0.5} ${y + length * 0.65} ${x + w} ${y} Z`} fill={color} opacity={opacity} />;
}

/** 苔藓团：暗绿底 + 亮绿颗粒 + 垂挂的细藤，呼应近景植物与神龛的荒废感。 */
export function Moss({ x, y, scale = 1, hang = 0 }: { x: number; y: number; scale?: number; hang?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    {hang > 0 && <path d={`M-4 0 Q-6 ${hang * 0.5} -3 ${hang} M5 0 Q7 ${hang * 0.4} 4 ${hang * 0.7}`} fill="none" stroke="#4d6b2e" strokeWidth={1} strokeLinecap="round" />}
    <path d="M-15 1 Q-14 -5 -8 -5 Q-6 -10 0 -9 Q5 -12 9 -7 Q15 -7 15 1 Z" fill="#34491f" stroke={INK} strokeWidth={0.9} />
    <path d="M-12 -1 Q-10 -5 -6 -4 Q-3 -8 2 -7 Q6 -9 9 -5" fill="none" stroke="#6f8f3c" strokeWidth={2.2} strokeLinecap="round" />
    {[[-9, -4], [-3, -7], [3, -8], [8, -5], [-6, -1], [5, -2]].map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={1} fill="#a9c865" />)}
  </g>;
}
