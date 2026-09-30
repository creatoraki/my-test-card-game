import { useId, type CSSProperties } from "react";
import { chamferPath, cornerAccentPath, type Chamfer } from "@/ui/common/frame/NeonPlate/plateGeometry";
import s from "./ExploreActionButton.module.css";

// 探索行动按钮牌面，沿用商店返回牌(ShopBack/BackFrame)的分层逻辑：
// 深色主题玻璃底 + 左下径向辉光 + 顶部反光 → 裁切内光 / 充能条 / 悬停扫光 → 外发光描边 + 渐变主描边 + 内框线 + 左上右下切角高光。
// 颜色全部由 --act-accent / --act-hot / --act-deep 下发，三种语义色只换变量。
const ACCENT = "var(--act-accent)";
const HOT = "var(--act-hot)";
const DEEP = "var(--act-deep)";

interface Props {
  width: number;
  height: number;
  chamfer: Chamfer;
  /** 是否渲染长按充能条。 */
  charge?: boolean;
}

export function ActionFrame({ width: w, height: h, chamfer, charge = false }: Props) {
  const id = useId();
  const ref = (name: string) => `url(#${id}-${name})`;
  const outline = chamferPath(w, h, chamfer, 1);
  const inner = chamferPath(w, h, chamfer, 5);
  const accent = cornerAccentPath(w, h, chamfer, 1, 12);
  const sw = Math.round(w * 0.3);
  const sweep = `M${-sw * 0.5} 0H0L${-sw * 0.5} ${h}H${-sw}Z`;
  return (
    <svg className={s.frame} width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2={w} y2={h * 0.6} gradientUnits="userSpaceOnUse">
          <stop stopColor={DEEP} stopOpacity=".95" />
          <stop offset=".55" stopColor="#081014" stopOpacity=".92" />
          <stop offset="1" stopColor={DEEP} stopOpacity=".75" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx=".16" cy=".9" r=".65">
          <stop stopColor={ACCENT} stopOpacity=".36" />
          <stop offset="1" stopColor={ACCENT} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="0" y2={h} gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity=".1" />
          <stop offset=".45" stopColor="#ffffff" stopOpacity=".02" />
          <stop offset=".46" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-edge`} x1="0" y1="0" x2={w} y2={h} gradientUnits="userSpaceOnUse">
          <stop stopColor={HOT} />
          <stop offset=".25" stopColor={ACCENT} />
          <stop offset=".6" stopColor={ACCENT} stopOpacity=".7" />
          <stop offset="1" stopColor={HOT} />
        </linearGradient>
        <linearGradient id={`${id}-charge`} x1="0" y1="0" x2={w} y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor={ACCENT} stopOpacity=".2" />
          <stop offset=".7" stopColor={ACCENT} stopOpacity=".55" />
          <stop offset="1" stopColor={HOT} stopOpacity=".85" />
        </linearGradient>
        <linearGradient id={`${id}-sweep`} x1={-sw} y1="0" x2="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity="0" />
          <stop offset=".5" stopColor="#ffffff" stopOpacity=".32" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}-clip`}><path d={outline} /></clipPath>
        <filter id={`${id}-blur`} x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="2.5" /></filter>
        <filter id={`${id}-soft`} x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="5" /></filter>
      </defs>
      <path d={outline} fill={ref("body")} />
      <path d={outline} fill={ref("glow")} />
      <path d={outline} fill={ref("sheen")} />
      <g clipPath={ref("clip")}>
        {charge && <rect className={s.charge} width={w} height={h} fill={ref("charge")} />}
        <path className={s.innerGlow} d={outline} stroke={ACCENT} strokeWidth="10" filter={ref("soft")} />
        <path className={s.sweep} d={sweep} fill={ref("sweep")} style={{ "--sweep-to": `${w + sw}px` } as CSSProperties} />
      </g>
      <path className={s.edgeGlow} d={outline} stroke={ACCENT} strokeWidth="4" filter={ref("blur")} />
      <path d={outline} stroke={ref("edge")} strokeWidth="2" strokeLinejoin="miter" />
      <path d={inner} stroke={ACCENT} strokeOpacity=".22" />
      <path className={s.accent} d={accent} stroke={HOT} strokeWidth="4" opacity=".6" filter={ref("blur")} />
      <path d={accent} stroke={HOT} strokeWidth="2" strokeLinejoin="miter" />
    </svg>
  );
}
