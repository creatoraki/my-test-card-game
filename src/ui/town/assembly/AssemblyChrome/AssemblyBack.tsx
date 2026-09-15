import { useId } from "react";
import s from "./AssemblyBack.module.css";

export function AssemblyBack({ onClick }: { onClick: () => void }) {
  const id = useId();
  const outline = "M14 0H192L198 6V58L184 72H6L0 66V14Z";
  const innerOutline = "M21 7H185L191 13V51L177 65H21L7 59V21Z";
  return (
    <button className={s.back} type="button" onClick={onClick}>
      <svg className={s.frame} viewBox="0 0 198 72" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-body`} x2=".8" y2="1">
            <stop stopColor="#4a1d55" stopOpacity=".94" />
            <stop offset=".5" stopColor="#160b22" stopOpacity=".97" />
            <stop offset="1" stopColor="#321342" stopOpacity=".95" />
          </linearGradient>
          <linearGradient id={`${id}-edge`}>
            <stop stopColor="#ffd8f6" />
            <stop offset=".45" stopColor="#b05cff" />
            <stop offset=".8" stopColor="#fff0fb" />
            <stop offset="1" stopColor="#ff5fc8" />
          </linearGradient>
          <pattern id={`${id}-grid`} width="7" height="7" patternUnits="userSpaceOnUse">
            <path d="M0 0h7v7" stroke="#d58cff" strokeWidth=".4" opacity=".12" />
          </pattern>
          <filter id={`${id}-glow`} x="-30%" y="-60%" width="160%" height="220%">
            <feGaussianBlur stdDeviation="2.4" />
          </filter>
        </defs>
        <path d={outline} fill={`url(#${id}-body)`} />
        <path d={outline} fill={`url(#${id}-grid)`} />
        <g stroke={`url(#${id}-edge)`}>
          <path d={outline} strokeWidth="3" filter={`url(#${id}-glow)`} />
          <path d={outline} strokeWidth="1.5" />
          <path d={innerOutline} />
          <path d="M6 20 20 6H89M103 2H188L196 10V39M2 54 20 70H113M135 70H181L196 55" strokeWidth="1.4" />
        </g>
        <path d="M5 29V43M17 54l8 7h19M123 6h43l14 14M186 30v7M178 53l-8 8" stroke="#ffe6fa" strokeWidth="2" />
        <path d="M22 17h6m4-2h6m4-2h5M19 57l5 5M59 65h35M181 24h5M180 55v5" stroke="#ff9de0" />
        <path d="m43 25-11 10 11 10m-13-20L19 35l11 10" stroke="#ff7bd3" strokeWidth="3" strokeLinejoin="miter" transform="translate(5 0)" />
      </svg>
      <span className={s.label}>返回据点</span>
    </button>
  );
}
