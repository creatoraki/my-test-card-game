import { useId } from "react";
import {
  ARCS,
  CORNER_MARKS,
  MOTES,
  NODES,
} from "./victoryBackdropGeometry";
import s from "./VictoryBackdrop.module.css";

export function VictoryBackdrop() {
  const uid = useId();
  const dotPatternId = `victoryBackdropDots-${uid}`;
  const topLightId = `victoryBackdropTopLight-${uid}`;
  const readoutShadeId = `victoryBackdropReadout-${uid}`;
  const settleId = `victoryBackdropSettle-${uid}`;
  const nodeGlowId = `victoryBackdropNodeGlow-${uid}`;
  const cornerGlowId = `victoryBackdropCornerGlow-${uid}`;

  return (
    <svg className={s.backdrop} viewBox="0 0 1360 1030" aria-hidden="true" focusable="false">
      <defs>
        <pattern id={dotPatternId} width="34" height="34" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.9" fill="currentColor" opacity="0.05" />
        </pattern>
        <radialGradient id={topLightId} cx="50%" cy="0%" r="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
          <stop offset="58%" stopColor="currentColor" stopOpacity="0.035" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={readoutShadeId} gradientUnits="userSpaceOnUse" cx="680" cy="560" r="720">
          <stop offset="0%" stopColor="#05090b" stopOpacity="0.34" />
          <stop offset="62%" stopColor="#05090b" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#05090b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={settleId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#05090b" stopOpacity="0.08" />
          <stop offset="42%" stopColor="#05090b" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#05090b" stopOpacity="0.94" />
        </linearGradient>
        <filter id={nodeGlowId} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={cornerGlowId} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="60" />
        </filter>
      </defs>

      <rect className={s.dotField} x="0" y="0" width="1360" height="1030" fill={`url(#${dotPatternId})`} />
      <ellipse className={s.topLight} cx="680" cy="0" rx="430" ry="450" fill={`url(#${topLightId})`} />

      <g className={s.arcField}>
        {ARCS.map(([d, tone, opacity, strokeWidth]) => (
          <path
            key={d}
            className={`${s.arc} ${tone === 1 ? s.toneAlt : ""}`}
            d={d}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            opacity={opacity}
          />
        ))}
      </g>

      <g className={s.nodes} filter={`url(#${nodeGlowId})`}>
        {NODES.map(([cx, cy, r, tone], index) => (
          <g key={`${cx}-${cy}`} className={`${s.node} ${tone === 1 ? s.toneAlt : ""}`} style={{ animationDelay: `${index * 0.38}s` }}>
            {index % 3 === 1 ? (
              <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} fill="currentColor" transform={`rotate(45 ${cx} ${cy})`} />
            ) : (
              <circle cx={cx} cy={cy} r={r} fill="currentColor" />
            )}
          </g>
        ))}
      </g>

      <path className={s.trace} d={ARCS[1][0]} pathLength="1" stroke="currentColor" />
      <path className={`${s.trace} ${s.toneAlt}`} d={ARCS[3][0]} pathLength="1" stroke="currentColor" />

      <rect className={s.readoutShade} x="80" y="280" width="1200" height="610" fill={`url(#${readoutShadeId})`} />
      <g className={s.cornerGlows}>
        <ellipse cx="0" cy="0" rx="230" ry="180" fill="currentColor" opacity="0.18" filter={`url(#${cornerGlowId})`} />
        <ellipse className={s.toneAlt} cx="1360" cy="1030" rx="230" ry="180" fill="currentColor" opacity="0.18" filter={`url(#${cornerGlowId})`} />
      </g>
      <g className={s.cornerMarks}>
        {CORNER_MARKS.map(([d, tone]) => (
          <path key={d} className={tone === 1 ? s.toneAlt : ""} d={d} />
        ))}
      </g>
      <g className={s.motes}>
        {MOTES.map(([cx, cy, r]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill="currentColor" opacity="0.5" />
        ))}
      </g>

      <rect className={s.settleShade} x="0" y="760" width="1360" height="270" fill={`url(#${settleId})`} />
    </svg>
  );
}