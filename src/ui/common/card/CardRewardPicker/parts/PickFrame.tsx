// 三选一面板的外框与底层: 全息投影装饰(可选素材) + 面板底(暗底 + 内景底图 + 网格) + SVG 描边层。
// 全部 aria-hidden + pointer-events:none, 不参与命中; 内容区由 CardRewardPicker 叠在其上。
// ★ 辉光用「多层加宽低透明描边」而不是 filter: drop-shadow —— 外层遮罩带 backdrop-filter,
//   滤镜辉光在这种合成环境里会被重采样发糊(见 InteractiveHint 文件头)。
import type { CSSProperties } from "react";
import { CARD_PICK_HAS_SCENE, CARD_PICK_HOLOGRAM_ART, CARD_PICK_PANEL_ART } from "@/ui/art/reward/cardPickArt";
import {
  PANEL_ACCENTS,
  PANEL_H,
  PANEL_INNER,
  PANEL_OUTLINE,
  PANEL_W,
  toClipPolygon,
  toSvgPoints,
  type Point,
} from "./pickGeometry";
import s from "./PickFrame.module.css";

const OUTLINE = toSvgPoints(PANEL_OUTLINE);
const INNER = toSvgPoints(PANEL_INNER);
const OUTLINE_CLIP = toClipPolygon(PANEL_OUTLINE);
const INNER_CLIP = toClipPolygon(PANEL_INNER);

// ── 左上角件(标题左侧): 斜向护板线 + 实心棱柱 + 微缩数据列 ──
// 护板线: 贴左内线下行, 在归属行高度斜向内收, 末端一个小方点。
const PLATE_LINE = toSvgPoints([[12, 74], [12, 190], [64, 224]]);
const PLATE_DOT = { x: 66, y: 224 };
const PRISM: readonly Point[] = [[60, 98], [80, 88], [80, 156], [70, 166], [60, 156]];
const PRISM_EDGE = toSvgPoints([[60, 156], [60, 98], [80, 88]]);
// 微缩数据列: 一列长短不一的小刻条, 读作终端读数(无文字)。
const DATA_BARS = [10, 6, 14, 8, 12, 5, 9, 13, 7, 11].map((w, i) => ({ x: 22, y: 120 + i * 6, w }));

export function PickFrame() {
  return (
    <span className={s.decor} aria-hidden>
      {CARD_PICK_HOLOGRAM_ART && (
        <img className={s.hologram} src={CARD_PICK_HOLOGRAM_ART} alt="" draggable={false} />
      )}

      <span className={s.base} style={{ clipPath: OUTLINE_CLIP }} />
      <span
        className={s.art}
        data-scene={CARD_PICK_HAS_SCENE ? "" : undefined}
        style={{ clipPath: INNER_CLIP, "--pick-panel-art": `url(${CARD_PICK_PANEL_ART})` } as CSSProperties}
      />
      <span className={s.grid} style={{ clipPath: INNER_CLIP }} />
      <span className={s.rail} />

      <svg className={s.lines} viewBox={`0 0 ${PANEL_W} ${PANEL_H}`} width={PANEL_W} height={PANEL_H}>
        <defs>
          <linearGradient id="pick-prism" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#2c3c94" />
            <stop offset="0.55" stopColor="#18225e" />
            <stop offset="1" stopColor="#0e1440" />
          </linearGradient>
        </defs>

        <polygon className={s.inner} points={INNER} />
        <polygon className={s.outlineGlow} points={OUTLINE} />
        <polygon className={s.outline} points={OUTLINE} pathLength={1} />

        {PANEL_ACCENTS.map(({ tone, width, points }, index) => {
          const d = toSvgPoints(points);
          return (
            <g key={index} className={s.accent} data-tone={tone}>
              <polyline className={s.accentHalo} points={d} strokeWidth={width + 14} />
              <polyline className={s.accentGlow} points={d} strokeWidth={width + 6} />
              <polyline className={s.accentCore} points={d} strokeWidth={width} />
            </g>
          );
        })}

        <polyline className={s.plateLine} points={PLATE_LINE} />
        <rect className={s.plateDot} x={PLATE_DOT.x - 2.5} y={PLATE_DOT.y - 2.5} width={5} height={5} />
        <polygon className={s.prism} points={toSvgPoints(PRISM)} fill="url(#pick-prism)" />
        <polyline className={s.prismEdge} points={PRISM_EDGE} />
        <g className={s.dataBars}>
          {DATA_BARS.map((bar) => (
            <rect key={bar.y} x={bar.x} y={bar.y} width={bar.w} height={2} />
          ))}
        </g>
      </svg>
    </span>
  );
}
