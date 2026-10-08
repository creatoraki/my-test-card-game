// 三选一面板的外框与底层: 全息投影装饰(可选素材) + 面板底(暗底 + 锻造师底图 + 网格) + SVG 描边层。
// 全部 aria-hidden + pointer-events:none, 不参与命中; 内容区由 CardRewardPicker 叠在其上。
// ★ 辉光用「多层加宽低透明描边」而不是 filter: drop-shadow —— 外层遮罩带 backdrop-filter,
//   滤镜辉光在这种合成环境里会被重采样发糊(见 InteractiveHint 文件头)。
import type { CSSProperties } from "react";
import { CARD_PICK_HOLOGRAM_ART, CARD_PICK_PANEL_ART } from "@/ui/art/reward/cardPickArt";
import {
  PANEL_ACCENTS,
  PANEL_H,
  PANEL_INNER,
  PANEL_OUTLINE,
  PANEL_W,
  toClipPolygon,
  toSvgPoints,
} from "./pickGeometry";
import s from "./PickFrame.module.css";

const OUTLINE = toSvgPoints(PANEL_OUTLINE);
const INNER = toSvgPoints(PANEL_INNER);
const OUTLINE_CLIP = toClipPolygon(PANEL_OUTLINE);
const INNER_CLIP = toClipPolygon(PANEL_INNER);

export function PickFrame() {
  return (
    <span className={s.decor} aria-hidden>
      {CARD_PICK_HOLOGRAM_ART && (
        <img className={s.hologram} src={CARD_PICK_HOLOGRAM_ART} alt="" draggable={false} />
      )}

      <span className={s.base} style={{ clipPath: OUTLINE_CLIP }} />
      <span
        className={s.art}
        style={{ clipPath: INNER_CLIP, "--pick-panel-art": `url(${CARD_PICK_PANEL_ART})` } as CSSProperties}
      />
      <span className={s.grid} style={{ clipPath: INNER_CLIP }} />
      <span className={s.rail} />

      <svg className={s.lines} viewBox={`0 0 ${PANEL_W} ${PANEL_H}`} width={PANEL_W} height={PANEL_H}>
        <polygon className={s.inner} points={INNER} />
        <polygon className={s.outlineGlow} points={OUTLINE} />
        <polygon className={s.outline} points={OUTLINE} pathLength={1} />
        {PANEL_ACCENTS.map(({ tone, points }, index) => {
          const d = toSvgPoints(points);
          return (
            <g key={index} className={s.accent} data-tone={tone}>
              <polyline className={s.accentHalo} points={d} />
              <polyline className={s.accentGlow} points={d} />
              <polyline className={s.accentCore} points={d} />
            </g>
          );
        })}
        {/* 主标题左侧的竖向护板 + 刻度 */}
        <polygon className={s.bracket} points="62,98 74,86 74,152 62,164" />
        <polyline className={s.bracketEdge} points="62,104 62,98 74,86" />
        <path className={s.bracketTicks} d="M64 176 H72 M64 186 H72 M64 196 H72 M64 206 H70" />
      </svg>
    </span>
  );
}
