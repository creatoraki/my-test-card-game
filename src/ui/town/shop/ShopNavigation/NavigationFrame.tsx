import { useId } from "react";
import s from "./NavigationFrame.module.css";

// 原图牌面 205×96，折线、高光断口和蜂窝共用原始像素坐标。
const outline = "M2 12 12 2H185L202 18V77L185 94H13L2 83Z";

export function NavigationFrame() {
  const id = useId();
  const ref = (name: string) => `url(#${id}-${name})`;
  return (
    <svg className={s.frame} viewBox="0 0 205 96" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="205" y2="96" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--plate-start)" /><stop offset=".45" stopColor="var(--plate-middle)" /><stop offset="1" stopColor="var(--plate-end)" />
        </linearGradient>
        <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="192" y2="96" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--edge-hot)" /><stop offset=".22" stopColor="var(--edge-dim)" /><stop offset=".62" stopColor="var(--edge-mid)" /><stop offset=".82" stopColor="var(--edge-hot)" /><stop offset="1" stopColor="var(--edge-mid)" />
        </linearGradient>
        <radialGradient id={`${id}-wash`} cx="1" cy=".55" r=".85">
          <stop stopColor="var(--edge-mid)" stopOpacity=".2" /><stop offset="1" stopColor="var(--edge-mid)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-fade`}><stop offset=".48" stopColor="black" /><stop offset=".78" stopColor="#aaa" /><stop offset="1" stopColor="white" /></linearGradient>
        <pattern id={`${id}-hex`} width="7" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(22)">
          <path d="M0 2 3.5 0 7 2V6L3.5 8 0 6ZM0 6v4l3.5 2L7 10V6" stroke="var(--edge-mid)" strokeWidth=".7" opacity=".34" />
        </pattern>
        <mask id={`${id}-mask`}><path d={outline} fill={ref("fade")} /></mask>
        <radialGradient id={`${id}-flare`}>
          <stop stopColor="#fffce6" stopOpacity=".9" />
          <stop offset=".16" stopColor="var(--edge-hot)" stopOpacity=".6" />
          <stop offset=".48" stopColor="var(--edge-mid)" stopOpacity=".16" />
          <stop offset="1" stopColor="var(--edge-mid)" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-glow`} x="-30%" y="-50%" width="160%" height="200%"><feGaussianBlur stdDeviation="2.2" /></filter>
      </defs>
      <path d={outline} fill={ref("body")} />
      <path d={outline} fill={ref("wash")} />
      <path d={outline} fill={ref("hex")} mask={ref("mask")} />
      <path d="M15 7H181L195 21M15 87H179L194 72" stroke="var(--edge-mid)" opacity=".18" strokeWidth="5" />
      <path d={outline} stroke="var(--edge-mid)" strokeWidth="3" filter={ref("glow")} opacity=".7" />
      <path d={outline} stroke={ref("edge")} strokeWidth="1.6" />
      <path d="M8 29V14L18 5H182L197 20V73L181 89H17L7 79V45" stroke={ref("edge")} strokeWidth=".8" opacity=".8" />
      <path d="M1 31V12L7 6H32M50 1H120M159 1H185L201 17V33M202 55V76L185 93M14 95H72" stroke="var(--edge-hot)" strokeWidth="1.8" />
      <path d="M3 33V72M5 12V24M8 16 16 8H23M9 79 18 88M186 8 197 19M196 74 183 87" stroke="var(--edge-hot)" strokeWidth="2.6" />
      <path d="M0 13V29M0 42V59M204 21V39M204 62V72" stroke="var(--edge-mid)" strokeWidth="3" />
      <path d="M24 4H30L33 6H45M55 4H60M92 2H100L102 4H116M157 3H169M24 92H32L34 90H43L46 93H56M170 92H178M200 43V51" stroke="var(--edge-hot)" strokeWidth=".7" opacity=".65" />
      <path d="M1 30V40M202 23V29M190 85 185 90" stroke="#fffde0" strokeWidth="2" opacity=".9" />
      <g className={s.flares}>
        <ellipse cx="4" cy="29" rx="19" ry="35" fill={ref("flare")} />
        <ellipse cx="195" cy="20" rx="25" ry="19" fill={ref("flare")} />
        <ellipse cx="187" cy="88" rx="31" ry="17" fill={ref("flare")} />
        <path d="M3 18V58M183 3l17 16v11M199 69v8l-15 16h-26" stroke="var(--edge-hot)" strokeWidth="3" filter={ref("glow")} />
      </g>
      <path d="m181 41 7 8-7 8" stroke="var(--tab-arrow)" strokeWidth="2" />
    </svg>
  );
}
