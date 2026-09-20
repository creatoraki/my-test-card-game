import { useId } from "react";
import { BadgeRim } from "./BadgeRim";

// 中央与标题共用的四向星芒徽记，原型为金属罗盘和菱形宝石。
// ★ 外圈那套金属框已抽到 BadgeRim（金色 + compass 花样就是这里原本的画法，逐项照搬），
//   本文件只剩中心星芒；先手/守时经 BadgeCoreArtwork 复用同一套外框的另外两档配色与花样。
export function TalentEmblem({ size = 184, className }: { size?: number; className?: string }) {
  const id = useId();
  return (
    <svg className={className} width={size} height={size} viewBox="-100 -100 200 200" fill="none" aria-hidden="true">
      <defs>
        <filter id={id + "-glow"} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3" /></filter>
      </defs>
      <BadgeRim />
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
