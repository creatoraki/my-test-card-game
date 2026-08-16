// ds 路线图 v3 —— 「星图投影」: 悬浮在深空里的一张全息航线图, ds 页签的独立展示组件。
//
// 与生产组件 src/ui/common/RouteBoard **完全无关**。v2 虽然换了三种台座造型,
// 但骨架仍是「摆在桌面上的沙盘」—— v3 把整个概念换掉, 建立 ds 自己的视觉身份:
//
//   ★ 场景 = 深空虚空: 深靛渐变 + 漂移星点 + 底部投影基座(光圈 + 同心环);
//   ★ 地块 = 悬浮的**能量玻璃台座**: 三种造型(六边形充能台 / 圆形服务台 / 破损菱形台)
//     换成玻璃材质 —— 顶面半透明、侧面深色能量壁、每块台座缓慢呼吸浮动(相位错开);
//   ★ 每块台座向下垂一条**投影光柱**(事件色渐变), 读作「被基座投影出来的全息体」;
//   ★ 物件 = **悬浮星徽**(sigil) 取代家具: 台面升起一条细光柱, 顶端浮着一枚徽记 ——
//     外圈实线环 + 内圈旋转虚线环 + 中央事件线稿, 事件区分回到「徽记轮廓」;
//   ★ 轨道 = **能量流**: 暗槽 + 冷银光带 + 一段匀速流动的亮斑(默认蓝白, 通电黄绿, 桥接亮青);
//   ★ 玩家 = **光核信使**: 一道光柱顶着一枚悬浮晶核;
//   ★ 整块棋盘随鼠标**视差轻摆**(perspective 旋转, 直接改 CSS 变量, 零重渲染)。
//
// 每块砖的全部颜色由 **--k** 一个变量推出(TSX 内联下发), 换类型 = 换一个变量。
// ⛔ 禁闪烁: 常驻动效只用位移/旋转/缩放, 明暗一律走 transition 或一次性播完。
// ⚠ 悬浮提示一律组件渲染, 不用原生 title。

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { traceSegment } from "@/explore/route";
import type {
  NodeEvent,
  NodeEventKind,
  RouteBoard as RouteBoardData,
  RouteSegment,
} from "@/explore/types";
import { prefersReducedMotion } from "@/ui/app/transitions";
import { cx } from "@/ui/common/cx";
import { ADV_X, ADV_Y, LANE_X, LANE_Y, poly, type P2 } from "./dsIso";
import s from "./DsRouteBoard.module.css";

// ===================== 版式(设计 px) =====================

const SEG_PITCH = 210;
const ENTRY_RUN = SEG_PITCH;
const LANE_GAP = 134;
const TILE_HALF = 27;
const TILE_D = 24; // 按钮盒预留厚度(取最厚造型留余量)
const ICON_H = 84; // 星徽的净空(徽记浮在台面上约 50px, 悬停再上浮, 顶格留足)
const ENTRY_U = -104;
const TILE_INSET = 30;
const TILE_NUDGE_X = -6;
const TILE_NUDGE_Y = -6;

const TILE_W = 2 * TILE_HALF * (ADV_X + LANE_X); // ≈ 96.6
const TILE_TOP_H = 2 * TILE_HALF * (LANE_Y - ADV_Y); // ≈ 48.3
const TILE_BOX_H = TILE_TOP_H + TILE_D;
const TCX = TILE_W / 2;
const TCY = TILE_TOP_H / 2;

const LANE_COUNT = 5;
const SEG_COUNT = 4;
const ENTRY_LABELS = ["A", "B", "C", "D", "E"];

// 投影光柱: 每块台座向下垂的固定长度(世界是斜的, 光柱等长才是同一张「地板」)。
const SHAFT_LEN = 120;

// 推进动画节奏。
const SIGNAL_SPEED = 0.42;
const SIGNAL_MIN_MS = 820;
const SIGNAL_MAX_MS = 2000;
const PAWN_SPEED_DIV = 2.6;
const SEG_TAIL_MS = 280;
const GENERATE_MS = 2100;
const GENERATE_REDUCED_MS = 320;

// ===================== 坐标换算 =====================

function nodeU(seg: number): number {
  return seg < 0 ? ENTRY_U : ENTRY_U + ENTRY_RUN + seg * SEG_PITCH;
}
const TRACK_LEN = nodeU(SEG_COUNT - 1);
const S_MAX = (LANE_COUNT - 1) * LANE_GAP;

const PAD = 36;
const rawX = (u: number, sv: number) => u * ADV_X + sv * LANE_X;
const rawY = (u: number, sv: number) => u * ADV_Y + sv * LANE_Y;
const U_MIN = ENTRY_U - TILE_HALF;
const S_MIN = -TILE_HALF;
const S_TOP = S_MAX + TILE_HALF;
const X_LO = rawX(U_MIN, S_MIN);
const X_HI = Math.max(rawX(TRACK_LEN, S_MAX), rawX(nodeU(SEG_COUNT - 1) + TILE_HALF, S_TOP));
const Y_LO = Math.min(rawY(nodeU(SEG_COUNT - 1), 0) - ICON_H, rawY(TRACK_LEN, S_MIN));
const Y_HI = rawY(U_MIN, S_TOP) + TILE_D;
const ORIGIN_X = PAD - X_LO;
const ORIGIN_Y = PAD - Y_LO;

const BOARD_W = Math.round(X_HI - X_LO + PAD * 2);
const BOARD_H = Math.round(Y_HI - Y_LO + PAD * 2);

function sx(u: number, sv: number): number {
  return ORIGIN_X + u * ADV_X + sv * LANE_X;
}
function sy(u: number, sv: number): number {
  return ORIGIN_Y + u * ADV_Y + sv * LANE_Y;
}
function laneS(lane: number): number {
  return lane * LANE_GAP;
}
function nodeCenter(seg: number, lane: number): { x: number; y: number } {
  return { x: sx(nodeU(seg), laneS(lane)), y: sy(nodeU(seg), laneS(lane)) };
}
function pt(u: number, lane: number): P2 {
  return [sx(u, laneS(lane)), sy(u, laneS(lane))];
}
function pathOf(points: P2[]): string {
  return points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
}
function lengthOf(points: P2[]): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    len += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  }
  return len;
}

