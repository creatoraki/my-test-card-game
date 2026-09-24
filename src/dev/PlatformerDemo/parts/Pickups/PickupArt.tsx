import type { PickupKind } from "../../types";
import { GLOW_FILTER, INK, PALETTE, outline } from "../shared/artStyle";
import motion from "../shared/artMotion.module.css";

// 五种物件统一规则：结构体(象牙/深青) + 装饰(铜管/藤蔓/灯带取其二) + 发光核心。
// 坐标以底边中心为原点，向上为负，整体约 100×100。
const LINE = outline();
const THIN = outline(2);
const P = PALETTE;

function Leaf({ x, y, angle, scale = 1 }: { x: number; y: number; angle: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}>
      <ellipse cx={8} cy={0} rx={9} ry={4.5} fill={P.leafShade} {...THIN} />
      <ellipse cx={7} cy={-1} rx={6} ry={2.6} fill={P.leaf} />
    </g>
  );
}

function SeedPod() {
  return (
    <g>
      <path d="M-30 0 L30 0 L24 -16 L-24 -16 Z" fill={P.ivory} {...LINE} />
      <path d="M6 -16 L24 -16 L30 0 L6 0 Z" fill={P.ivoryShade} />
      <rect x={-14} y={-10} width={28} height={4} rx={2} fill={P.cyan} filter={GLOW_FILTER} />
      <path d="M26 -8 Q40 -8 40 -30 L40 -62 Q40 -70 30 -70" fill="none" stroke={INK} strokeWidth={10} strokeLinecap="round" />
      <path d="M26 -8 Q40 -8 40 -30 L40 -62 Q40 -70 30 -70" fill="none" stroke={P.copper} strokeWidth={5} strokeLinecap="round" />
      <rect x={-22} y={-84} width={44} height={70} rx={20} fill="#bfeff5" opacity={0.7} {...LINE} />
      <ellipse cx={0} cy={-46} rx={11} ry={15} fill="#e6c55a" filter={GLOW_FILTER} className={motion.pulse} />
      <ellipse cx={0} cy={-46} rx={9} ry={13} fill="#f3d86e" {...THIN} />
      <path d="M0 -58 Q-2 -66 -8 -68 M0 -58 Q4 -66 10 -66" fill="none" stroke={P.leaf} strokeWidth={3} strokeLinecap="round" />
      <path d="M-14 -76 L-14 -26" stroke="#ffffff" strokeWidth={4} strokeLinecap="round" opacity={0.8} />
      <rect x={-26} y={-92} width={52} height={12} rx={5} fill={P.teal} {...LINE} />
      <rect x={-26} y={-20} width={52} height={8} rx={4} fill={P.teal} {...LINE} />
      <rect x={-8} y={-89} width={16} height={4} rx={2} fill={P.cyan} />
      <Leaf x={-24} y={-26} angle={200} />
      <Leaf x={-22} y={-44} angle={160} scale={0.8} />
    </g>
  );
}

function DewFlask() {
  return (
    <g>
      <path d="M-22 -70 Q-44 -64 -40 -40 Q-36 -24 -24 -24" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
      <path d="M-22 -70 Q-44 -64 -40 -40 Q-36 -24 -24 -24" fill="none" stroke={P.copper} strokeWidth={4} strokeLinecap="round" />
      <path d="M-12 -80 L-12 -60 Q-34 -50 -30 -22 Q-26 0 0 0 Q26 0 30 -22 Q34 -50 12 -60 L12 -80 Z" fill="#d9f5fb" opacity={0.85} {...LINE} />
      <path d="M-27 -30 Q-24 -4 0 -4 Q24 -4 27 -30 Q14 -36 0 -30 Q-14 -24 -27 -30 Z" fill="#6fd0ef" />
      <path d="M-26 -30 Q-14 -24 0 -30 Q14 -36 27 -30" fill="none" stroke="#ffffff" strokeWidth={2.5} />
      <path d="M0 -58 C-9 -45 -9 -38 0 -36 C9 -38 9 -45 0 -58 Z" fill="#8fe8ff" filter={GLOW_FILTER} className={motion.pulse} />
      <path d="M0 -55 C-6 -45 -6 -40 0 -39 C6 -40 6 -45 0 -55 Z" fill="#ffffff" />
      <path d="M-20 -46 Q-22 -30 -16 -18" fill="none" stroke="#ffffff" strokeWidth={4} strokeLinecap="round" opacity={0.85} />
      <rect x={-16} y={-94} width={32} height={16} rx={4} fill={P.ivory} {...LINE} />
      <rect x={2} y={-92} width={12} height={12} fill={P.ivoryShade} />
      <rect x={-16} y={-84} width={32} height={5} fill={P.teal} />
      <Leaf x={12} y={-90} angle={-30} />
      <Leaf x={14} y={-86} angle={20} scale={0.8} />
    </g>
  );
}

