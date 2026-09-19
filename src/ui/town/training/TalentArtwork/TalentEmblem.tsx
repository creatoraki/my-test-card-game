import { useId } from "react";

// 中央与标题共用的四向星芒徽记，原型为金属罗盘和菱形宝石。
export function TalentEmblem({ size = 184, className }: { size?: number; className?: string }) {
  const id = useId();
  return (
    <svg className={className} width={size} height={size} viewBox="-100 -100 200 200" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={id}><stop stopColor="#a37439" /><stop offset=".28" stopColor="#fff0bd" />
          <stop offset=".5" stopColor="#b07a37" /><stop offset=".72" stopColor="#ffe6ac" /><stop offset="1" stopColor="#8a5b27" /></linearGradient>
        <radialGradient id={id + "-body"}><stop stopColor="#705025" /><stop offset=".6" stopColor="#2e2319" />
          <stop offset="1" stopColor="#0b1015" /></radialGradient>
        <filter id={id + "-glow"} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3" /></filter>
      </defs>
      <circle r="87" fill="#080c11" fillOpacity=".86" stroke={`url(#${id})`} strokeWidth="2" />
      <circle r="79" stroke="#e5c17c" strokeWidth="1" strokeDasharray="37 6 3 6" />
      <circle r="70" fill={`url(#${id}-body)`} stroke={`url(#${id})`} strokeWidth="3" />
      <circle r="62" stroke="#f2d99d" strokeWidth=".8" />
      <circle r="92" stroke="#ad803e" strokeWidth=".7" />
      {[0, 90, 180, 270].map((angle) => <g key={angle} transform={`rotate(${angle})`} stroke={`url(#${id})`}>
        <path d="M-15-85 0-99 15-85 0-71Z" fill="#3c2a19" strokeWidth="2" />
        <path d="M0-96 5-85 0-76-5-85Z" fill="#fff0bc" strokeWidth=".8" />
        <path d="m-27-81 12-11h30l12 11M0-70v8" strokeWidth="1" />
      </g>)}
      {Array.from({ length: 16 }, (_, i) => <path key={i} d="M0-77v6" transform={`rotate(${i * 22.5})`}
        stroke="#eed79c" strokeWidth={i % 2 ? ".7" : "1.2"} />)}
      <g stroke="#ffce78" strokeWidth="5" filter={`url(#${id}-glow)`}>
        <path d="M0-43 13-16 34 0 13 15 0 43-13 15-34 0-13-16Z" />
      </g>
      <g stroke="#fff3cd" strokeWidth="2.5">
        <path d="M0-43 13-16 34 0 13 15 0 43-13 15-34 0-13-16Z" />
        <path d="M0-26 23 0 0 26-23 0ZM0-43v17M34 0H23M0 43V26M-34 0h11" />
        <path d="m0-8 7 8-7 8-7-8Z" fill="#fff0c2" />
        <path d="m-23-33 2 13M23-33l-2 13M-23 33l2-13M23 33l-2-13" strokeWidth="1.4" />
      </g>
    </svg>
  );
}
