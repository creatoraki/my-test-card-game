import { useId } from "react";
import { TrackIcon } from "../TalentTreeRadial/icons";
import s from "./TalentPlaque.module.css";

export function TalentPlaque({ name, branchId, count, total }: {
  name: string; branchId: string; count: number; total: number;
}) {
  const id = useId();
  const outline = "M-118 0-95-33H96L119 0 96 33H-96Z";
  return (
    <g className={s.plaque}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="var(--trr-deep)" stopOpacity=".6" /><stop offset=".42" stopColor="#030910" stopOpacity=".96" />
          <stop offset="1" stopColor="var(--trr-deep)" stopOpacity=".7" />
        </linearGradient>
      </defs>
      <path className={s.halo} d={outline} />
      <path d={outline} fill={`url(#${id})`} stroke="var(--trr-hue)" strokeWidth="1.4" />
      <path d="M-107-12-92-29H87M-106 13-93 29H81M92-28 108-10M91 29l17-17"
        stroke="#e7f3ff" strokeOpacity=".65" strokeWidth=".7" />
      <path d="M-114-8-124 0-114 8-118 0ZM114-8l10 8-10 8 4-8Z"
        stroke="var(--trr-hue)" strokeWidth="1.8" fill="#efffff" fillOpacity=".55" />
      <path d="M-91-34h20M77 34h13M-108-18l-5 7M111 10l-5 9"
        stroke="var(--trr-hue)" strokeWidth="2" />
      <circle cx="-58" cy="0" r="25" fill="#030c14" fillOpacity=".8" stroke="var(--trr-hue)" strokeOpacity=".7" />
      <g transform="translate(-80 -22) scale(.92)"><TrackIcon branchId={branchId} /></g>
      <text className={s.name} x="33" y="-4">{name}</text>
      <text className={s.count} x="33" y="21">{count} / {total}</text>
    </g>
  );
}