function bridgeU(seg: number, row: number, rows: number): number {
  const from = nodeU(seg - 1) + 54;
  const to = nodeU(seg) - 54;
  return from + ((row + 1) * (to - from)) / (rows + 1);
}

// ===================== 连线(能量流) =====================
// 四层: 暗槽(bed) + 冷银光带(pipe) + 顶部高光(gloss) + 流动亮斑(flow)。

function Pipe({ a, b, j = 0 }: { a: P2; b: P2; j?: number }) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const geo = { x1: a[0], y1: a[1], x2: b[0], y2: b[1] };
  return (
    <g style={{ "--len": len.toFixed(1), "--j": j } as CSSProperties}>
      <line className={s.dsrPipeBed} {...geo} />
      <line className={s.dsrPipe} {...geo} />
      <line className={s.dsrPipeGloss} {...geo} />
      <line className={s.dsrPipeFlow} {...geo} />
    </g>
  );
}

// ===================== 台座几何 =====================

const L = (du: number, ds: number): P2 => [
  TCX + du * ADV_X + ds * LANE_X,
  TCY + du * ADV_Y + ds * LANE_Y,
];
const corners = (h: number): P2[] => [L(h, -h), L(h, h), L(-h, h), L(-h, -h)]; // 北/东/南/西
const hexCorners = (r: number): P2[] => {
  const out: P2[] = [];
  for (let k = 0; k < 6; k++) {
    const a = (Math.PI / 3) * k;
    out.push(L(r * Math.cos(a), r * Math.sin(a)));
  }
  return out;
};
const HEX_R = TILE_HALF * 1.28;
const brokenTop = (h: number): P2[] => [
  L(h, -h),
  L(h, -h * 0.25),
  L(h * 0.52, -h * 0.08),
  L(h * 0.42, h * 0.38),
  L(h, h * 0.6),
  L(h, h),
  L(-h, h),
  L(-h, -h),
];

// ★ 台座造型即信息(三类分工见文件抬头)。
type TileShape = "gain" | "util" | "threat" | "entry";
type DsNodeKind = "heal" | "loot" | "energy" | "merchant" | "route" | "hazard";

const KIND_SHAPE: Record<DsNodeKind, TileShape> = {
  heal: "gain",
  loot: "gain",
  energy: "gain",
  merchant: "util",
  route: "util",
  hazard: "threat",
};
const DEPTH: Record<TileShape, number> = { gain: 16, util: 12, threat: 6, entry: 14 };
const BASE_H = 5; // gain 专属外扩基座

function outlineOf(shape: TileShape, h: number): { top: P2[]; front: P2[] } | null {
  if (shape === "util") return null;
  if (shape === "gain") {
    const p = hexCorners(h * 1.28);
    return { top: p, front: [p[2], p[1], p[0]] };
  }
  if (shape === "threat") {
    const p = brokenTop(h);
    return { top: p, front: [p[7], p[6], p[5], p[4], p[3], p[2], p[1], p[0]] };
  }
  const p = corners(h);
  return { top: p, front: [p[3], p[2], p[1]] };
}

const dropBy = (p: P2, d: number): P2 => [p[0], p[1] + d];
const sideBand = (chain: P2[], d: number): string =>
  poly([...chain, ...[...chain].reverse().map((p) => dropBy(p, d))]);
const isoCircle = (r: number) => ({ rx: r * (ADV_X + LANE_X), ry: r * (LANE_Y - ADV_Y) });

const CYL_R = TILE_HALF * 0.94;
const CYL_RX = CYL_R * (ADV_X + LANE_X);
const CYL_RY = CYL_R * (LANE_Y - ADV_Y);

const hazardStripe = (offset: number): string => poly([L(offset, 15), L(offset, 24)]);
const CRACKS = [
  poly([L(11, 11), L(2, 6), L(-6, 9), L(-14, 4)]),
  poly([L(6, 14), L(0, 16), L(-9, 14)]),
];