function Mushroom({ x, h, r, cap, tilt }: { x: number; h: number; r: number; cap: string; tilt: number }) {
  return (
    <g transform={`translate(${x} -14) rotate(${tilt})`}>
      <path d={`M-5 0 Q-7 ${-h / 2} -4 ${-h} L4 ${-h} Q7 ${-h / 2} 5 0 Z`} fill={P.ivory} {...THIN} />
      <path d={`M${-r} ${-h + 2} Q${-r} ${-h - r * 1.1} 0 ${-h - r * 1.1} Q${r} ${-h - r * 1.1} ${r} ${-h + 2} Z`} fill={cap} filter={GLOW_FILTER} className={motion.pulse} />
      <path d={`M${-r} ${-h + 2} Q${-r} ${-h - r * 1.1} 0 ${-h - r * 1.1} Q${r} ${-h - r * 1.1} ${r} ${-h + 2} Z`} fill={cap} {...LINE} />
      <circle cx={-r * 0.35} cy={-h - r * 0.6} r={r * 0.18} fill="#ffffff" opacity={0.9} />
      <circle cx={r * 0.3} cy={-h - r * 0.35} r={r * 0.12} fill="#ffffff" opacity={0.7} />
    </g>
  );
}

function SporeLamp() {
  return (
    <g>
      <path d="M-38 0 Q-40 -20 -20 -22 Q0 -30 22 -22 Q40 -20 38 0 Z" fill={P.rock} {...LINE} />
      <path d="M4 -26 Q24 -24 34 -14 L38 0 L6 0 Z" fill={P.rockShade} />
      <path d="M-36 -8 Q-32 -24 -10 -24 Q10 -30 30 -20" fill="none" stroke={P.moss} strokeWidth={7} strokeLinecap="round" />
      <rect x={-30} y={-12} width={60} height={8} rx={4} fill={P.teal} {...THIN} />
      <rect x={-20} y={-10} width={40} height={4} rx={2} fill={P.cyan} filter={GLOW_FILTER} />
      <Mushroom x={-18} h={30} r={13} cap="#9fe86a" tilt={-12} />
      <Mushroom x={16} h={24} r={11} cap="#58e0d8" tilt={14} />
      <Mushroom x={0} h={46} r={17} cap="#c4f07a" tilt={0} />
      <Leaf x={-34} y={-10} angle={200} />
      <Leaf x={32} y={-12} angle={-20} scale={0.9} />
    </g>
  );
}

