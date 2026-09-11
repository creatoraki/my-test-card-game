import { memo, useId } from "react";
import s from "./FigureFrame.module.css";

// 同一路径用低透明宽线和亮色细线叠出辉光，无 SVG 滤镜或持续动画。
const OUTLINE = "M22 5H404L429 27V745L407 767H22L5 750V22Z";
const ACCENTS = "M5 158V22L22 5H114 M183 5H245 M369 5l14 14h38 M429 48v136 M5 354v52l17-20v-75 M429 686v59l-22 22h-67 M103 767H22L5 750v-87";

export const FigureFrame = memo(function FigureFrame() {
  const id = useId();
  return (
    <svg className={s.frame} viewBox="0 0 434 772" preserveAspectRatio="none" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="434" y2="772" gradientUnits="userSpaceOnUse">
          <stop stopColor="#d7eaff" />
          <stop offset=".24" stopColor="#71beff" />
          <stop offset=".5" stopColor="#9c78ff" />
          <stop offset=".72" stopColor="#68d9ff" />
          <stop offset="1" stopColor="#c5a0ff" />
        </linearGradient>
      </defs>
      <path d={OUTLINE} stroke="#7192ff" strokeWidth="10" opacity=".1" />
      <path d={OUTLINE} stroke="#83b4ff" strokeWidth="5" opacity=".19" />
      <path d={OUTLINE} stroke={`url(#${id})`} strokeWidth="1.5" />
      <path d="M26 13H400L420 32V740L402 758H27L14 745V27Z" stroke="#83b6ff" opacity=".3" />
      <path d={ACCENTS} stroke="#8169ff" strokeWidth="9" opacity=".17" />
      <path d={ACCENTS} stroke={`url(#${id})`} strokeWidth="3" />
      <path d="M50 33h66M363 27h40" stroke="#b9d5ff" strokeWidth="2" />
      <path d="M41 7v44M316 7v79M25 441v67M404 392v91" stroke="#9bd0ff" opacity=".2" />
      <path d="m378 9 7 7h22l-7-7ZM9 391v14l10-12v-15Zm411 344-19 21h12l15-16v-14Z" fill="#b19aff" opacity=".85" />
    </svg>
  );
});
