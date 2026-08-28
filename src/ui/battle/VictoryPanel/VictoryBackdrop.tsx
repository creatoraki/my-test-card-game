import { useId } from "react";
import {
  ANTENNAS,
  BEACONS,
  FAR_SKYLINE,
  MID_SKYLINE,
  MOTES,
  NEAR_SKYLINE,
  RAIN,
  WINDOWS,
} from "./victoryBackdropGeometry";
import s from "./VictoryBackdrop.module.css";

export function VictoryBackdrop() {
  const uid = useId();
  const domeId = `victoryBackdropDome-${uid}`;
  const horizonId = `victoryBackdropHorizon-${uid}`;
  const settleId = `victoryBackdropSettle-${uid}`;
  const glowId = `victoryBackdropGlow-${uid}`;

  return (
    <svg className={s.backdrop} viewBox="0 0 1360 1030" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={domeId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.08" />
          <stop offset="48%" stopColor="currentColor" stopOpacity="0.035" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={horizonId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
          <stop offset="42%" stopColor="currentColor" stopOpacity="0.4" />
          <stop offset="58%" stopColor="currentColor" stopOpacity="0.4" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={settleId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#070c0f" stopOpacity="0" />
          <stop offset="42%" stopColor="#070c0f" stopOpacity="0.48" />
          <stop offset="100%" stopColor="#070c0f" stopOpacity="0.96" />
        </linearGradient>
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect className={s.domeGlow} x="0" y="0" width="1360" height="640" fill={`url(#${domeId})`} />
      <ellipse className={s.cloud} cx="280" cy="360" rx="260" ry="120" fill="currentColor" opacity="0.16" />
      <ellipse className={`${s.cloud} ${s.toneAlt}`} cx="1090" cy="420" rx="280" ry="130" fill="currentColor" opacity="0.16" />

      <path d={FAR_SKYLINE} fill="currentColor" opacity="0.14" />
      <rect className={s.horizonGlow} x="0" y="548" width="1360" height="168" fill={`url(#${horizonId})`} />
      <path className={s.midEdge} d={MID_SKYLINE} fill="#0a1013" stroke="currentColor" strokeWidth="1.4" />
      <path className={s.nearEdge} d={NEAR_SKYLINE} fill="#070c0f" stroke="currentColor" strokeWidth="1.8" />

      <g className={s.antennas} stroke="currentColor" strokeWidth="0.9">
        {ANTENNAS.map(([x, yTop, yBase]) => (
          <line key={`${x}-${yTop}`} x1={x} y1={yTop} x2={x} y2={yBase} />
        ))}
      </g>
      <g className={s.beacons} filter={`url(#${glowId})`}>
        {BEACONS.map(([cx, cy, r]) => (
          <circle key={`${cx}-${cy}`} className={s.beacon} cx={cx} cy={cy} r={r} fill="currentColor" />
        ))}
      </g>

      <g className={`${s.windows} ${s.windowsA}`} filter={`url(#${glowId})`}>
        {WINDOWS.filter(([, , , tone]) => tone === 0).map(([x, y, opacity]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="4" height="7" rx="0.5" fill="currentColor" opacity={opacity} />
        ))}
      </g>
      <g className={`${s.windows} ${s.windowsB} ${s.toneAlt}`} filter={`url(#${glowId})`}>
        {WINDOWS.filter(([, , , tone]) => tone === 1).map(([x, y, opacity]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="4" height="7" rx="0.5" fill="currentColor" opacity={opacity} />
        ))}
      </g>

      <g className={s.rain} stroke="currentColor" strokeWidth="0.8">
        {RAIN.map(([x1, y1, x2, y2]) => (
          <line key={`${x1}-${y1}`} x1={x1} y1={y1} x2={x2} y2={y2} />
        ))}
      </g>
      <g className={s.scanLine}>
        <line x1="24" y1="620" x2="1336" y2="620" stroke="currentColor" strokeWidth="1" />
      </g>
      <g className={s.motes}>
        {MOTES.map(([cx, cy, r]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill="currentColor" opacity="0.5" />
        ))}
      </g>

      <rect x="0" y="620" width="1360" height="410" fill={`url(#${settleId})`} />
    </svg>
  );
}