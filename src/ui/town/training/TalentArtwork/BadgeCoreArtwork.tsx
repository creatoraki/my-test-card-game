import { useId } from "react";
import { TalentEmblem } from "./TalentEmblem";

/** 启程复用星盘中央原图；其余基础徽章使用参考图的爆发与循环纹样。 */
export function BadgeCoreArtwork({ badgeId, size = 100, className }: { badgeId: string; size?: number; className?: string }) {
  const id = useId();
  if (badgeId === "voyage") return <TalentEmblem size={size} className={className} />;
  const cycle = badgeId === "clockwork";
  const hue = cycle ? "#49cfff" : "#ff7167";
  const light = cycle ? "#c5f7ff" : "#ffd6c5";
  return <svg className={className} width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
    <defs>
      <radialGradient id={`${id}-background`}><stop stopColor={hue} stopOpacity=".15" /><stop offset="1" stopColor="#050d14" /></radialGradient>
      <linearGradient id={`${id}-light`} x2=".3" y2="1"><stop stopColor={light} /><stop offset=".55" stopColor={hue} /><stop offset="1" stopColor={light} /></linearGradient>
      <filter id={`${id}-glow`} x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.5" /></filter>
      <g id={`${id}-glyph`}>
        {cycle ? <g fill={`url(#${id}-light)`}>
          <path d="M27 47C25 29 44 17 60 24l5-8-2 25-19-9 9-2C40 27 31 34 27 47Z" />
          <path d="M73 53c2 18-17 30-33 23l-5 8 2-25 19 9-9 2c13 3 22-4 26-17Z" />
        </g> : <g stroke={`url(#${id}-light)`} strokeWidth="2.8" strokeLinejoin="miter">
          <path d="M50 15 62 43 58 57 69 43 68 55 80 66 64 70 50 88 36 70 20 66 32 55 31 43 42 57 38 43Z" fill="#641e2133" />
          <path d="M50 18v66M39 38l11 46 11-46M26 64l24 20 24-20M32 55l18 29 18-29" />
        </g>}
      </g>
    </defs>
    <circle cx="50" cy="50" r="46" fill={`url(#${id}-background)`} stroke={hue} strokeWidth="1.3" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => <path key={angle} d="m50 2 2 2-2 3-2-3Z"
      transform={`rotate(${angle} 50 50)`} fill="#112328" stroke={hue} strokeWidth=".7" />)}
    <use href={`#${id}-glyph`} filter={`url(#${id}-glow)`} opacity=".85" />
    <use href={`#${id}-glyph`} />
  </svg>;
}
