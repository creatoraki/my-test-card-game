import { useId } from "react";
import { chamferPath, cornerAccentPath, type Chamfer } from "@/ui/common/NeonPlate/plateGeometry";
import s from "./ShopBack.module.css";

// 返回按钮玻璃牌：深色主题玻璃 + 左下径向辉光 + 顶部反光，主描边带外发光，左上 / 右下切角高光。
const ACCENT = "var(--rail-accent, #ff3b4e)";
const HOT = "var(--rail-accent-hot, #ff8d97)";
const DEEP = "var(--rail-accent-deep, #5a1119)";

export function BackFrame({ width: w, height: h, chamfer }: { width: number; height: number; chamfer: Chamfer }) {
  const id = useId();
  const ref = (name: string) => `url(#${id}-${name})`;
  const outline = chamferPath(w, h, chamfer, 1);
  const inner = chamferPath(w, h, chamfer, 5);
  const accent = cornerAccentPath(w, h, chamfer, 1, 12);
  return (
    <svg className={s.frame} width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2={w} y2={h * 0.6} gradientUnits="userSpaceOnUse">
          <stop stopColor={DEEP} stopOpacity=".92" />
          <stop offset=".55" stopColor="#1a0a0d" stopOpacity=".9" />
          <stop offset="1" stopColor={DEEP} stopOpacity=".7" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx=".18" cy=".85" r=".6">
          <stop stopColor={ACCENT} stopOpacity=".32" />
          <stop offset="1" stopColor={ACCENT} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="0" y2={h} gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity=".09" />
          <stop offset=".45" stopColor="#ffffff" stopOpacity=".02" />
          <stop offset=".46" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-edge`} x1="0" y1="0" x2={w} y2={h} gradientUnits="userSpaceOnUse">
          <stop stopColor={HOT} />
          <stop offset=".25" stopColor={ACCENT} />
          <stop offset=".6" stopColor={ACCENT} stopOpacity=".75" />
          <stop offset="1" stopColor={HOT} />
        </linearGradient>
        <clipPath id={`${id}-clip`}><path d={outline} /></clipPath>
        <filter id={`${id}-blur`} x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="2.5" /></filter>
        <filter id={`${id}-soft`} x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="5" /></filter>
      </defs>
      <path d={outline} fill={ref("body")} />
      <path d={outline} fill={ref("glow")} />
      <path d={outline} fill={ref("sheen")} />
      <g clipPath={ref("clip")}>
        <path d={outline} stroke={ACCENT} strokeWidth="10" opacity=".4" filter={ref("soft")} />
      </g>
      <path className={s.edgeGlow} d={outline} stroke={ACCENT} strokeWidth="4" filter={ref("blur")} />
      <path d={outline} stroke={ref("edge")} strokeWidth="2" strokeLinejoin="miter" />
      <path d={inner} stroke={ACCENT} strokeOpacity=".22" />
      <path d={accent} stroke={HOT} strokeWidth="4" opacity=".6" filter={ref("blur")} />
      <path d={accent} stroke={HOT} strokeWidth="2" strokeLinejoin="miter" />
    </svg>
  );
}
