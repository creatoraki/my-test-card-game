import { useId } from "react";

function Corner({ paint }: { paint: string }) {
  return <g fill="none" stroke={paint} strokeLinejoin="round">
    <path d="M0 74V24L9 7 24 0h53l-13 7H32L12 23 7 52Z" fill="#322514" strokeWidth="2" />
    <path d="m0 25 12-12L9 7l16 3L24 0l16 7 15-2-11 10-19 6-8 20L7 52l4-25Z" fill={paint} strokeWidth="1.4" />
    <path d="m10 14 8 3 7-7 5 8-12 12-4-9-7 18M26 12l11 2 8-6M15 33l11-10 14-4M7 51v20M51 7h24" stroke="#fff0bf" strokeWidth="1.2" />
    <path d="m15 12 3 9 12-4-10 13-8-4-5 16M31 5l8 7M3 26l5 12" stroke="#4d3517" strokeWidth="2" />
    <path d="M14 62V38L37 15h25M19 74V43L43 19h31" opacity=".24" />
    <path d="m20 19 4 5-5 5-4-5Z" fill="#fff5cf" />
  </g>;
}

function Jewel() {
  return <g stroke="#edc579" strokeWidth="1.2" fill="#392610">
    <path d="M0-19 6-6 15 0 6 6 0 19-6 6-15 0-6-6Z" />
    <path d="M0-13 3 0 0 13-3 0Z" fill="#fff2bf" />
    <path d="M-20 0h8M12 0h8" stroke="#fff2bf" />
  </g>;
}

export function BadgePanelFrame({ className }: { className?: string }) {
  const id = useId();
  const paint = `url(#${id})`;
  return <svg className={className} viewBox="0 0 530 888" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2=".85" y2="1">
        <stop stopColor="#fff0b9" /><stop offset=".15" stopColor="#9f732f" />
        <stop offset=".32" stopColor="#f9dc97" /><stop offset=".48" stopColor="#533e22" />
        <stop offset=".63" stopColor="#e7c17a" /><stop offset=".82" stopColor="#93672b" />
        <stop offset="1" stopColor="#ffe8ac" />
      </linearGradient>
    </defs>
    <path d="M33 13H497L515 31V857L497 875H33L15 857V31Z" stroke="#000" strokeWidth="9" />
    <path d="M33 13H497L515 31V857L497 875H33L15 857V31Z" stroke={paint} strokeWidth="4" />
    <path d="M34 18H496L510 33V855L495 870H35L20 855V33Z" stroke="#f6d590" strokeWidth=".8" />
    <path d="M38 23H492L505 37V851L491 865H39L25 851V37Z" stroke="#495554" strokeWidth="1.3" />
    <path d="M17 85v322M513 85v322M17 477v328M513 477v328" stroke="#9baaa4" strokeOpacity=".5" />
    <path d="M70 13h167M291 13h165M70 875h390" stroke="#ffeec3" />
    <g transform="translate(10 8)"><Corner paint={paint} /></g>
    <g transform="translate(520 8) scale(-1 1)"><Corner paint={paint} /></g>
    <g transform="translate(10 880) scale(1 -1)"><Corner paint={paint} /></g>
    <g transform="translate(520 880) scale(-1 -1)"><Corner paint={paint} /></g>
    <g transform="translate(265 14)"><Jewel /></g>
    <g transform="translate(16 434)"><Jewel /></g>
    <g transform="translate(514 434)"><Jewel /></g>
  </svg>;
}

export function BadgeRowFrame({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 418 140" preserveAspectRatio="none" fill="none" aria-hidden="true">
    <rect x="3" y="3" width="412" height="134" rx="10" stroke="currentColor" />
    {[[4, 4, 1, 1], [414, 4, -1, 1], [4, 136, 1, -1], [414, 136, -1, -1]].map(([x, y, sx, sy]) =>
      <g key={`${x}-${y}`} transform={`translate(${x} ${y}) scale(${sx} ${sy})`} stroke="currentColor">
        <path d="M0 32V10Q0 0 10 0h30M3 28 8 13 23 5 35 3M5 22l11-5 5-11M8 10l7 2-3-7M17 3l6 5 7-5M3 17l5 5-5 7" />
        <path d="m8 7 5 1-4 5Z" fill="currentColor" />
      </g>)}
  </svg>;
}
