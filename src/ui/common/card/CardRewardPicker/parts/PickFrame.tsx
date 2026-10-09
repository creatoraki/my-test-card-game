// 三选一面板的外框与底层: 面板底(暗底 + 内景底图 + 网格) + SVG 描边层。
// 全部 aria-hidden + pointer-events:none, 不参与命中; 内容区由 CardRewardPicker 叠在其上。
// ★ 辉光用「多层加宽低透明描边」而不是 filter: drop-shadow —— 外层遮罩带 backdrop-filter,
//   滤镜辉光在这种合成环境里会被重采样发糊(见 InteractiveHint 文件头)。
import type { CSSProperties } from "react";
import { CARD_PICK_HAS_SCENE, CARD_PICK_PANEL_ART } from "@/ui/art/reward/cardPickArt";
import {
  PANEL_ACCENTS,
  PANEL_FILL,
  PANEL_H,
  PANEL_STROKES,
  PANEL_W,
  toClipPolygon,
  toSvgPoints,
  type Point,
} from "./pickGeometry";
import s from "./PickFrame.module.css";

const FILL_CLIP = toClipPolygon(PANEL_FILL);
const STROKES = PANEL_STROKES.map(({ tone, points }) => ({ tone, d: toSvgPoints(points) }));

// ── 左上角件(标题左侧): 斜向护板线 + 实心棱柱 + 微缩数据列 ──
// 护板线: 从页签左缘斜向内收到棱柱; 归属行左侧另有一道短斜线, 末端一个小方点。
const PLATE_LINE = toSvgPoints([[-1, 65], [58, 112]]);
const PLATE_TICK = toSvgPoints([[39, 195], [68, 224]]);
const PLATE_DOT = { x: 69, y: 225 };
const PRISM: readonly Point[] = [[58, 114], [81, 89], [81, 168], [70, 175], [58, 168]];
const PRISM_EDGE = toSvgPoints([[58, 168], [58, 114], [81, 89]]);
// 微缩数据列: 一列长短不一的小刻条, 读作终端读数(无文字)。
const DATA_BARS = [10, 6, 14, 8, 12, 5, 9, 13, 7, 11].map((w, i) => ({ x: 22, y: 120 + i * 6, w }));

export function PickFrame() {
  return (
    <span className={s.decor} aria-hidden>
      <span className={s.base} style={{ clipPath: FILL_CLIP }} />
      <span
        className={s.art}
        data-scene={CARD_PICK_HAS_SCENE ? "" : undefined}
        style={{ clipPath: FILL_CLIP, "--pick-panel-art": `url(${CARD_PICK_PANEL_ART})` } as CSSProperties}
      />
      <span className={s.grid} style={{ clipPath: FILL_CLIP }} />
      <span className={s.rail} />

      <svg className={s.lines} viewBox={`0 0 ${PANEL_W} ${PANEL_H}`} width={PANEL_W} height={PANEL_H}>
        <defs>
          <linearGradient id="pick-prism" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#2c3c94" />
            <stop offset="0.55" stopColor="#18225e" />
            <stop offset="1" stopColor="#0e1440" />
          </linearGradient>
          {/* 主线上亮下淡紫: 顶边与左右缘近白, 底边转淡紫(设计稿取色)。 */}
          <linearGradient id="pick-line" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={PANEL_H}>
            <stop offset="0" stopColor="#dfe2fa" />
            <stop offset="0.6" stopColor="#d4dcf4" />
            <stop offset="1" stopColor="#a99ad8" />
          </linearGradient>
        </defs>

        {STROKES.map(({ tone, d }, index) => (
          <g key={index} className={s.stroke} data-tone={tone}>
            {tone === "main" && <polyline className={s.strokeGlow} points={d} />}
            <polyline className={s.strokeCore} points={d} pathLength={1} />
          </g>
        ))}

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
        <polyline className={s.plateLine} points={PLATE_TICK} />
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