// 一块格子的全部图形。渐变 id 用 useId 保证同页多块砖互不串色。
function TileArt({ shape }: { shape: TileShape }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const gTop = `t${uid}`;
  const gSideL = `l${uid}`;
  const gSideR = `r${uid}`;
  const gSideC = `c${uid}`;
  const gGlow = `g${uid}`;
  const gShaft = `v${uid}`;
  const d = DEPTH[shape];
  const outline = outlineOf(shape, TILE_HALF);
  const ring = isoCircle(TILE_HALF * 0.8);
  const ringIn = isoCircle(TILE_HALF * 0.56);
  const glow = isoCircle(TILE_HALF * 0.72);
  const haloOutline = outlineOf(shape, TILE_HALF + 9);
  return (
    <svg
      className={cx(s.dsrTile, s[`sh-${shape}`])}
      viewBox={`0 0 ${TILE_W} ${TILE_BOX_H}`}
      aria-hidden
    >
      <defs>
        {/* 顶面: 光从左上来, 事件色三档递减。 */}
        <linearGradient id={gTop} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" className={s.dsGTopA} />
          <stop offset="0.55" className={s.dsGTopB} />
          <stop offset="1" className={s.dsGTopC} />
        </linearGradient>
        <linearGradient id={gSideL} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className={s.dsGSideA} />
          <stop offset="1" className={s.dsGSideB} />
        </linearGradient>
        <linearGradient id={gSideR} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className={s.dsGSiderA} />
          <stop offset="1" className={s.dsGSideB} />
        </linearGradient>
        <linearGradient id={gSideC} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" className={s.dsGSideCylA} />
          <stop offset="0.5" className={s.dsGSideCylB} />
          <stop offset="1" className={s.dsGSideCylC} />
        </linearGradient>
        <radialGradient id={gGlow} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" className={s.dsGGlowA} />
          <stop offset="1" className={s.dsGGlowB} />
        </radialGradient>
        {/* 投影光柱: 事件色自上而下淡出。 */}
        <linearGradient id={gShaft} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className={s.dsGShaftA} />
          <stop offset="1" className={s.dsGShaftB} />
        </linearGradient>
      </defs>

      {/* 投影光柱: 台座底缘向下垂到「投影地板」, 画在最底层。 */}
      {shape === "util" ? (
        <path
          className={s.dsrTileShaft}
          fill={`url(#${gShaft})`}
          d={`M ${TCX - CYL_RX} ${TCY + d} A ${CYL_RX} ${CYL_RY} 0 0 0 ${TCX + CYL_RX} ${TCY + d} L ${TCX + CYL_RX} ${
            TCY + d + SHAFT_LEN
          } A ${CYL_RX} ${CYL_RY} 0 0 1 ${TCX - CYL_RX} ${TCY + d + SHAFT_LEN} Z`}
        />
      ) : (
        outline && (
          <polygon
            className={s.dsrTileShaft}
            fill={`url(#${gShaft})`}
            points={sideBand(outline.front.map((p) => dropBy(p, d)), SHAFT_LEN)}
          />
        )
      )}

      {/* 蚀刻环: 默认以事件色常显。 */}
      {shape === "util" ? (
        <ellipse
          className={s.dsrTileHalo}
          cx={TCX}
          cy={TCY}
          rx={isoCircle(CYL_R + 9).rx}
          ry={isoCircle(CYL_R + 9).ry}
        />
      ) : (
        haloOutline && <polygon className={s.dsrTileHalo} points={poly(haloOutline.top)} />
      )}

      {/* gain 专属外扩基座(台阶)。 */}
      {shape === "gain" && outline && (
        <>
          {(() => {
            const base = outlineOf("gain", TILE_HALF + 5);
            if (!base) return null;
            return (
              <>
                <polygon
                  className={s.dsrTileBase}
                  points={sideBand(base.front.map((p) => dropBy(p, d)), BASE_H)}
                />
                <polygon
                  className={s.dsrTileBaseTop}
                  points={poly(base.top.map((p) => dropBy(p, d)))}
                />
              </>
            );
          })()}
        </>
      )}

      {/* 厚度(能量壁)。 */}
      {shape === "util" ? (
        <>
          <path
            className={s.dsrTileSide}
            fill={`url(#${gSideC})`}
            d={`M ${TCX - CYL_RX} ${TCY} A ${CYL_RX} ${CYL_RY} 0 0 0 ${TCX + CYL_RX} ${TCY} L ${TCX + CYL_RX} ${
              TCY + d
            } A ${CYL_RX} ${CYL_RY} 0 0 1 ${TCX - CYL_RX} ${TCY + d} Z`}
          />
          <path
            className={s.dsrTileFoot}
            d={`M ${TCX - CYL_RX} ${TCY + d} A ${CYL_RX} ${CYL_RY} 0 0 0 ${TCX + CYL_RX} ${TCY + d}`}
          />
        </>
      ) : (
        outline && (
          <>
            {(() => {
              const mid = Math.floor(outline.front.length / 2);
              return (
                <>
                  <polygon
                    className={s.dsrTileSide}
                    fill={`url(#${gSideL})`}
                    points={sideBand(outline.front.slice(0, mid + 1), d)}
                  />
                  <polygon
                    className={s.dsrTileSide}
                    fill={`url(#${gSideR})`}
                    points={sideBand(outline.front.slice(mid), d)}
                  />
                </>
              );
            })()}
            <polyline className={s.dsrTileFoot} points={poly(outline.front.map((p) => dropBy(p, d)))} />
          </>
        )
      )}

      {/* 顶面(能量玻璃)。 */}
      {shape === "util" ? (
        <ellipse className={s.dsrTileTop} cx={TCX} cy={TCY} rx={CYL_RX} ry={CYL_RY} fill={`url(#${gTop})`} />
      ) : (
        outline && <polygon className={s.dsrTileTop} fill={`url(#${gTop})`} points={poly(outline.top)} />
      )}

      {/* 台面细节(图案)。 */}
      {shape === "gain" && (
        <>
          <ellipse className={s.dsrTileRing} cx={TCX} cy={TCY} rx={ring.rx} ry={ring.ry} />
          <ellipse className={s.dsrTileRingIn} cx={TCX} cy={TCY} rx={ringIn.rx} ry={ringIn.ry} />
          {hexCorners(HEX_R).map(([x, y], i) => (
            <circle key={`g${i}`} className={s.dsrTileStud} cx={x} cy={y} r={1.6} />
          ))}
        </>
      )}
      {shape === "util" && (
        <>
          <ellipse className={s.dsrTileRing} cx={TCX} cy={TCY} rx={isoCircle(CYL_R * 0.62).rx} ry={isoCircle(CYL_R * 0.62).ry} />
          <ellipse className={s.dsrTileRingIn} cx={TCX} cy={TCY} rx={isoCircle(CYL_R * 0.4).rx} ry={isoCircle(CYL_R * 0.4).ry} />
          {[45, 135, 225, 315].map((deg, i) => {
            const rad = (deg * Math.PI) / 180;
            const c = Math.cos(rad);
            const sn = Math.sin(rad);
            return (
              <line
                key={`t${i}`}
                className={s.dsrTileTick}
                x1={TCX + CYL_RX * 0.66 * c}
                y1={TCY + CYL_RY * 0.66 * sn}
                x2={TCX + CYL_RX * 0.88 * c}
                y2={TCY + CYL_RY * 0.88 * sn}
              />
            );
          })}
          {[
            [TCX, TCY - CYL_RY],
            [TCX + CYL_RX, TCY],
            [TCX, TCY + CYL_RY],
            [TCX - CYL_RX, TCY],
          ].map(([x, y], i) => (
            <circle key={i} className={s.dsrTileStud} cx={x} cy={y} r={1.7} />
          ))}
        </>
      )}
      {shape === "threat" && (
        <>
          {CRACKS.map((c, i) => (
            <polyline key={i} className={s.dsrTileCrack} points={c} />
          ))}
          <g className={s.dsrTileHazard}>
            <polyline points={hazardStripe(6)} />
            <polyline points={hazardStripe(0)} />
            <polyline points={hazardStripe(-6)} />
          </g>
          <circle className={s.dsrTileDot} cx={L(4, 4)[0]} cy={L(4, 4)[1]} r={1.3} />
          <circle className={s.dsrTileDot} cx={L(9, 7)[0]} cy={L(9, 7)[1]} r={1} />
          <circle className={s.dsrTileDot} cx={L(-2, 10)[0]} cy={L(-2, 10)[1]} r={0.9} />
        </>
      )}
      {shape === "entry" && (
        <polygon className={s.dsrTileInlay} points={poly(corners(TILE_HALF * 0.66))} />
      )}

      {/* 中心光池: 默认常亮。 */}
      <ellipse
        className={s.dsrTileGlow}
        cx={TCX}
        cy={TCY}
        rx={glow.rx}
        ry={glow.ry}
        fill={`url(#${gGlow})`}
      />

      {/* 顶棱高光 / 前缘。 */}
      {shape !== "util" && outline && <polyline className={s.dsrTileRim} points={poly(outline.top)} />}
      {shape === "util" && (
        <ellipse className={s.dsrTileRim} cx={TCX} cy={TCY} rx={CYL_RX} ry={CYL_RY} />
      )}
      {shape === "entry" && <polyline className={s.dsrTileLead} points={poly([corners(TILE_HALF)[0], corners(TILE_HALF)[1]])} />}

      {/* 彩色底缘灯带。 */}
      {shape === "util" ? (
        <path
          className={s.dsrTileGlowEdge}
          d={`M ${TCX - CYL_RX} ${TCY + d} A ${CYL_RX} ${CYL_RY} 0 0 0 ${TCX + CYL_RX} ${TCY + d}`}
        />
      ) : (
        outline && (
          <polyline
            className={s.dsrTileGlowEdge}
            points={poly(outline.front.map((p) => dropBy(p, d)))}
          />
        )
      )}

      {shape === "entry" && (
        <>
          <polyline className={s.dsrEntryFlow} points={poly([L(-14, 0), L(14, 0)])} />
          <polyline className={s.dsrEntryChevron} points={poly([L(-6, -10), L(5, 0), L(-6, 10)])} />
          <polyline className={s.dsrEntryChevron} points={poly([L(-16, -10), L(-5, 0), L(-16, 10)])} />
        </>
      )}
    </svg>
  );
}

