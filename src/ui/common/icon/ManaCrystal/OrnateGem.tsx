// 华丽费用宝石(ManaCrystal ornate): 卡牌三选一放大卡面用, 按设计稿像素量取复刻。
// 结构(自下而上): 外柔光 → 外侧深色描影 → 本体纵向渐变 → 亮边内侧受光 → 2.6px 亮边 → 右上边背光压暗(仅法力色)。
// 几何以 66 见方画布为基准随容器等比缩放: 中心 (33,33); 设计稿亮边中线落在 |dx|+|dy| ≈ 30.6 的菱形上,
// 顶点小圆角让顶点处亮边峰值内收约 0.9(顶点对顶点约 59～60px, 含柔边约 62px)。
import { memo, useId } from "react";
import { ORNATE_GEM_PALETTE, type GemStop } from "./ornateGemPalette";
import s from "./ManaCrystal.module.css";

const C = 33;
/** 亮边中线(菱形半对角)。 */
const RIM = 30.6;
const RIM_W = 2.6;
/** 亮边外沿: 中线外扩半个线宽(菱形边 45°, 顶点方向 ×√2)。 */
const OUTER = RIM + (RIM_W / 2) * Math.SQRT2;
const BODY = RIM + 0.5;
/** 顶点圆角: 沿边退让的长度。 */
const ROUND = 2.5;

function diamond(r: number): string {
  const pts: readonly [number, number][] = [
    [C, C - r],
    [C + r, C],
    [C, C + r],
    [C - r, C],
  ];
  const k = ROUND / Math.SQRT2;
  const toward = ([x, y]: [number, number], [tx, ty]: [number, number]): string => {
    const dx = Math.sign(tx - x) * k;
    const dy = Math.sign(ty - y) * k;
    return `${(x + dx).toFixed(2)} ${(y + dy).toFixed(2)}`;
  };
  let d = "";
  pts.forEach((p, i) => {
    const prev = pts[(i + 3) % 4];
    const next = pts[(i + 1) % 4];
    d += `${i === 0 ? "M" : "L"}${toward(p, prev)} Q${p[0]} ${p[1]} ${toward(p, next)} `;
  });
  return `${d}Z`;
}

const OUTER_D = diamond(OUTER);
const BODY_D = diamond(BODY);
const RIM_D = diamond(RIM);
/** 右上边(上顶点 → 右顶点)的亮边中线, 两端让开圆角。 */
const SHADE = { x1: C + 3, y1: C - RIM + 3, x2: C + RIM - 3, y2: C - 3 };

function Stops({ stops }: { stops: readonly GemStop[] }) {
  return (
    <>
      {stops.map((stop) => (
        <stop key={stop.at} offset={stop.at} stopColor={stop.color} />
      ))}
    </>
  );
}

interface Props {
  tone: "mana" | "haste";
}

export const OrnateGem = memo(function OrnateGem({ tone }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const p = ORNATE_GEM_PALETTE[tone];
  const id = (name: string) => `gem${name}${uid}`;

  return (
    <svg className={s.ornateGem} viewBox="0 0 66 66" aria-hidden>
      <defs>
        <linearGradient id={id("body")} gradientUnits="userSpaceOnUse" x1="0" y1={C - BODY} x2="0" y2={C + BODY}>
          <Stops stops={p.body} />
        </linearGradient>
        <linearGradient id={id("rim")} gradientUnits="userSpaceOnUse" x1="0" y1={C - OUTER} x2="0" y2={C + OUTER}>
          <Stops stops={p.rim} />
        </linearGradient>
        {p.shadeEdge && (
          <linearGradient id={id("shade")} gradientUnits="userSpaceOnUse" x1={SHADE.x1} y1={SHADE.y1} x2={SHADE.x2} y2={SHADE.y2}>
            <stop offset="0" stopColor={p.shadeEdge} stopOpacity="0" />
            <stop offset="0.22" stopColor={p.shadeEdge} stopOpacity="0.85" />
            <stop offset="0.78" stopColor={p.shadeEdge} stopOpacity="0.85" />
            <stop offset="1" stopColor={p.shadeEdge} stopOpacity="0" />
          </linearGradient>
        )}
        <clipPath id={id("clip")}>
          <path d={BODY_D} />
        </clipPath>
        <filter id={id("glow")} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3.2" />
        </filter>
        <filter id={id("edge")} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.6" />
        </filter>
        <filter id={id("inner")} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
      </defs>

      <path d={OUTER_D} fill={p.glow} stroke={p.glow} strokeWidth={4} opacity={p.glowOpacity} filter={`url(#${id("glow")})`} />
      {/* 描边以外沿为中线, 内半边被亮边盖住 ⇒ 实际在宝石外露出 width 宽的深色圈。 */}
      <path
        d={OUTER_D}
        fill="none"
        stroke={p.edgeShadow.color}
        strokeWidth={p.edgeShadow.width * 2}
        strokeLinejoin="round"
        opacity={p.edgeShadow.opacity}
        filter={`url(#${id("edge")})`}
      />
      <path d={BODY_D} fill={`url(#${id("body")})`} />
      <g clipPath={`url(#${id("clip")})`}>
        <path
          d={BODY_D}
          fill="none"
          stroke={p.inner}
          strokeWidth={5}
          opacity={p.innerOpacity}
          filter={`url(#${id("inner")})`}
        />
      </g>
      <path d={RIM_D} fill="none" stroke={`url(#${id("rim")})`} strokeWidth={RIM_W} />
      {p.shadeEdge && (
        <line {...SHADE} stroke={`url(#${id("shade")})`} strokeWidth={2.2} strokeLinecap="round" />
      )}
    </svg>
  );
});
