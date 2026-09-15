import { useId } from "react";
import s from "./TalentBorder.module.css";

function Corner() {
  return <g fill="none">
    <path d="M0 71V21L10 4h29M4 52V22L18 8h42M9 35V16L29 7h31" stroke="#bd8b43" strokeWidth="2" />
    <path d="m4 8 8-6 9 5 13-4-6 15-13 4-6 14 1-17Z" fill="#47311a" stroke="#ffe5a6" strokeWidth="1.4" />
    <path d="m12 1 4 13 14-7-8 14-9-6-6 16 1-18Z" stroke="#ffda88" strokeWidth="1.2" />
    <path d="m5 9 7 7 8-5-5 12-9 4M26 20l-7 13-12 7M24 5l9 3 9-4" stroke="#fff4d0" strokeWidth="1" />
    <path d="m17 13 2 5-5 3-2-5Z" fill="#fff4ca" stroke="#ffda88" />
    <path d="M3 39v22M40 4h31" stroke="#fff0bd" strokeWidth="1" />
  </g>;
}
function Diamond() {
  return <g stroke="#ffdf9e" fill="#4e351b">
    <path d="m0-14 9 14-9 14-9-14Z" strokeWidth="1.4" />
    <path d="M0-10 3 0 0 10-3 0Z" fill="#fff3d0" strokeWidth=".6" />
    <path d="M-35 0h19l6-5M35 0H16l-6-5M-26 0l8 5 6-5M26 0l-8 5-6-5" fill="none" />
  </g>;
}
export function TalentBorder() {
  const id = useId();
  return (
    <svg className={s.frame} viewBox="0 0 1672 941" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1672" y2="941" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e8c57b" /><stop offset=".2" stopColor="#926d38" /><stop offset=".48" stopColor="#ffe9b4" />
          <stop offset=".7" stopColor="#8e602e" /><stop offset="1" stopColor="#ffdfa0" />
        </linearGradient>
        <filter id={id + "-light"} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.5" /></filter>
      </defs>
      <path d="M35 13H1638L1660 35V903L1641 927H33L12 905V34Z" stroke={`url(#${id})`} strokeWidth="1.8" />
      <path d="M20 64V881M1653 64V881M62 20H1610M62 919H1610" stroke="#d7b06a" strokeOpacity=".36" strokeWidth=".8" />
      <path d="M12 72v323M12 473v389M1660 72v323M1660 473v389M82 928h684M905 928h684"
        stroke="#65caff" strokeWidth="3" filter={`url(#${id}-light)`} opacity=".75" />
      <path d="M12 83v254M1660 83v254M72 928h335M1250 928h342" stroke="#d1efff" strokeWidth="1.4" />
      <g transform="translate(8 9)"><Corner /></g>
      <g transform="translate(1664 9) scale(-1 1)"><Corner /></g>
      <g transform="translate(8 932) scale(1 -1)"><Corner /></g>
      <g transform="translate(1664 932) scale(-1 -1)"><Corner /></g>
      <g transform="translate(836 15)"><Diamond /></g>
      <g transform="translate(836 922)"><Diamond /></g>
      <g transform="translate(12 437)"><Diamond /></g>
      <g transform="translate(1660 437)"><Diamond /></g>
      <path d="M76 97v222M76 347v27M1595 105v35M1595 179v264M1595 492v94"
        stroke={`url(#${id})`} strokeWidth="1.2" />
      <g transform="translate(76 333) scale(.65)"><Diamond /></g>
      <g transform="translate(1595 160) scale(.72)"><Diamond /></g>
      <g transform="translate(1595 477) scale(.72)"><Diamond /></g>
      {[126, 744, 817].map(y => <g key={y} fill="#fff5cf">
        <circle cx="12" cy={y} r="2" /><circle cx="1660" cy={y} r="2" />
      </g>)}
    </svg>
  );
}