function tileBox(x: number, y: number): CSSProperties {
  return {
    left: `${x - TILE_W / 2 + TILE_NUDGE_X}px`,
    top: `${y - TILE_TOP_H / 2 + TILE_NUDGE_Y}px`,
    width: `${TILE_W}px`,
    height: `${TILE_BOX_H}px`,
    "--foot": `${(TILE_BOX_H - TILE_TOP_H / 2 - 2).toFixed(1)}px`,
  } as CSSProperties;
}

// ===================== 悬浮星徽(sigil) =====================
// 取代 v2 的 3D 家具: 事件 = 一枚悬浮在台面上的发光徽记。
// 区分回到「徽记轮廓」: 十字 / 货箱 / 滤罐 / 终端 / 分叉 / 三角, 每枚配一圈旋转虚线环。

function glyph(kind: DsNodeKind): ReactNode {
  switch (kind) {
    case "heal":
      return (
        <>
          <circle cx="24" cy="24" r="15" strokeWidth={1.2} opacity={0.45} />
          <path d="M24 15v18M15 24h18" strokeWidth={1.8} />
        </>
      );
    case "loot":
      return (
        <>
          <path d="M9 17h30v23H9z" strokeWidth={1.7} />
          <path d="M9 17l4-8h22l4 8" strokeWidth={1.2} opacity={0.55} />
          <path d="M24 17v23" strokeWidth={1.2} opacity={0.6} />
          <path d="M20 25h8v5h-8z" strokeWidth={1.5} />
        </>
      );
    case "energy":
      return (
        <>
          <path d="M17 8h14l-2 12 4 20H15l4-20z" strokeWidth={1.7} />
          <circle cx="24" cy="29" r="1.6" strokeWidth={1.2} opacity={0.7} />
          <circle cx="20" cy="34" r="1.2" strokeWidth={1.2} opacity={0.5} />
          <circle cx="28" cy="33" r="1.2" strokeWidth={1.2} opacity={0.5} />
        </>
      );
    case "merchant":
      return (
        <>
          <path d="M12 7h24v35H12z" strokeWidth={1.7} />
          <path d="M17 12h9v15h-9z" strokeWidth={1.2} opacity={0.55} />
          <path d="M30 12h3M30 17h3M30 22h3" strokeWidth={1.2} opacity={0.55} />
          <path d="M17 33h14" strokeWidth={1.4} />
        </>
      );
    case "route":
      return (
        <>
          <path d="M24 42V27l10-10V6" strokeWidth={1.7} />
          <path d="M24 27L14 17V6" strokeWidth={1.4} opacity={0.6} />
          <circle cx="24" cy="27" r="2.6" strokeWidth={1.7} />
        </>
      );
    case "hazard":
      return (
        <>
          <path d="M24 8L42 39H6z" strokeWidth={1.7} />
          <path d="M24 20v9" strokeWidth={1.7} />
          <path d="M24 33.5v.01" strokeWidth={2.4} />
        </>
      );
  }
}

function Sigil({ kind }: { kind: DsNodeKind }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle className={s.sigilRing} cx="24" cy="24" r="19" />
      <circle className={s.sigilRingSpin} cx="24" cy="24" r="15.5" />
      <g className={s.sigilDepth} transform="translate(0 1.2)">
        {glyph(kind)}
      </g>
      <g>{glyph(kind)}</g>
    </svg>
  );
}

// ===================== 玩家: 光核信使 =====================
// 一道光柱顶着一枚悬浮晶核(取代 v2 的几何小人)。

function Pawn() {
  return (
    <g className={s.dsrPawnBody}>
      <ellipse className={s.dsrPawnShadow} cx={0} cy={0} rx={13} ry={5} />
      <polygon className={s.dsrPawnBeam} points={poly([[-3, 0], [3, 0], [7, -34], [-7, -34]])} />
      <g className={s.dsrPawnIdle}>
        <polygon className={s.dsrPawnDark} points={poly([[-8, -40], [0, -36], [0, -46], [-8, -50]])} />
        <polygon className={s.dsrPawnMid} points={poly([[0, -36], [8, -40], [8, -50], [0, -46]])} />
        <polygon className={s.dsrPawnLit} points={poly([[-8, -50], [0, -46], [8, -50], [0, -56]])} />
        <circle className={s.dsrPawnCore} cx={0} cy={-45} r={3.4} />
      </g>
    </g>
  );
}

