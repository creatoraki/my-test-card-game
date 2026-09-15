import { useId } from "react";
import s from "./ShopBrand.module.css";

export function ShopBrand() {
  const id = useId();
  return (
    <div className={s.brand}>
      <svg viewBox="0 0 210 74" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-fill`} x1="10" y1="10" x2="157" y2="66" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4d3b25" stopOpacity=".94" /><stop offset=".55" stopColor="#221f19" stopOpacity=".94" /><stop offset="1" stopColor="#43351d" stopOpacity=".8" />
          </linearGradient>
          <linearGradient id={`${id}-line`}><stop stopColor="#fff0a0" /><stop offset=".6" stopColor="#ba9448" /><stop offset="1" stopColor="#ffe48a" /></linearGradient>
          <filter id={`${id}-glow`} x="-30%" y="-50%" width="160%" height="200%"><feGaussianBlur stdDeviation="2.2" /></filter>
        </defs>
        <path d="M9 20 22 8H147L165 25 128 64H15L8 57Z" fill={`url(#${id}-fill)`} />
        <g stroke={`url(#${id}-line)`}>
          <path d="M9 20 22 8H147L165 25 128 64H15L8 57Z" strokeWidth="3" filter={`url(#${id}-glow)`} />
          <path d="M9 20 22 8H147L165 25 128 64H15L8 57Z" strokeWidth="1.5" />
          <path d="M5 28V18L20 4H46M5 51V65L14 68H39M49 67H131L172 25 166 19" strokeWidth="1.5" />
          <path d="M14 23 26 12H78M88 11H99L103 13H118M17 60H58M146 21l8 7-24 25M108 60h4m3 0h4m3 0h4" strokeWidth=".8" />
        </g>
        <path d="m177 20 6 7-26 28h-8l27-28-6-7Z" fill="#ffe295" />
        <path d="m190 21 7 7-25 27h-7l25-27-6-7Z" fill="#d6b871" opacity=".52" />
        <path d="m202 23 6 6-24 26h-7l25-26-6-6Z" fill="#aa9568" opacity=".23" />
        <path d="M3 26V50M22 4H46" stroke="#ffe8a0" strokeWidth="2" />
      </svg>
      <strong>商店</strong>
    </div>
  );
}
