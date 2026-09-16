import { useId } from "react";
import s from "./ShopBack.module.css";

// 颜色全部走 --back-* 变量, 默认值即商店的青色原貌; 换皮场景(研究中心)只覆盖变量。
export function ShopBack({ onClick }: { onClick: () => void }) {
  const id = useId();
  const outline = "M14 0H192L198 6V58L184 72H6L0 66V14Z";
  const innerOutline = "M21 7H185L191 13V51L177 65H21L7 59V21Z";
  return (
    <button className={s.back} type="button" onClick={onClick}>
      <svg className={s.frame} viewBox="0 0 198 72" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-body`} x2=".8" y2="1">
            <stop stopColor="var(--back-body-start, #153d46)" stopOpacity=".94" />
            <stop offset=".5" stopColor="var(--back-body-middle, #06151c)" stopOpacity=".97" />
            <stop offset="1" stopColor="var(--back-body-end, #102b35)" stopOpacity=".95" />
          </linearGradient>
          <linearGradient id={`${id}-edge`}>
            <stop stopColor="var(--back-edge-hot, #7ffff7)" /><stop offset=".45" stopColor="var(--back-edge-mid, #27929d)" />
            <stop offset=".8" stopColor="var(--back-edge-lit, #b7ffff)" /><stop offset="1" stopColor="var(--back-edge-end, #40bdcf)" />
          </linearGradient>
          <pattern id={`${id}-grid`} width="7" height="7" patternUnits="userSpaceOnUse">
            <path d="M0 0h7v7" stroke="var(--back-grid, #79d9de)" strokeWidth=".4" opacity=".12" />
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
        <path d="M5 29V43M17 54l8 7h19M123 6h43l14 14M186 30v7M178 53l-8 8" stroke="var(--back-spark, #b7fffc)" strokeWidth="2" />
        <path d="M22 17h6m4-2h6m4-2h5M19 57l5 5M59 65h35M181 24h5M180 55v5" stroke="var(--back-tick, #55e6e7)" />
        <path d="m43 25-11 10 11 10m-13-20L19 35l11 10" stroke="var(--back-arrow, #6ffff9)" strokeWidth="3" strokeLinejoin="miter" transform="translate(5 0)" />
      </svg>
      <span className={s.label}>返回据点</span>
    </button>
  );
}