// 段内折线 → 屏幕折线。
function segmentPoints(
  segment: RouteSegment,
  laneIn: number,
  rows: number,
  segIndex: number,
): P2[] {
  const startU = segIndex === 0 ? nodeU(-1) : nodeU(segIndex - 1);
  const pts: P2[] = [pt(startU, laneIn)];
  const { steps } = traceSegment(segment, laneIn, rows);
  for (const st of steps) {
    if (st.movedFrom == null) continue;
    const u = bridgeU(segIndex, st.row, rows);
    pts.push(pt(u, st.movedFrom));
    pts.push(pt(u, st.lane));
  }
  pts.push(pt(nodeU(segIndex), steps[steps.length - 1].lane));
  return pts;
}

// ===================== 演示数据 =====================

const KIND_LABELS: Record<DsNodeKind, string> = {
  heal: "补给",
  loot: "战利品",
  energy: "能量",
  merchant: "商人",
  route: "路由",
  hazard: "风险",
};

const KIND_COLORS: Record<DsNodeKind, string> = {
  heal: "#41e2a4",
  loot: "#e8b95c",
  energy: "#4fd3e8",
  merchant: "#b7a2ef",
  route: "#8fb8d8",
  hazard: "#ff7a4d",
};

type DemoRisk = "negative" | "highRisk" | null;

const RISK_COLORS: Record<Exclude<DemoRisk, null>, string> = {
  negative: "#ff5a4d",
  highRisk: "#ffb020",
};

interface DemoNode {
  id: string;
  kind: DsNodeKind;
  risk: DemoRisk;
  title: string;
  description: string;
  reward: string;
}

function demoNode(kind: DsNodeKind, risk: DemoRisk, title: string, description: string, reward: string): DemoNode {
  return { id: `ds-${title}`, kind, risk, title, description, reward };
}

const DEMO_NODES: DemoNode[][] = [
  [
    demoNode("heal", null, "医疗补给站", "半埋在瓦砾里的医疗箱仍然通电, 界面上的绿灯一明一灭。", "回复 12% 生命"),
    demoNode("loot", null, "遗留货箱", "一支运输队留下的密封货箱, 标签还贴着上次清点的日期。", "物资 +18"),
    demoNode("energy", null, "净化结晶", "墙缝里析出一簇淡蓝色的净化结晶, 在暗处幽幽发光。", "净化粒子 +4"),
    demoNode("heal", null, "应急淋浴间", "废弃宿舍的应急淋浴间, 水管里居然还能放出干净的水。", "休整一次"),
    demoNode("route", null, "监控终端", "楼层监控终端的屏幕还亮着, 上面滚动着下一层的地图数据。", "路线情报"),
  ],
  [
    demoNode("merchant", null, "流动商贩", "一个裹着旧斗篷的商贩蹲在货栈门口, 摊子上摆着几件旧货。", "3 项交易"),
    demoNode("heal", null, "自动医务舱", "墙角的自动医务舱在低声嗡鸣, 舱门上的消毒灯是绿色的。", "回复 10% 生命"),
    demoNode("hazard", "negative", "泄漏管道", "天花板上的冷却管在渗液, 滴落处的地板被腐蚀出一圈黑斑。", "污染 +1"),
    demoNode("loot", null, "员工储物柜", "一整排员工储物柜, 有几格的门锁已经锈断。", "物资 +22"),
    demoNode("energy", null, "备用电池组", "配电间里码着几组备用电池, 指示灯还亮着两格。", "净化粒子 +3"),
  ],
  [
    demoNode("route", null, "楼层导览台", "楼层导览台的光屏闪烁了一下, 吐出一张模糊的立体地图。", "路线情报"),
    demoNode("energy", null, "数据溪流", "断裂的光纤束垂在墙上, 像一条发光的溪流, 数据还在里面流淌。", "净化粒子 +3"),
    demoNode("merchant", null, "黑市终端", "一台被改装过的自动售货机, 收的是信用点, 卖的是好东西。", "2 项交易"),
    demoNode("heal", null, "净化花房", "玻璃房里养着一小片会发光的植物, 空气里是湿润的泥土味。", "回复 14% 生命"),
    demoNode("hazard", "highRisk", "高压电弧", "断裂的电缆在半空甩动, 电弧把整条走廊照得忽明忽暗。", "高风险"),
  ],
  [
    demoNode("loot", null, "军械库残箱", "军械库的残骸里散落着几个没被撬开的装备箱。", "装备 ×1"),
    demoNode("hazard", "negative", "塌落隔断", "这段走廊的天花板塌了一半, 只有侧面的窄缝能挤过去。", "体力 -6"),
    demoNode("route", null, "服务器矩阵", "嗡嗡作响的服务器矩阵, 监控着这层楼每一扇门的开关。", "路线情报"),
    demoNode("route", null, "货梯间", "一部还能运行的货梯, 直达地下停车场 —— 随时可以撤离。", "撤离点"),
    demoNode("merchant", null, "档案贩子", "一个戴目镜的男人在兜售楼层档案, 他好像什么都知道一点。", "1 项交易"),
  ],
];

const DEMO_SEGMENTS: RouteSegment[] = [
  { index: 0, bridges: [{ row: 1, leftLane: 1 }, { row: 3, leftLane: 3 }] },
  { index: 1, bridges: [{ row: 0, leftLane: 2 }, { row: 2, leftLane: 0 }] },
  { index: 2, bridges: [{ row: 0, leftLane: 1 }, { row: 2, leftLane: 3 }, { row: 3, leftLane: 0 }] },
  { index: 3, bridges: [{ row: 0, leftLane: 3 }, { row: 1, leftLane: 0 }, { row: 2, leftLane: 2 }] },
];