function GeneCase() {
  return (
    <g>
      <path d="M-26 -64 Q-26 -82 0 -82 Q26 -82 26 -64" fill="none" stroke={INK} strokeWidth={10} strokeLinecap="round" />
      <path d="M-26 -64 Q-26 -82 0 -82 Q26 -82 26 -64" fill="none" stroke={P.copper} strokeWidth={5} strokeLinecap="round" />
      <rect x={-40} y={-64} width={80} height={64} rx={8} fill={P.ivory} {...LINE} />
      <rect x={12} y={-62} width={26} height={60} rx={6} fill={P.ivoryShade} />
      <rect x={-40} y={-66} width={80} height={14} rx={6} fill={P.teal} {...LINE} />
      <rect x={-28} y={-46} width={44} height={34} rx={5} fill="#12343a" {...THIN} />
      <g filter={GLOW_FILTER} className={motion.pulse}>
        <path d="M-22 -40 C-14 -40 -10 -18 -2 -18 C6 -18 8 -40 12 -40" fill="none" stroke={P.cyan} strokeWidth={3} />
        <path d="M-22 -18 C-14 -18 -10 -40 -2 -40 C6 -40 8 -18 12 -18" fill="none" stroke="#f2c46b" strokeWidth={3} />
      </g>
      {[-18, -8, 2].map((x) => <line key={x} x1={x} y1={-36} x2={x} y2={-22} stroke="#ffffff" strokeWidth={2} opacity={0.7} />)}
      <circle cx={28} cy={-30} r={5} fill="#f2c46b" filter={GLOW_FILTER} />
      <rect x={20} y={-16} width={14} height={6} rx={3} fill={P.cyan} />
      <path d="M-40 -8 Q-50 -30 -38 -52" fill="none" stroke={P.leafShade} strokeWidth={3} />
      <Leaf x={-44} y={-24} angle={190} />
      <Leaf x={-40} y={-44} angle={210} scale={0.8} />
    </g>
  );
}

function BioCore() {
  return (
    <g>
      <path d="M-22 -20 L-40 -20 L-40 0" fill="none" stroke={INK} strokeWidth={10} strokeLinejoin="round" />
      <path d="M-22 -20 L-40 -20 L-40 0" fill="none" stroke={P.copper} strokeWidth={5} strokeLinejoin="round" />
      <path d="M22 -70 L40 -70 L40 0" fill="none" stroke={INK} strokeWidth={10} strokeLinejoin="round" />
      <path d="M22 -70 L40 -70 L40 0" fill="none" stroke={P.copper} strokeWidth={5} strokeLinejoin="round" />
      <rect x={-24} y={-84} width={48} height={70} rx={6} fill="#c9f3dc" opacity={0.75} {...LINE} />
      <rect x={-20} y={-60} width={40} height={42} fill="#58c98e" opacity={0.85} />
      <circle cx={0} cy={-48} r={12} fill="#aef7c9" filter={GLOW_FILTER} className={motion.pulse} />
      <circle cx={0} cy={-48} r={8} fill="#e9fff1" {...THIN} />
      {[[-12, -26, 3], [10, -34, 2.5], [-8, -66, 2], [12, -56, 3]].map(([x, y, r]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r={r} fill="#ffffff" opacity={0.85} />
      ))}
      <path d="M-16 -78 L-16 -24" stroke="#ffffff" strokeWidth={3.5} strokeLinecap="round" opacity={0.75} />
      <path d="M-32 0 L32 0 L28 -16 L-28 -16 Z" fill={P.teal} {...LINE} />
      <rect x={-18} y={-10} width={36} height={4} rx={2} fill={P.cyan} filter={GLOW_FILTER} />
      <path d="M-28 -84 L28 -84 L24 -96 L-24 -96 Z" fill={P.teal} {...LINE} />
      <rect x={-6} y={-94} width={12} height={6} rx={2} fill={P.ivory} />
    </g>
  );
}

const ART: Record<PickupKind, () => JSX.Element> = {
  seedPod: SeedPod,
  dewFlask: DewFlask,
  sporeLamp: SporeLamp,
  geneCase: GeneCase,
  bioCore: BioCore,
};

export function PickupArt({ kind }: { kind: PickupKind }) {
  const Art = ART[kind];
  return <Art />;
}

/** 独立小图标（背包格、飞入动画用），视窗与场景内物件一致。 */
export function PickupIcon({ kind, size }: { kind: PickupKind; size: number }) {
  return (
    <svg width={size} height={size} viewBox="-56 -104 112 112" aria-hidden style={{ display: "block", overflow: "visible" }}>
      <PickupArt kind={kind} />
    </svg>
  );
}
