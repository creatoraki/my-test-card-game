// 卡片外框: 深海蓝底 + 右上斜向光带 + 头部内描边 + 外亮线与四角加粗角标。
// 外亮线单独一层 svg, 让 drop-shadow 只作用在线条上, 不把整块底色也晕开。

import { cx } from "@/ui/common/cx";
import { CARD, chamferRect, cornerBrackets, useSvgId } from "../geometry";
import s from "./CardFrame.module.css";

export function CardFrame({ width: w, height: h }: { width: number; height: number }) {
  const bgId = useSvgId("bdc-bg");
  const clipId = useSvgId("bdc-clip");
  const bandId = useSvgId("bdc-band");
  const glowId = useSvgId("bdc-glow");
  if (w <= 0 || h <= 0) return null;

  const { chamfer: c, headHeight: hh, innerInset: i, medallionX, medallionY } = CARD;
  const outer = chamferRect(0.75, 0.75, w - 0.75, h - 0.75, c);

  return (
    <>
      <svg className={s.layer} width={w} height={h} aria-hidden="true">
        <defs>
          <linearGradient id={bgId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#0f2232" />
            <stop offset="0.45" stopColor="#0a1824" />
            <stop offset="1" stopColor="#07121b" />
          </linearGradient>
          <linearGradient id={bandId} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#8fc4e8" stopOpacity="0" />
            <stop offset="0.35" stopColor="#8fc4e8" stopOpacity="0.09" />
            <stop offset="1" stopColor="#8fc4e8" stopOpacity="0.04" />
          </linearGradient>
          <radialGradient id={glowId}>
            <stop offset="0" style={{ stopColor: "var(--accent)", stopOpacity: 0.2 }} />
            <stop offset="1" style={{ stopColor: "var(--accent)", stopOpacity: 0 }} />
          </radialGradient>
          <clipPath id={clipId}>
            <path d={outer} />
          </clipPath>
        </defs>
        <path d={outer} fill={`url(#${bgId})`} opacity="0.97" />
        <g clipPath={`url(#${clipId})`}>
          {/* 右上斜向光带: 设计图 (1000,470)→(1190,125) 一线以右整体偏亮。 */}
          <path d={`M${w * 0.8} ${i}H${w}V${hh}H${w * 0.664}Z`} fill={`url(#${bandId})`} />
          <path
            className={s["band-edge"]}
            d={`M${w * 0.664} ${hh}L${w * 0.8} ${i}`}
          />
          <path
            className={s["band-edge-faint"]}
            d={`M${w * 0.62} ${hh}L${w * 0.745} ${i + 18}`}
          />
          <circle cx={medallionX} cy={medallionY} r="92" fill={`url(#${glowId})`} />
        </g>
        <path className={s.inner} d={chamferRect(i + 0.5, i + 0.5, w - i - 0.5, hh - 0.5, 8)} />
      </svg>
      <svg className={cx(s.layer, s.glow)} width={w} height={h} aria-hidden="true">
        <path className={s.outer} d={outer} />
        <path className={s.brackets} d={cornerBrackets(1, 1, w - 1, h - 1, c, 16)} />
      </svg>
    </>
  );
}