const DEMO_BOARD: RouteBoardData = {
  round: 1,
  laneCount: LANE_COUNT,
  rowsPerSegment: 4,
  segments: DEMO_SEGMENTS,
  nodes: DEMO_NODES.map((row, seg) =>
    row.map(
      (n, lane): NodeEvent => ({
        id: n.id,
        kind: n.kind as NodeEventKind,
        category:
          n.kind === "heal"
            ? "survival"
            : n.kind === "merchant" || n.kind === "loot"
              ? "economy"
              : n.kind === "energy"
                ? "energy"
                : n.kind === "hazard"
                  ? "hazard"
                  : "route",
        risk: n.risk ?? undefined,
        title: n.title,
        description: n.description,
        energyDelta: 0,
      }),
    ),
  ),
  revealDurationMs: 3000,
  blockedLanes: [4],
};

// ===================== 悬浮详情卡 =====================

function NodeCard({ node, x, y, seg, lane }: { node: DemoNode; x: number; y: number; seg: number; lane: number }) {
  return (
    <div
      className={s.dsrCard}
      style={
        {
          left: `${x}px`,
          top: `${y - ICON_H - TILE_TOP_H / 2 - 14}px`,
          "--k": node.risk ? RISK_COLORS[node.risk] : KIND_COLORS[node.kind],
        } as CSSProperties
      }
      role="status"
    >
      <span className={s.dsrCardSeg}>
        第 {seg + 1} 推进段 · {KIND_LABELS[node.kind]} · {ENTRY_LABELS[lane]} 通道
      </span>
      <strong className={s.dsrCardTitle}>{node.title}</strong>
      <p className={s.dsrCardDesc}>{node.description}</p>
      <span className={s.dsrCardReward}>{node.reward}</span>
      {node.risk && <span className={s.dsrCardRisk}>{node.risk === "highRisk" ? "高风险" : "纯负面"}</span>}
    </div>
  );
}

// ===================== 棋盘(一轮演出) =====================

interface RunProps {
  bridgesVisible: boolean;
  pathVisible: boolean;
}

