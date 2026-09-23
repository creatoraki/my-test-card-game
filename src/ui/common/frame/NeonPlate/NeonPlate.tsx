import { useId } from "react";
import { cx } from "@/ui/common/shared/cx";
import { chamferPath, cornerAccentPath, type Chamfer } from "./plateGeometry";
import s from "./NeonPlate.module.css";

// 霓虹切角牌面：底色、边缘内光、外发光、主描边、内框线与切角高光。
// 颜色全部由 --plate-start / --plate-end / --edge-hot / --edge-mid / --edge-dim 下发。
interface Props {
  width: number;
  height: number;
  chamfer: Chamfer;
  /** 内框线距外框的距离。 */
  inset?: number;
  className?: string;
}

export function NeonPlate({ width: w, height: h, chamfer, inset = 5, className }: Props) {
  const id = useId();
  const ref = (name: string) => `url(#${id}-${name})`;
  const outline = chamferPath(w, h, chamfer, 1);
  const inner = chamferPath(w, h, chamfer, 1 + inset);
  const accent = cornerAccentPath(w, h, chamfer, 1, Math.min(16, h * 0.2));
  return (
    <svg
      className={cx(s.plate, className)}
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2={w * 0.35} y2={h} gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--plate-start)" /><stop className={s.bodyMid} offset=".62" /><stop offset="1" stopColor="var(--plate-end)" />
        </linearGradient>
        <linearGradient id={`${id}-edge`} x1="0" y1="0" x2={w} y2={h} gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--edge-hot)" />
          <stop offset=".3" stopColor="var(--edge-mid)" />
          <stop offset=".6" stopColor="var(--edge-dim)" />
          <stop offset=".85" stopColor="var(--edge-mid)" />
          <stop offset="1" stopColor="var(--edge-hot)" />
        </linearGradient>
        <radialGradient id={`${id}-bloom`} cx=".5" cy="1" r=".7">
          <stop className={s.bloom} /><stop offset="1" stopColor="transparent" />
        </radialGradient>
        <clipPath id={`${id}-clip`}><path d={outline} /></clipPath>
        <filter id={`${id}-soft`} x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="3" /></filter>
        <filter id={`${id}-glow`} x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="2" /></filter>
      </defs>
      <path d={outline} fill={ref("body")} />
      <path d={outline} fill={ref("bloom")} />
      <g clipPath={ref("clip")}>
        <path className={s.innerGlow} d={outline} stroke="var(--edge-mid)" strokeWidth="10" filter={ref("soft")} />
      </g>
      <path className={s.glow} d={outline} stroke="var(--edge-mid)" strokeWidth="3" filter={ref("glow")} />
      <path className={s.stroke} d={outline} stroke={ref("edge")} strokeLinejoin="miter" />
      <path className={s.innerLine} d={inner} strokeWidth="1" />
      <path d={accent} stroke="var(--edge-hot)" strokeWidth="4" opacity=".7" filter={ref("glow")} />
      <path d={accent} stroke="var(--edge-hot)" strokeWidth="2.4" strokeLinejoin="miter" />
    </svg>
  );
}
