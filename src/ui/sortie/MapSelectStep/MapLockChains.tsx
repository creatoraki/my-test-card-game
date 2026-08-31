import { useId } from "react";
import s from "./MapLockChains.module.css";
import { cx } from "@/ui/common/cx";

interface Props {
  reason: string;
  highlighted: boolean;
}

export function MapLockChains({ reason, highlighted }: Props) {
  const uid = useId().replace(/:/g, "");
  const chainPatternId = `map-lock-chain-${uid}`;
  const chainGradientId = `map-lock-gradient-${uid}`;
  const lockGradientId = `map-lock-body-${uid}`;

  return (
    <span className={cx(s.root, highlighted && s.highlighted)} aria-hidden="true">
      <svg className={s.art} viewBox="0 0 520 208" preserveAspectRatio="none">
        <defs>
          <linearGradient id={chainGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity=".85" />
            <stop offset=".34" stopColor="#52656b" />
            <stop offset="1" stopColor="#101a1d" stopOpacity=".96" />
          </linearGradient>
          <pattern id={chainPatternId} width="42" height="20" patternUnits="userSpaceOnUse">
            <g transform="translate(21 10) rotate(-18)">
              <ellipse rx="13" ry="6" fill="none" stroke="#101a1d" strokeWidth="8" />
              <ellipse rx="13" ry="6" fill="none" stroke={`url(#${chainGradientId})`} strokeWidth="4.4" />
              <path d="M-9-3C-5-6 4-6 9-3" fill="none" stroke="#ffffffcc" strokeWidth="1.1" />
            </g>
          </pattern>
          <linearGradient id={lockGradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#eafcff" />
            <stop offset=".3" stopColor="#64858a" />
            <stop offset="1" stopColor="#152326" />
          </linearGradient>
          <filter id={`map-lock-shadow-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity=".8" />
          </filter>
        </defs>
        <g className={s.chainLines}>
          <path d="M-40 248 560-40" stroke="#071013" strokeWidth="22" />
          <path d="M-40 248 560-40" stroke={`url(#${chainPatternId})`} strokeWidth="16" />
          <path d="M-40-40 560 248" stroke="#071013" strokeWidth="22" />
          <path d="M-40-40 560 248" stroke={`url(#${chainPatternId})`} strokeWidth="16" />
        </g>
        <g className={s.lock} filter={`url(#map-lock-shadow-${uid})`}>
          <path d="M239 104V87c0-15 9-25 21-25s21 10 21 25v17" fill="none" stroke="#101a1d" strokeWidth="11" />
          <path d="M239 104V87c0-15 9-25 21-25s21 10 21 25v17" fill="none" stroke={`url(#${chainGradientId})`} strokeWidth="6" />
          <rect x="226" y="96" width="68" height="48" rx="7" fill={`url(#${lockGradientId})`} stroke="#0b1417" strokeWidth="5" />
          <path d="M233 101h54" stroke="#ffffffcc" strokeWidth="2" />
          <circle cx="260" cy="119" r="6" fill="#101a1d" />
          <path d="M260 119v13" stroke="#101a1d" strokeWidth="4" strokeLinecap="round" />
        </g>
        <text className={s.reason} x="260" y="174" textAnchor="middle">{reason}</text>
      </svg>
    </span>
  );
}