function BoardRun({ bridgesVisible, pathVisible }: RunProps) {
  const rows = DEMO_BOARD.rowsPerSegment;
  const [generating, setGenerating] = useState(true);
  const [hoverLane, setHoverLane] = useState<number | null>(null);
  const [hoverNode, setHoverNode] = useState<{ seg: number; lane: number } | null>(null);
  const [entryLane, setEntryLane] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [walking, setWalking] = useState(false);

  useEffect(() => {
    if (!generating) return;
    const ms = prefersReducedMotion() ? GENERATE_REDUCED_MS : GENERATE_MS;
    const id = window.setTimeout(() => setGenerating(false), ms);
    return () => window.clearTimeout(id);
  }, [generating]);

  const lanes = useMemo(() => {
    if (entryLane == null) return [];
    const out = [entryLane];
    let lane = entryLane;
    for (let i = 0; i < SEG_COUNT; i++) {
      lane = traceSegment(DEMO_BOARD.segments[i], lane, rows).laneOut;
      out.push(lane);
    }
    return out;
  }, [entryLane, rows]);

  const legPoints = useMemo<P2[]>(() => {
    if (!walking || entryLane == null || progress >= SEG_COUNT) return [];
    return segmentPoints(DEMO_BOARD.segments[progress], lanes[progress], rows, progress);
  }, [walking, entryLane, lanes, progress, rows]);

  const donePoints = useMemo<P2[]>(() => {
    if (entryLane == null || progress === 0) return [];
    const out: P2[] = [];
    for (let i = 0; i < progress; i++) {
      const pts = segmentPoints(DEMO_BOARD.segments[i], lanes[i], rows, i);
      out.push(...(i === 0 ? pts : pts.slice(1)));
    }
    return out;
  }, [entryLane, lanes, progress, rows]);

  const legPath = useMemo(() => pathOf(legPoints), [legPoints]);
  const legLen = useMemo(() => lengthOf(legPoints), [legPoints]);
  const travelMs = Math.min(SIGNAL_MAX_MS, Math.max(SIGNAL_MIN_MS, legLen / SIGNAL_SPEED));
  const pawnDoneMs = travelMs + travelMs * PAWN_SPEED_DIV;

  const ripples = useMemo(() => {
    const out: { x: number; y: number; t: number }[] = [];
    if (legPoints.length < 2 || legLen <= 0) return out;
    let cum = 0;
    for (let i = 1; i < legPoints.length; i++) {
      const [px, py] = legPoints[i - 1];
      const [x, y] = legPoints[i];
      cum += Math.hypot(x - px, y - py);
      if (py !== y || i === legPoints.length - 1) out.push({ x, y, t: (cum / legLen) * travelMs });
    }
    return out;
  }, [legPoints, legLen, travelMs]);

  useEffect(() => {
    if (!walking || legPoints.length < 2) return;
    const id = window.setTimeout(() => {
      const next = progress + 1;
      setProgress(next);
      if (next >= SEG_COUNT) setWalking(false);
    }, pawnDoneMs + SEG_TAIL_MS);
    return () => window.clearTimeout(id);
  }, [walking, progress, legPath, legPoints.length, pawnDoneMs]);

  const motionRef = useRef<SVGElement | null>(null);
  useEffect(() => {
    if (!walking || legPoints.length < 2) return;
    (motionRef.current as SVGAnimationElement | null)?.beginElement();
  }, [walking, legPath, legPoints.length]);

  const pawnAt = useMemo(() => {
    if (entryLane == null) return null;
    if (progress === 0) return nodeCenter(-1, entryLane);
    return nodeCenter(progress - 1, lanes[progress]);
  }, [entryLane, lanes, progress]);

  // 画家算法: 屏幕上越靠下的格子越近, 必须后画。
  const sortedNodes = useMemo(() => {
    const out: { node: DemoNode; seg: number; lane: number }[] = [];
    for (let seg = 0; seg < SEG_COUNT; seg++) {
      for (let lane = 0; lane < LANE_COUNT; lane++) {
        out.push({ node: DEMO_NODES[seg][lane], seg, lane });
      }
    }
    return out.sort((a, b) => laneS(a.lane) - nodeU(a.seg) - (laneS(b.lane) - nodeU(b.seg)));
  }, []);

  const activeLane = entryLane == null ? null : lanes[Math.min(progress, SEG_COUNT)];
  const interactive = !generating && !walking;
  const hoverNodeData = hoverNode ? DEMO_NODES[hoverNode.seg][hoverNode.lane] : null;
  const hoverPos = hoverNode ? nodeCenter(hoverNode.seg, hoverNode.lane) : null;
  const stateWord = generating ? "投影生成" : walking ? "信号推进" : entryLane == null ? "选择入口" : "已落位";

  return (
    <div
      className={cx(s.dsrRoot, generating && s.isGenerating)}
      style={{ width: `${BOARD_W}px`, height: `${BOARD_H}px` }}
    >
      {generating && (
        <span className={s.dsrScanClip} aria-hidden>
          <span className={s.dsrScan} />
        </span>
      )}

      <svg className={s.dsrSvg} viewBox={`0 0 ${BOARD_W} ${BOARD_H}`} style={{ height: `${BOARD_H}px` }} aria-hidden>
        {Array.from({ length: DEMO_BOARD.laneCount }, (_, lane) => {
          const live = hoverLane === lane;
          const dim = activeLane != null && lane !== activeLane;
          const runs: [number, number][] = [];
          for (let seg = 0; seg < SEG_COUNT; seg++) {
            runs.push([nodeU(seg - 1) + TILE_INSET, nodeU(seg) - TILE_INSET]);
          }
          return (
            <g key={lane} className={cx(s.dsrLane, live && s.isLive, dim && s.isDim)} style={{ "--i": lane } as CSSProperties}>
              {runs.map(([u0, u1], i) => (
                <Pipe key={i} a={pt(u0, lane)} b={pt(u1, lane)} j={i} />
              ))}
            </g>
          );
        })}

        <g className={cx(s.dsrBridges, !bridgesVisible && s.isHidden)}>
          {DEMO_BOARD.segments.flatMap((seg) =>
            seg.bridges.map((b) => (
              <g key={`${seg.index}-${b.row}-${b.leftLane}`} className={s.dsrBridge}>
                <Pipe
                  a={pt(bridgeU(seg.index, b.row, rows), b.leftLane)}
                  b={pt(bridgeU(seg.index, b.row, rows), b.leftLane + 1)}
                />
              </g>
            )),
          )}
        </g>

        {donePoints.length > 1 && pathVisible && <path className={s.dsrTraceDone} d={pathOf(donePoints)} />}

        {walking && legPoints.length > 1 && pathVisible && (
          <g key={`${DEMO_BOARD.round}-${progress}`}>
            <path
              className={s.dsrTraceLine}
              d={legPath}
              style={{ "--len": legLen, animationDuration: `${travelMs}ms` } as CSSProperties}
            />
            <path
              className={s.dsrTraceComet}
              d={legPath}
              style={
                {
                  "--len": legLen,
                  strokeDasharray: `150 ${legLen}`,
                  animationDuration: `${travelMs}ms`,
                } as CSSProperties
              }
            />
            {ripples.map((r, i) => (
              <circle
                key={i}
                className={s.dsrRipple}
                cx={r.x}
                cy={r.y}
                r={5}
                style={{ animationDelay: `${Math.round(r.t)}ms` } as CSSProperties}
              />
            ))}
            <circle className={s.dsrSignal} r={9}>
              <animateMotion dur={`${travelMs}ms`} path={legPath} fill="freeze" calcMode="linear" />
            </circle>
          </g>
        )}
      </svg>

      {/* ── 入口 A-E ── */}
      <div className={s.dsrEntries}>
        {Array.from({ length: DEMO_BOARD.laneCount }, (_, lane) => {
          const blocked = DEMO_BOARD.blockedLanes.includes(lane);
          const active = entryLane === lane;
          const usable = interactive && entryLane == null && !blocked;
          const c = nodeCenter(-1, lane);
          return (
            <button
              key={lane}
              type="button"
              className={cx(s.dsrEntry, active && s.isActive, blocked && s.isBlocked)}
              style={{ ...tileBox(c.x, c.y), "--i": lane, "--float-del": `${-lane * 0.5}s` } as CSSProperties}
              disabled={!usable}
              onPointerEnter={() => usable && setHoverLane(lane)}
              onPointerLeave={() => setHoverLane((l) => (l === lane ? null : l))}
              onFocus={() => usable && setHoverLane(lane)}
              onBlur={() => setHoverLane((l) => (l === lane ? null : l))}
              onClick={() => {
                setEntryLane(lane);
                setHoverLane(null);
                setHoverNode(null);
                setWalking(true);
              }}
            >
              <TileArt shape="entry" />
              <span className={s.dsrEntryBeam} aria-hidden />
              <span className={s.dsrEntryLetter}>{ENTRY_LABELS[lane] ?? lane + 1}</span>
            </button>
          );
        })}
      </div>

      {/* ── 20 个事件节点(深度排序) ── */}
      <div className={cx(s.dsrNodes, !interactive && s.isInert)}>
        {sortedNodes.map(({ node, seg, lane }) => {
          const { x, y } = nodeCenter(seg, lane);
          const landed = entryLane != null && lanes[seg + 1] === lane && seg < progress;
          const isCurrent = landed && seg === progress - 1;
          const settled = landed && seg < progress - 1;
          const hovered = hoverNode?.seg === seg && hoverNode?.lane === lane;
          return (
            <button
              key={`${seg}-${lane}-${node.id}`}
              type="button"
              className={cx(
                s.dsrNode,
                isCurrent && s.isCurrent,
                settled && s.isSettled,
                hovered && s.isHovered,
                node.risk && s[`r-${node.risk}`],
              )}
              style={
                {
                  ...tileBox(x, y),
                  "--k": settled ? "#63707a" : node.risk ? RISK_COLORS[node.risk] : KIND_COLORS[node.kind],
                  "--float-del": `${-(seg * 5 + lane) * 0.37}s`,
                  "--i": seg * 5 + lane,
                  "--seg": seg,
                  "--lane": lane,
                } as CSSProperties
              }
              tabIndex={interactive ? 0 : -1}
              disabled={!interactive}
              onPointerEnter={() => setHoverNode({ seg, lane })}
              onPointerLeave={() => setHoverNode(null)}
              onFocus={() => setHoverNode({ seg, lane })}
              onBlur={() => setHoverNode(null)}
            >
              <TileArt shape={KIND_SHAPE[node.kind]} />
              <span className={s.dsrSigilBeam} aria-hidden />
              <span className={s.dsrSigil} aria-hidden>
                <Sigil kind={node.kind} />
              </span>
            </button>
          );
        })}
      </div>

      {/* ── 光核信使(单独一层, 压在砖层之上) ── */}
      {entryLane != null && (
        <svg
          className={s.dsrPawnLayer}
          viewBox={`0 0 ${BOARD_W} ${BOARD_H}`}
          style={{ height: `${BOARD_H}px`, transform: `translate(${TILE_NUDGE_X}px, ${TILE_NUDGE_Y}px)` }}
          aria-hidden
        >
          {walking && legPoints.length > 1 ? (
            <g key={`${DEMO_BOARD.round}-${progress}-walk`} className={cx(s.dsrPawn, s.isWalking)}>
              <Pawn />
              <animateMotion
                ref={motionRef}
                begin="indefinite"
                dur={`${Math.round(pawnDoneMs)}ms`}
                path={legPath}
                keyPoints="0;0;1"
                keyTimes={`0;${(travelMs / pawnDoneMs).toFixed(4)};1`}
                fill="freeze"
                calcMode="linear"
              />
            </g>
          ) : (
            pawnAt && (
              <g className={s.dsrPawn} style={{ transform: `translate(${pawnAt.x}px, ${pawnAt.y}px)` }}>
                <Pawn />
              </g>
            )
          )}
        </svg>
      )}

      {hoverNode && hoverNodeData && hoverPos && (
        <NodeCard node={hoverNodeData} x={hoverPos.x} y={hoverPos.y} seg={hoverNode.seg} lane={hoverNode.lane} />
      )}

      {/* ── 画面 HUD ── */}
      <div className={s.dsrHud} aria-hidden>
        <span className={s.hudState}>{stateWord}</span>
        <span className={s.hudEntry}>ENTRY {entryLane == null ? "—" : ENTRY_LABELS[entryLane]}</span>
        <span className={s.hudSeg}>SEG {progress} / 4</span>
      </div>
    </div>
  );
}

