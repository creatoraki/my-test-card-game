// 净化粒子能量罐 —— 按设计图逐段还原(竖直坐标系 78×185, 外层 CSS 旋转 11.5°):
//   两段式穹顶 → 外扩上箍环 → 玻璃管(两侧镀铬立柱 + 发光液体 + 竖向高光) → 下箍环 → 收窄底座(凹槽 + 指示灯)。
// 液体颜色跟随档位; 液面高度 = 能量占比(scaleY 以液体底边为原点, 由 CSS 过渡)。

import { useId, type CSSProperties } from "react";
import type { EnergyPalette } from "./energyPalette";
import s from "./EnergyReadout.module.css";

/** 液体腔: 100 能量时液面在 LIQUID.y, 与上箍环之间留一截空玻璃(设计图如此)。 */
const LIQUID = { x: 8, y: 56, w: 62, h: 80 };
const OUTLINE = "#0d121b";

export function EnergyCanister({ palette, fill }: { palette: EnergyPalette; fill: number }) {
  const uid = useId().replace(/:/g, "");
  const id = (name: string) => `can-${name}-${uid}`;
  const url = (name: string) => `url(#${id(name)})`;
  const level = Math.max(0, Math.min(1, fill));

  return <svg className={s.canister} viewBox="-14 -14 106 213" aria-hidden>
    <defs>
      {/* 蓝调镀铬: 左暗 → 左高光 → 中灰 → 右高光 → 右暗 */}
      <linearGradient id={id("metal")} x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#465063" />
        <stop offset="0.07" stopColor="#a9b5c8" />
        <stop offset="0.2" stopColor="#f4f7fc" />
        <stop offset="0.3" stopColor="#dce3ee" />
        <stop offset="0.46" stopColor="#8a96aa" />
        <stop offset="0.62" stopColor="#b8c2d2" />
        <stop offset="0.78" stopColor="#eef2f8" />
        <stop offset="0.9" stopColor="#97a3b7" />
        <stop offset="1" stopColor="#485266" />
      </linearGradient>
      {/* 箍环的上亮下暗 */}
      <linearGradient id={id("shade")} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.4" />
        <stop offset="0.4" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="0.7" stopColor="#000000" stopOpacity="0.05" />
        <stop offset="1" stopColor="#000000" stopOpacity="0.45" />
      </linearGradient>
      <linearGradient id={id("strut")} x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#8fa2c0" />
        <stop offset="0.45" stopColor="#ffffff" />
        <stop offset="1" stopColor="#9fb2cc" />
      </linearGradient>
      <linearGradient id={id("liquid")} x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor={palette.main} />
        <stop offset="0.12" stopColor={palette.light} />
        <stop offset="0.3" stopColor={palette.pale} />
        <stop offset="0.46" stopColor={palette.pale} />
        <stop offset="0.6" stopColor={palette.light} />
        <stop offset="0.7" stopColor={palette.main} />
        <stop offset="0.84" stopColor={palette.deep} />
        <stop offset="0.93" stopColor={palette.rim} />
        <stop offset="1" stopColor={palette.main} />
      </linearGradient>
      <linearGradient id={id("glass")} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#0d1526" />
        <stop offset="1" stopColor={palette.deep} stopOpacity="0.55" />
      </linearGradient>
      <clipPath id={id("tube")}>
        <rect x={LIQUID.x} y={LIQUID.y} width={LIQUID.w} height={LIQUID.h} rx="7" />
      </clipPath>
      {/* 罐体外发光: 轮廓先外扩 2px 再模糊, 贴边亮、约 10px 衰减到无。 */}
      <filter id={id("glow")} x="-40%" y="-20%" width="180%" height="140%">
        <feMorphology in="SourceAlpha" operator="dilate" radius="2" result="grown" />
        <feGaussianBlur in="grown" stdDeviation="3.2" result="blur" />
        <feFlood floodColor={palette.main} />
        <feComposite in2="blur" operator="in" result="halo" />
        <feMerge>
          <feMergeNode in="halo" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    <g filter={url("glow")}>
      {/* 玻璃管: 暗色管腔 → 液体 → 液面亮线 → 气泡 → 竖向高光 */}
      <rect x="4" y="40" width="70" height="100" fill={url("glass")} />
      <g clipPath={url("tube")}>
        <rect
          className={s.liquid}
          x={LIQUID.x} y={LIQUID.y} width={LIQUID.w} height={LIQUID.h}
          fill={url("liquid")}
          style={{ transform: `scaleY(${level})` } as CSSProperties}
        />
        <g className={s.surface} style={{ transform: `translateY(${(1 - level) * LIQUID.h}px)` } as CSSProperties}>
          <rect x={LIQUID.x} y={LIQUID.y} width={LIQUID.w} height="2.5" fill={palette.pale} opacity={level > 0 ? 0.95 : 0} />
        </g>
        <ellipse cx="40" cy="96" rx="11" ry="14" fill={palette.pale} opacity="0.16" />
        <circle cx="44" cy="120" r="5" fill={palette.pale} opacity="0.18" />
      </g>
      <rect x="19" y="44" width="6" height="94" fill="#ffffff" opacity="0.92" />
      <rect x="62" y="48" width="2" height="86" fill="#ffffff" opacity="0.35" />

      {/* 两侧镀铬立柱 */}
      <rect x="2.5" y="42" width="5" height="96" rx="1.5" fill={url("strut")} stroke={OUTLINE} strokeWidth="1.2" />
      <rect x="70.5" y="42" width="5" height="96" rx="1.5" fill={url("strut")} stroke={OUTLINE} strokeWidth="1.2" />

      {/* 上盖: 两段式穹顶 + 外扩箍环 + 箍环下的暗唇 */}
      <path d="M9 25C9 13 15 4 27 2.5h24C63 4 69 13 69 25Z" fill={url("metal")} stroke={OUTLINE} strokeWidth="1.8" />
      <path d="M9 25C9 13 15 4 27 2.5h24C63 4 69 13 69 25Z" fill={url("shade")} />
      <path d="M11.5 14.5C24 11 54 11 66.5 14.5" fill="none" stroke="#39445a" strokeWidth="1.6" />
      <path d="M12 16.5C24 13.5 54 13.5 66 16.5" fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="1" />
      <rect x="0.5" y="23" width="77" height="22" rx="4" fill={url("metal")} stroke={OUTLINE} strokeWidth="1.8" />
      <rect x="0.5" y="23" width="77" height="22" rx="4" fill={url("shade")} />
      <rect x="4" y="44.5" width="70" height="3" fill="#1b2232" opacity="0.8" />

      {/* 下盖: 箍环 + 收窄底座(凹槽 + 小孔 + 指示灯) */}
      <rect x="0.5" y="135" width="77" height="21" rx="4" fill={url("metal")} stroke={OUTLINE} strokeWidth="1.8" />
      <rect x="0.5" y="135" width="77" height="21" rx="4" fill={url("shade")} />
      <path d="M4 156h70l-4 20c-1 6-5 8.5-10 8.5H18c-5 0-9-2.5-10-8.5Z" fill={url("metal")} stroke={OUTLINE} strokeWidth="1.8" />
      <path d="M5.5 162h67l-1.6 9H7.1Z" fill="#3c465a" opacity="0.75" />
      <path d="M8 174h62" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="1" />
      <rect x="28" y="164.5" width="6" height="4" rx="1.2" fill="#161b26" />
      <rect x="37" y="164.5" width="6" height="4" rx="1.2" fill="#161b26" />
      <rect x="66" y="158.5" width="2.5" height="5" rx="1" fill={palette.pale} />
    </g>
  </svg>;
}

export default EnergyCanister;
