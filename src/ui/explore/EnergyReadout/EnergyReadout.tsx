// ★ 净化粒子读数卡 ★ —— 探索页右上角常驻。
// 坐标全部取自设计图(净化粒子.png)的像素测量, 卡片局部坐标 335×215, 1:1 绘制:
//   面板   —— SVG 路径: 右上大切角、右下带折角的小切角; 描边 = 外圈色带 + 1px 亮线, 外发光约 7px 衰减;
//   能量罐 —— EnergyCanister, 压在面板左端之上;
//   文字   —— 标题 / 大号数字 / 「/100」; 能量条按能量占比缩短。
// 配色随能量档位切换(绿 / 黄 / 蓝 / 紫 / 红), 色值见 energyPalette.ts。
// 悬浮(或键盘聚焦)弹出档位详情: 当前收益加成与敌人强化(EnergyTierDetail)。

import { useId, type CSSProperties } from "react";
import { HoverTooltip, useHoverTooltip } from "@/ui/common/HoverTooltip";
import { EnergyCanister } from "./EnergyCanister";
import { EnergyTierDetail } from "./EnergyTierDetail";
import { energyPalette } from "./energyPalette";
import s from "./EnergyReadout.module.css";

const MAX_ENERGY = 100;

/** 面板轮廓(亮线中心线)。左端藏在能量罐后面。 */
const PANEL_PATH =
  "M52 48Q52 40.5 59.5 40.5H257Q261 40.5 264 43L307.5 79.5Q310.5 82 310.5 86V156Q310.5 158 309 159.5L303 166L273.5 201.5Q272.5 203 270.5 203H59.5Q52 203 52 195.5Z";

/** 右侧 4×4 点阵纹里实际亮着的格子(列, 行, 透明度)。 */
const DOTS: [number, number, number][] = [
  [2, 0, 0.5], [3, 0, 0.5],
  [0, 1, 0.35], [1, 1, 0.55], [2, 1, 0.75], [3, 1, 0.75],
  [1, 2, 0.45], [2, 2, 0.65], [3, 2, 0.6],
  [2, 3, 0.4], [3, 3, 0.55],
];

export function EnergyReadout({ energy, className }: { energy: number; className?: string }) {
  const uid = useId().replace(/:/g, "");
  // 卡片贴在画布右上角: 详情一律弹在左侧, 不盖住读数本身。
  const hover = useHoverTooltip("left");
  const palette = energyPalette(energy);
  const ratio = Math.max(0, Math.min(1, energy / MAX_ENERGY));
  const style = {
    "--c-number": palette.number,
    "--c-bar-a": palette.bar[0],
    "--c-bar-b": palette.bar[1],
    "--c-bar-c": palette.bar[2],
    "--c-band": palette.band,
    "--c-glow": palette.glow,
  } as CSSProperties;

  return <div
    className={`${s.card}${className ? ` ${className}` : ""}`}
    style={style}
    role="group"
    tabIndex={0}
    aria-label={`净化粒子 ${energy} / ${MAX_ENERGY}`}
    {...hover.bind}
  >
    <svg className={s.frame} viewBox="0 0 335 215" aria-hidden>
      <defs>
        <linearGradient id={`panel-fill-${uid}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={palette.fill[0]} />
          <stop offset="0.5" stopColor={palette.fill[1]} />
          <stop offset="1" stopColor={palette.fill[2]} />
        </linearGradient>
        {/* 亮线左端稍暗, 往右上切角处最亮。 */}
        <linearGradient id={`panel-edge-${uid}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={palette.edge} stopOpacity="0.7" />
          <stop offset="0.6" stopColor={palette.edge} />
        </linearGradient>
        {/* 外发光: 轮廓外扩 2.5px 再模糊 —— 贴边约 80% 不透明, 7px 外衰减到无。 */}
        <filter id={`panel-glow-${uid}`} x="-10%" y="-15%" width="120%" height="130%">
          <feMorphology in="SourceAlpha" operator="dilate" radius="2.5" result="grown" />
          <feGaussianBlur in="grown" stdDeviation="1.8" result="blur" />
          <feFlood floodColor={palette.glow} />
          <feComposite in2="blur" operator="in" result="halo" />
          <feMerge>
            <feMergeNode in="halo" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter={`url(#panel-glow-${uid})`}>
        <path d={PANEL_PATH} fill={`url(#panel-fill-${uid})`} stroke={palette.band} strokeWidth="4.5" strokeLinejoin="round" />
        <path d={PANEL_PATH} fill="none" stroke={`url(#panel-edge-${uid})`} strokeWidth="1.6" strokeLinejoin="round" />
      </g>

      {DOTS.map(([col, row, alpha]) => <rect
        key={`${col}-${row}`}
        x={274 + col * 6.3} y={86.5 + row * 6.1} width="3" height="3"
        fill={palette.edge} opacity={alpha * 0.55}
      />)}

      {/* 右上角外侧三道放射短线: 外端略粗 */}
      <g filter={`url(#panel-glow-${uid})`} stroke={palette.bar[1]} strokeLinecap="round">
        <path d="M273.5 43 279.5 28.5" strokeWidth="6" />
        <path d="M285.5 51 300.5 36" strokeWidth="7" />
        <path d="M292.5 64 305 60" strokeWidth="6" />
      </g>
    </svg>

    <span className={s.title}>净化粒子</span>
    <strong className={s.value}>{energy}<small>/{MAX_ENERGY}</small></strong>
    <div className={s.track}><i style={{ width: `${ratio * 100}%` }} /></div>

    <EnergyCanister palette={palette} fill={ratio} />
    {hover.point && <HoverTooltip point={hover.point}><EnergyTierDetail energy={energy} /></HoverTooltip>}
  </div>;
}

export default EnergyReadout;