// ===================== 页面外壳 =====================

// 星点: 伪随机但确定的位置与节奏(不随重渲染抖动)。
const STARS = Array.from({ length: 46 }, (_, i) => {
  const a = (i * 137.508) % 360;
  const r = ((i * 47) % 60) + 10;
  const cx = 50 + r * Math.cos((a * Math.PI) / 180);
  const cy = 46 + r * 0.52 * Math.sin((a * Math.PI) / 180);
  return {
    left: `${cx.toFixed(1)}%`,
    top: `${cy.toFixed(1)}%`,
    "--sz": `${1 + (i % 3) * 0.6}px`,
    "--drift": `${((i % 5) - 2) * 1.6}px`,
    "--dur": `${16 + (i % 7) * 4}s`,
    "--del": `${-(i % 9) * 2.3}s`,
    opacity: 0.2 + ((i * 31) % 45) / 100,
  } as CSSProperties;
});

export function DsRouteBoard() {
  const [runKey, setRunKey] = useState(0);
  const [bridgesVisible, setBridgesVisible] = useState(true);
  const [pathVisible, setPathVisible] = useState(true);
  const tiltRef = useRef<HTMLDivElement | null>(null);

  // 视差轻摆: 直接写 CSS 变量(零重渲染), 悬停离开时回正。
  const onTilt = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = tiltRef.current;
    if (!el || prefersReducedMotion()) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty("--ry", `${(nx * 4).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${(-ny * 3).toFixed(2)}deg`);
  };
  const onTiltReset = () => {
    const el = tiltRef.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  return (
    <div className={s.demo}>
      <header className={s.head}>
        <div>
          <span className={s.kicker}>DS ROUTE BOARD / HOLO PROJECTION</span>
          <h2 className={s.title}>区域路线图 · 星图投影</h2>
        </div>
        <div className={s.actions}>
          <button type="button" className={bridgesVisible ? s.on : undefined} onClick={() => setBridgesVisible((v) => !v)}>
            {bridgesVisible ? "隐藏桥接" : "显示桥接"}
          </button>
          <button type="button" className={pathVisible ? s.on : undefined} onClick={() => setPathVisible((v) => !v)}>
            {pathVisible ? "隐藏路径" : "显示路径"}
          </button>
          <button type="button" onClick={() => setRunKey((k) => k + 1)}>
            重开本轮
          </button>
        </div>
      </header>

      <p className={s.hint}>
        悬停节点看详情卡 · 悬停入口点亮整条通道 · 点入口后沿路线连播 4 段推进 ——
        台座是悬浮的投影体(三种造型 + 投影光柱), 事件是一枚浮在台面上的星徽, 棋盘随鼠标轻摆
      </p>

      <div className={s.stage}>
        <div
          className={s.scene}
          style={{ width: `${BOARD_W}px`, height: `${BOARD_H}px` }}
          onPointerMove={onTilt}
          onPointerLeave={onTiltReset}
        >
          {/* 深空虚空: 星点 + 底部投影基座(光圈与同心环)。 */}
          <span className={s.dsrVoid} aria-hidden />
          <span className={s.dsrStars} aria-hidden>
            {STARS.map((vars, i) => (
              <i key={i} style={vars} />
            ))}
          </span>
          <span className={s.dsrBase} aria-hidden />
          <div className={s.tiltWrap} ref={tiltRef}>
            <BoardRun key={runKey} bridgesVisible={bridgesVisible} pathVisible={pathVisible} />
          </div>
        </div>
      </div>

      <footer className={s.legend}>
        <span>
          <i className={s.legendGain} aria-hidden="true" />充能台
        </span>
        <span>
          <i className={s.legendUtil} aria-hidden="true" />服务台
        </span>
        <span>
          <i className={s.legendThreat} aria-hidden="true" />破损台
        </span>
        <span>
          <i className={s.legendEntry} aria-hidden="true" />入口
        </span>
        <span>
          <i className={s.legendTrace} aria-hidden="true" />玩家路径
        </span>
      </footer>
    </div>
  );
}
