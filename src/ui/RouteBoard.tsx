// ★ 区域路由图(等距瓦片战棋视角) ★ —— 探索页的主体交互, 见 探索模式设计.md §2 与 §11.1。
//
// 一轮 = 一张 5 通道 × 4 推进段的图。各阶段各对应一种画面, 全部落在同一张 SVG 上:
//   generating —— 棋盘沿推进方向(左下 → 右上)逐条浮现(起点地板 → 水管 → 节点地板), 共 GENERATE_MS; 全程不可交互。
//                 ⚠ 桥接自始至终不出现 —— 这一段是「浮现仪式」, 不是信息展示。
//   sealed    —— 图已浮现完、桥接仍遮蔽, 正中悬一个「探索路线」按钮。不限时。
//   revealing —— **全图 4 段桥接一次性全显** + 顶部倒计时; 玩家在这 2-3 秒里用眼睛记。
//                只能由 sealed 阶段按下按钮进入, 一轮仅此一次。
//   choosingEntry —— 桥接整体淡出到 opacity:0(⚠ 只改 opacity, **不卸载**: DOM 里留着才不会被
//                「查看元素」看穿); 入口通道 A-E 变成可点按钮。★ 全轮唯一一次自由选择。
//   advancing —— 信号沿当前推进段的折线前进: 顺主管朝右上 → 走到岔口拐上桥管 → 落到隔壁通道。
//   landed / resolving / atNode —— 落点地板被「撞」一下并高亮, 已走过的路径保持点亮;
//                浮层(先选分支、再看结算、再决定推不推进)由 ExploreScreen 负责, 不在这一层。
//   routeDisclosure —— 全图桥接常亮 + 玩家的实际路径整条描出 + 放弃掉的剩余节点压暗(§11.2)。
//
// ★ 投影方式(§11.1): **经典战棋的等距(平行)投影**, 2:1 斜率, 地板尺寸全程恒定, 绝不用透视 ——
//   透视会让第 3、4 段的桥接变小变密, 玩家会归因为「看不清」而不是「没记住」, 那是视觉不公平。
//   整张棋盘沿「左下 → 右上」铺开, 四个方向分别指向左上 / 右上 / 左下 / 右下:
//     推进轴(沿通道向前) = 左下 → 右上   通道轴(跨到隔壁通道) = 左上 → 右下
//   世界坐标 (u = 沿推进轴的距离, s = 沿通道轴的偏移) → 屏幕坐标是这两条单位向量的线性组合。
//
// ★ 呈现方式: **瓦片地板 + 小水管**。起点与 20 个节点都是一块等距瓦片地板(正方形地板的等距投影
//   = 2:1 菱形 + 厚度), 地板上**站着**一个立体感的事件图标(起点站的是立体字母 A-E);
//   地板之间用细圆柱小水管相连(暗轮廓 + 管身 + 顶部细高光 + 圆头端帽塞进地板边缘)。
//   ⚠ **桥接用的是与主管完全相同的水管**, 没有独立材质 —— 这是刻意的(见下)。
//
//   ⚠ 等距下两条轴都是斜线, §11.1 点名的唯一真实风险是它们**形状撞车**。旧版靠「走廊平台 vs
//     发光天桥」两种材质来区分; 本版取消了那套材质对立, 风险改由三件事承担, ⚠ 改动本文件时
//     务必保住这三条, 否则那条风险会原样回来:
//       ① 两条轴的**屏幕朝向天然相反** —— 主管朝右上, 桥管朝右下;
//       ② **地板只长在推进轴上** —— 串着地板的那条水管就是通道, 横着搭的那根没有地板;
//       ③ 桥管**平时根本不在画面上**(沿用只改 opacity 的遮蔽机制), 它一出现就只可能是「跨道」。
//
// ★ 本文件所有坐标都是「设计 px」, 与 stage.ts 的 1920×1080 画布同一套尺度 ——
//   面板由 ExploreScreen 定位, 这里只管面板内部的构图。改版式直接改下面的常量。

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { traceSegment } from "../explore/route";
import type {
  ExplorePhase,
  NodeEventKind,
  RouteBoard as RouteBoardData,
  RouteSegment,
} from "../explore/types";
import "./RouteBoard.css";

// ===================== 版式旋钮(设计 px) =====================
// ★ 等距投影的两条轴(经典战棋的斜 45°/2:1 棋盘)：
//     推进轴 = 左下 → 右上   (+0.894, −0.447)
//     通道轴 = 左上 → 右下   (+0.894, +0.447)
//   两条轴各自的**屏幕方向不同**(一条向上、一条向下), 四个角分别指向左上/右上/左下/右下,
//   整张图因此是一块斜置的棋盘, 而不是一张平推的横条。
//   2:1 的斜率(每前进 2 个横向单位下降 1 个)是战棋等距的标准比例, 也保证地板尺寸恒定。
const ADV_X = 0.894; // 推进轴单位向量
const ADV_Y = -0.447;
const LANE_X = 0.894; // 通道轴单位向量
const LANE_Y = 0.447;

// ⚠ 这三个间距比上一版(110 / 180 / 100)大一档: 地板比原来的走廊平台窄得多, 沿用旧间距会
//   让整块面板缩水约 150×120px, 在 ExploreScreen 的版式里塌成一小块。放大后面板尺寸与旧版持平。
const ENTRY_RUN = 125; // 入口 → 第 1 段节点的推进距离(沿推进轴)
const SEG_PITCH = 200; // 相邻两段节点之间的推进距离(沿推进轴)
const RUN_OUT = 50; // 第 4 段节点之后的水管延伸(信号「继续向前」的去向)
const LANE_GAP = 124; // 相邻通道的中心距(沿通道轴)

const TILE_HALF = 20; // 地板在世界坐标里的半边长(⇒ 正方形边长 40)
const TILE_D = 9; // 地板厚度(纯屏幕垂直方向)
const ICON_H = 40; // 站在地板上的图标高度 —— 同时就是面板上边界要留的净空
const ENTRY_U = -96; // 起点地板的推进坐标(第 1 段节点之前一格)
const TILE_INSET = 22; // 水管两端从地板中心往里缩多少 ⇒ 圆头端帽正好塞进地板边缘
const GLOSS_LIFT = 3; // 管身高光整条上移多少 ⇒ 光从上方来

// 地板整块相对「水管中线交点」的视觉微调(纯观感旋钮, 不动任何投影计算)。
// ⚠ 几何上地板顶面中心本来就精确落在水管中线上, 但地板是带厚度的立方体:
//   厚度全长在顶面**下方**, 眼睛读到的「方块中心」因此比顶面中心偏右下, 水管看起来没插在正中。
//   这里把整块地板(连同站在上面的图标与投影, 它们都是按钮的子元素)朝左上挪回来一点。
//   调大 = 挪得更多; 两个值都是屏幕 px, 与投影轴无关。
const TILE_NUDGE_X = -6;
const TILE_NUDGE_Y = -5;

// 地板顶面 = 世界坐标里 (u,s) = 中心 ± TILE_HALF 的正方形, 投影后是标准 2:1 菱形。
// 四角投影: (+h,+h)→(+1.788h, 0)  (+h,−h)→(0, −0.894h)  (−h,−h)→(−1.788h, 0)  (−h,+h)→(0, +0.894h)
const TILE_W = 2 * TILE_HALF * (ADV_X + LANE_X); // 菱形屏幕宽 ≈ 71.5
const TILE_TOP_H = 2 * TILE_HALF * (LANE_Y - ADV_Y); // 菱形屏幕高 ≈ 35.8(正好是宽的一半)
const TILE_BOX_H = TILE_TOP_H + TILE_D; // 连厚度一起的按钮盒高

const ENTRY_LABELS = ["A", "B", "C", "D", "E"];

// 信号点的行进速度(设计 px / ms)与时长夹逼。
// ⚠ 比上一版更慢(0.75 → 0.42): §11.2 要求「足够慢地逐格经过主管与桥管」——
//   推进动画是每个推进段的核心仪式感, 快了就只剩一个结果通知。
const SIGNAL_SPEED = 0.42;
const SIGNAL_MIN_MS = 900;
const SIGNAL_MAX_MS = 2200;
const SIGNAL_TAIL_MS = 260; // 抵达节点后多停一拍再结算, 免得画面一到就跳

// ★ 生成演出总时长。RouteBoard.css 的 rbGen* 关键帧按这条时间轴排:
//   起点地板 0-500 / 水管逐条 400-1500 / 节点地板 1200-2000。**改这里必须同步改那几段的 delay+duration**,
//   否则 ExploreScreen 的定时器会比画面早或晚落地。reduced-motion 走下面的压缩值。
export const GENERATE_MS = 2000;
export const GENERATE_REDUCED_MS = 320;

const SEG_COUNT = 4;

// ===================== 坐标换算 =====================
// 世界坐标是 (u, s):
//   u = 沿**推进轴**走了多远(px), s = 沿**通道轴**偏移了多少(px, s = lane × LANE_GAP 即通道中线)。
// 屏幕坐标由上面两条单位向量线性组合而成 —— 平行投影, 瓦片尺寸全程恒定, 绝不用透视(§11.1)。
const LANE_COUNT = 5;

// 第 seg 段节点的推进距离(u)。seg = -1 表示起点地板。
function nodeU(seg: number): number {
  return seg < 0 ? ENTRY_U : ENTRY_U + ENTRY_RUN + seg * SEG_PITCH;
}
const TRACK_LEN = nodeU(SEG_COUNT - 1) + RUN_OUT;
const S_MAX = (LANE_COUNT - 1) * LANE_GAP;

// (u, s) → 屏幕。★ 全文件唯一的投影入口, 改视角只改这两个函数。
function sx(u: number, s: number): number {
  return ORIGIN_X + u * ADV_X + s * LANE_X;
}
function sy(u: number, s: number): number {
  return ORIGIN_Y + u * ADV_Y + s * LANE_Y;
}
function laneS(lane: number): number {
  return lane * LANE_GAP;
}

// 要包进面板的推进区间与通道区间(未加原点偏移的「裸投影」范围):
// 推进方向上从起点地板的最外角一直到末段短桩, 通道方向上是两侧地板各自的最外角。
const U_MIN = ENTRY_U - TILE_HALF;
const S_MIN = -TILE_HALF;
const S_TOP = S_MAX + TILE_HALF;

// 面板尺寸 = 把所有要画的东西(21 块地板的菱形四角 + 站在上面的图标 + 地板厚度)包进来。
// ⚠ 只在本文件算一次: ExploreScreen 只管把面板摆到画布上, 版式常量不外泄。
const PAD = 28;
const rawX = (u: number, s: number) => u * ADV_X + s * LANE_X;
const rawY = (u: number, s: number) => u * ADV_Y + s * LANE_Y;
// 菱形的左右两个尖角落在 (u−h, s−h) 与 (u+h, s+h) 上, 上下两个尖角落在 (u+h, s−h) 与 (u−h, s+h) 上。
const X_LO = rawX(U_MIN, S_MIN);
const X_HI = Math.max(rawX(TRACK_LEN, S_MAX), rawX(nodeU(SEG_COUNT - 1) + TILE_HALF, S_TOP));
// 上边界取两者较高的一个: 站在最远那块地板上的图标顶端, 或末段短桩/地板本身的上尖角。
// 下边界要算上最近那块地板的厚度。
const Y_LO = Math.min(rawY(nodeU(SEG_COUNT - 1), 0) - ICON_H, rawY(TRACK_LEN, S_MIN));
const Y_HI = rawY(U_MIN, S_TOP) + TILE_D;
const ORIGIN_X = PAD - X_LO;
const ORIGIN_Y = PAD - Y_LO;

export const ROUTE_PANEL_W = Math.round(X_HI - X_LO + PAD * 2);
export const ROUTE_PANEL_H = Math.round(Y_HI - Y_LO + PAD * 2);

// 一根桥接在本段内的推进距离。段内均分, 首尾各留一格 —— 免得桥管贴在节点地板上。
function bridgeU(seg: number, row: number, rows: number): number {
  const from = seg === 0 ? nodeU(-1) + 40 : nodeU(seg - 1) + 48;
  const to = nodeU(seg) - 48;
  return from + ((row + 1) * (to - from)) / (rows + 1);
}

// 某块节点地板的屏幕中心(= 地板顶面的中心) —— ExploreScreen 画「落点 → 浮层」的光柱要用。
export function nodeCenter(seg: number, lane: number): { x: number; y: number } {
  return { x: sx(nodeU(seg), laneS(lane)), y: sy(nodeU(seg), laneS(lane)) };
}
// 通道中线上任意一点(推进动画、桥管端点、主管铺设都走它)。
function pt(u: number, lane: number): [number, number] {
  return [sx(u, laneS(lane)), sy(u, laneS(lane))];
}
function poly(points: [number, number][]): string {
  return points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
}

// ===================== 水管 =====================
// 细圆柱小水管: 三条同端点的描边叠出圆柱感 —— 暗轮廓(外径) + 管身 + 顶部细高光,
// 圆头端帽(stroke-linecap:round)让它能「插进」地板边缘。粗细与配色全在 RouteBoard.css。
// ⚠ 用三层描边而不是渐变填充: 主管朝右上、桥管朝右下, userSpace 的线性渐变会跟着方向错;
//   三层描边两条轴通用, 桥管因此能与主管**共用同一套 class ⇒ 天然同款**(见抬头 ③)。
function Pipe({ a, b }: { a: [number, number]; b: [number, number] }) {
  return (
    <>
      <line className="rb-pipe-shell" x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />
      <line className="rb-pipe-body" x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />
      {/* 高光整条上移 ⇒ 光从上方来, 管子有了朝上的那一面 */}
      <line
        className="rb-pipe-gloss"
        x1={a[0]}
        y1={a[1] - GLOSS_LIFT}
        x2={b[0]}
        y2={b[1] - GLOSS_LIFT}
      />
    </>
  );
}

// ===================== 瓦片地板 =====================
// 一块正方形地板的等距投影 = 2:1 菱形顶面 + 朝向观者的两个侧面(厚度)。
// ⚠ 用 SVG polygon 而不是「旋转 45° 的方块」: 旋转会把描边一起转过去, 与 2:1 的斜率对不上。
// 本地坐标 (0,0)-(TILE_W, TILE_BOX_H); 顶面四个尖角: 上 / 右 / 下 / 左。
const T_TOP: [number, number] = [TILE_W / 2, 0];
const T_RIGHT: [number, number] = [TILE_W, TILE_TOP_H / 2];
const T_BOTTOM: [number, number] = [TILE_W / 2, TILE_TOP_H];
const T_LEFT: [number, number] = [0, TILE_TOP_H / 2];
const drop = (p: [number, number]): [number, number] => [p[0], p[1] + TILE_D];
// 地砖缝: 顶面按比例内缩一圈, 让它读作「一块砖」而不是一个几何色块。
const SEAM = 0.62;
const seamPt = (p: [number, number]): [number, number] => [
  TILE_W / 2 + (p[0] - TILE_W / 2) * SEAM,
  TILE_TOP_H / 2 + (p[1] - TILE_TOP_H / 2) * SEAM,
];

function Tile() {
  return (
    <svg className="rb-tile" viewBox={`0 0 ${TILE_W} ${TILE_BOX_H}`} aria-hidden>
      {/* 侧面: 左下 + 右下两条边一起挤出厚度(先画, 顶面压在上面) */}
      <polygon
        className="rb-tile-side"
        points={poly([T_LEFT, T_BOTTOM, T_RIGHT, drop(T_RIGHT), drop(T_BOTTOM), drop(T_LEFT)])}
      />
      <polygon className="rb-tile-top" points={poly([T_TOP, T_RIGHT, T_BOTTOM, T_LEFT])} />
      <polygon
        className="rb-tile-seam"
        points={poly([T_TOP, T_RIGHT, T_BOTTOM, T_LEFT].map(seamPt))}
      />
    </svg>
  );
}

// 地板按钮(节点与起点共用)的定位样式: 盒子 = 地板顶面的包围盒 + 厚度。
// 站在上面的图标/字母向上溢出按钮 —— 它们是子元素, 悬停照样算在按钮头上。
// ⚠ --foot / --icon-h 一并交给 CSS: 「脚底落在地板顶面中心」这个数是从上面几个常量推出来的,
//   写死在 CSS 里的话改 TILE_HALF 会静默错位。
function tileBox(x: number, y: number): CSSProperties {
  return {
    left: `${x - TILE_W / 2 + TILE_NUDGE_X}px`,
    top: `${y - TILE_TOP_H / 2 + TILE_NUDGE_Y}px`,
    width: `${TILE_W}px`,
    height: `${TILE_BOX_H}px`,
    // 顶面中心距按钮底边的距离, 再往下压 2px ⇒ 物件是「踩进」地板而不是浮在上面
    "--foot": `${(TILE_BOX_H - TILE_TOP_H / 2 - 2).toFixed(1)}px`,
    "--icon-h": `${ICON_H}px`,
  } as CSSProperties;
}

// ===================== 节点事件图标 =====================
// 画法与据点/控制终端统一: 48×48 视框、stroke="currentColor"、主体 strokeWidth 1.6、
// 陪衬 1.2 + 低透明度。⚠ 刻意不用 emoji —— 全项目场景内图标一律线框 SVG。
// ⚠ 战斗/精英/BOSS 三个图标已删除: 战斗不再是节点事件(设计文档 §2.4)。
const ICONS: Record<NodeEventKind, ReactNode> = {
  // 撤离: 货梯厢 + 向上的箭头
  retreat: (
    <>
      <path d="M10 8h28v32H10z" strokeWidth={1.2} opacity={0.4} strokeLinejoin="round" />
      <path d="M24 36V16" strokeWidth={1.6} />
      <path d="M17 23l7-7 7 7" strokeWidth={1.6} strokeLinejoin="round" />
    </>
  ),
  // 战利品: 箱体 + 锁扣
  loot: (
    <>
      <path d="M9 18h30v22H9z" strokeWidth={1.6} strokeLinejoin="round" />
      <path d="M9 18l4-8h22l4 8" strokeWidth={1.2} opacity={0.55} strokeLinejoin="round" />
      <path d="M24 18v22" strokeWidth={1.2} opacity={0.6} />
      <path d="M20 26h8v5h-8z" strokeWidth={1.4} />
    </>
  ),
  // 治疗: 医疗十字 + 外圈
  heal: (
    <>
      <circle cx="24" cy="24" r="15" strokeWidth={1.2} opacity={0.42} />
      <path d="M24 15v18M15 24h18" strokeWidth={1.6} />
    </>
  ),
  // 商人: 售货机
  merchant: (
    <>
      <path d="M12 7h24v34H12z" strokeWidth={1.6} strokeLinejoin="round" />
      <path d="M17 13h9v14h-9z" strokeWidth={1.2} opacity={0.55} />
      <path d="M30 13h3M30 19h3M30 25h3" strokeWidth={1.2} opacity={0.55} />
      <path d="M17 33h14" strokeWidth={1.4} />
    </>
  ),
  // 路由: 分叉的线路
  route: (
    <>
      <path d="M24 42V26l10-10V6" strokeWidth={1.6} strokeLinejoin="round" />
      <path d="M24 26L14 16V6" strokeWidth={1.4} opacity={0.6} strokeLinejoin="round" />
      <circle cx="24" cy="26" r="2.6" strokeWidth={1.6} />
    </>
  ),
  // 能量: 过滤芯 + 粒子
  energy: (
    <>
      <path d="M17 8h14l-2 12 4 20H15l4-20z" strokeWidth={1.6} strokeLinejoin="round" />
      <circle cx="24" cy="30" r="1.6" strokeWidth={1.2} opacity={0.7} />
      <circle cx="20" cy="35" r="1.2" strokeWidth={1.2} opacity={0.5} />
      <circle cx="28" cy="34" r="1.2" strokeWidth={1.2} opacity={0.5} />
    </>
  ),
  // 风险: 三角警示
  hazard: (
    <>
      <path d="M24 8L42 39H6z" strokeWidth={1.6} strokeLinejoin="round" />
      <path d="M24 20v9" strokeWidth={1.6} />
      <path d="M24 33.5v.01" strokeWidth={2.2} />
    </>
  ),
};

// 站在地板上的事件图标: 同一份图标数据画三遍, 叠出「小物件」的体积感 ——
//   ① 深色粗描边(略下移) = 物体的暗部厚度  ② 原样线框 = 主体  ③ 细亮描边(略左上) = 受光边。
// ⚠ 图标数据一个字节都没改(仍是 48×48、stroke=currentColor 的线框 SVG, 全项目统一约定),
//   立体感全部来自这三层与 CSS 里的描边覆写。
function StandingIcon({ kind }: { kind: NodeEventKind }) {
  const art = ICONS[kind];
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
      <g className="ri-body" transform="translate(0 2)">
        {art}
      </g>
      <g className="ri-line">{art}</g>
      <g className="ri-lit" transform="translate(-0.7 -0.9)">
        {art}
      </g>
    </svg>
  );
}

// 段内折线 → 屏幕折线点。信号顺主管走到岔口, 再拐上桥管落到隔壁通道。
function segmentPoints(
  segment: RouteSegment,
  laneIn: number,
  rows: number,
  segIndex: number,
): [number, number][] {
  const startU = segIndex === 0 ? nodeU(-1) : nodeU(segIndex - 1);
  const pts: [number, number][] = [pt(startU, laneIn)];
  const { steps } = traceSegment(segment, laneIn, rows);
  for (const st of steps) {
    if (st.movedFrom == null) continue;
    const u = bridgeU(segIndex, st.row, rows);
    pts.push(pt(u, st.movedFrom)); // 沿主管(右上方向)走到岔口
    pts.push(pt(u, st.lane)); // 过桥管(右下 / 左上方向)落到隔壁通道
  }
  const laneOut = steps[steps.length - 1].lane;
  pts.push(pt(nodeU(segIndex), laneOut));
  return pts;
}

function pathOf(points: [number, number][]): string {
  return points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ");
}

function lengthOf(points: [number, number][]): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    len += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  }
  return len;
}

interface Props {
  board: RouteBoardData;
  phase: ExplorePhase;
  entryLane: number | null;
  /** 信号当前所处通道: advancing 时是**本段的入通道**, landed 之后是落点通道。 */
  currentLane: number | null;
  /** 已抵达的推进段数(0-4)。advancing 时它同时就是「正在走第几段」的 0-based 段号。 */
  currentSegment: number;
  /** 只在 choosingEntry 阶段可用; 由 ExploreScreen 转给 store 的 pickEntry。 */
  onPickEntry: (lane: number) => void;
  /** 只在 sealed 阶段可用; 玩家按下「探索路线」→ store 的 beginReveal。 */
  onStartReveal: () => void;
  /** 推进动画播完 → store 的 arrive()(会话从 advancing 进 landed)。 */
  onArrive: () => void;
  /** 悬停/聚焦某个节点 → ExploreScreen 的详情侧栏。null = 移开。 */
  onHoverNode: (at: { seg: number; lane: number } | null) => void;
}

export function RouteBoard({
  board,
  phase,
  entryLane,
  currentLane,
  currentSegment,
  onPickEntry,
  onStartReveal,
  onArrive,
  onHoverNode,
}: Props) {
  const rows = board.rowsPerSegment;
  // 悬停/聚焦中的入口 —— 只用来把**那一条通道的整串水管**点亮。
  // ⚠ 绝不据此提示落点: 主管本身不泄露信息(它是常显的), 但一旦预告落点, 整套记忆玩法就没了。
  const [hoverLane, setHoverLane] = useState<number | null>(null);

  const advancing = phase === "advancing";
  const disclosing = phase === "routeDisclosure";
  const generating = phase === "generating";
  const sealed = phase === "sealed";
  // 桥接: 只有揭示期与披露页可见。⚠ 其余阶段留在 DOM 里只改 opacity(见抬头)。
  const showBridges = phase === "revealing" || disclosing;

  // 正在推进的那一段(0-based)。advancing 时 currentSegment 尚未 +1, 它就是本段段号。
  const legPoints = useMemo<[number, number][]>(() => {
    if (!advancing || currentLane == null || currentSegment >= SEG_COUNT) return [];
    return segmentPoints(board.segments[currentSegment], currentLane, rows, currentSegment);
  }, [advancing, board, currentLane, currentSegment, rows]);

  // 已经走完的那些段 —— 落点确定后保持点亮, 玩家要能一直看到「我是怎么走到这里的」。
  // 披露页则把整条路径(含尚未走的部分)一起描出来(设计文档 §2.3.3)。
  const doneSegments = disclosing ? SEG_COUNT : currentSegment;
  const donePoints = useMemo<[number, number][]>(() => {
    if (entryLane == null) return [];
    const out: [number, number][] = [];
    let lane = entryLane;
    for (let i = 0; i < doneSegments; i++) {
      const pts = segmentPoints(board.segments[i], lane, rows, i);
      out.push(...(i === 0 ? pts : pts.slice(1)));
      lane = traceSegment(board.segments[i], lane, rows).laneOut;
    }
    return out;
  }, [board, entryLane, doneSegments, rows]);

  const legPath = useMemo(() => pathOf(legPoints), [legPoints]);
  const legLen = useMemo(() => lengthOf(legPoints), [legPoints]);
  const travelMs = Math.min(SIGNAL_MAX_MS, Math.max(SIGNAL_MIN_MS, legLen / SIGNAL_SPEED));

  // 每次「过桥完成」的时刻与坐标 —— 走线经过桥尾时在那里留一圈扩散环。
  const ripples = useMemo(() => {
    const out: { x: number; y: number; t: number }[] = [];
    if (legPoints.length < 2 || legLen <= 0) return out;
    let cum = 0;
    for (let i = 1; i < legPoints.length; i++) {
      const [pxs, pys] = legPoints[i - 1];
      const [x, y] = legPoints[i];
      cum += Math.hypot(x - pxs, y - pys);
      // 斜段的终点 = 一次过桥完成; 最后一个点 = 抵达节点瓦片
      if (pys !== y || i === legPoints.length - 1) out.push({ x, y, t: (cum / legLen) * travelMs });
    }
    return out;
  }, [legPoints, legLen, travelMs]);

  // 推进播完 → 通知上层落点。⚠ 计时器挂 effect 里(而非裸 setTimeout): 战斗/离页导致卸载时
  // 清理函数顺手撤掉, 不会有卸载后回调。
  useEffect(() => {
    if (!advancing) return;
    const id = window.setTimeout(onArrive, travelMs + SIGNAL_TAIL_MS);
    return () => window.clearTimeout(id);
  }, [advancing, travelMs, onArrive, board.round, currentSegment]);

  // 节点在哪些阶段可以悬停出详情: 揭示期与推进期一律惰性 ——
  // 那两拍玩家必须盯着桥接/信号, 不该被悬停详情分走注意力(§2.2)。
  const nodesInteractive = !generating && phase !== "revealing" && !advancing;

  // 玩家实际落在过的节点(seg → lane), 供高亮与「已结算」标记。
  const visited = useMemo(() => {
    if (entryLane == null) return [] as number[];
    const out: number[] = [];
    let lane = entryLane;
    for (let i = 0; i < currentSegment; i++) {
      lane = traceSegment(board.segments[i], lane, rows).laneOut;
      out.push(lane);
    }
    return out;
  }, [board, entryLane, currentSegment, rows]);

  return (
    // ⚠ key 挂轮号: 换轮时整块重挂, rbGen* 生成动画才会从头再播一遍
    //   (顺带把 hoverLane 清掉 —— 新的一轮本就不该留着上一轮的悬停态)。
    <div
      key={board.round}
      className={`route-board${generating ? " is-generating" : ""}`}
      style={{ width: `${ROUTE_PANEL_W}px`, height: `${ROUTE_PANEL_H}px` }}
    >
      {/* ── 顶部倒计时: 只在揭示阶段出现, 宽度由 CSS 动画从 100% 收到 0 ── */}
      <div className="rb-timer" aria-hidden>
        {phase === "revealing" && (
          <span
            key={board.round}
            className="rb-timer-fill"
            style={{ animationDuration: `${board.revealDurationMs}ms` }}
          />
        )}
      </div>

      {/* ── 入口 A-E: 每条通道**起点(左下端)**的那一块地板 ──
          与节点地板同款瓦片, 上面站着一个立体字母。五块地板沿通道轴排成一条朝右下的斜线。
          它们仍是全屏最重要的可点物件(§11.2), 故字母比节点图标大一档。
          常态各自极缓慢地上下浮动(相位靠 --i 错开), 悬停时定住抬起、字母点亮、所属通道整串水管转亮。
          ⚠ 所有反馈都是位移/描边色的连续过渡, **没有任何明暗闪烁**(见 RouteBoard.css 抬头的约定)。 */}
      <div className="rb-entries">
        {Array.from({ length: board.laneCount }, (_, lane) => {
          const blocked = board.blockedLanes.includes(lane);
          const active = entryLane === lane;
          const usable = phase === "choosingEntry" && !blocked;
          const c = nodeCenter(-1, lane);
          return (
            <button
              key={lane}
              type="button"
              className={`rb-entry${active ? " is-active" : ""}${blocked ? " is-blocked" : ""}`}
              style={{ ...tileBox(c.x, c.y), "--i": lane } as CSSProperties}
              disabled={!usable}
              onPointerEnter={() => usable && setHoverLane(lane)}
              onPointerLeave={() => setHoverLane((l) => (l === lane ? null : l))}
              onFocus={() => usable && setHoverLane(lane)}
              onBlur={() => setHoverLane((l) => (l === lane ? null : l))}
              onClick={() => onPickEntry(lane)}
              title={blocked ? "该通道已被隔断封锁" : `从 ${ENTRY_LABELS[lane]} 通道进入`}
            >
              <Tile />
              <span className="rb-tile-shadow" aria-hidden />
              <span className="rb-entry-letter">{ENTRY_LABELS[lane] ?? lane + 1}</span>
            </button>
          );
        })}
      </div>

      {/* ── 等距场地本体 ── */}
      <svg
        className="rb-svg"
        viewBox={`0 0 ${ROUTE_PANEL_W} ${ROUTE_PANEL_H}`}
        style={{ height: `${ROUTE_PANEL_H}px` }}
        aria-hidden
      >
        {/* 主管 = 沿**推进轴(右上方向)**把一条通道上的地板串起来的小水管。
            每条通道 5 节: 起点 → 段1 → 段2 → 段3 → 段4 → 末端短桩(信号「继续向前」的去向)。
            地板之间的那几节两端各沿 u 缩 TILE_INSET, 圆头端帽因此正好塞进地板边缘 ——
            读作「管子插进地板」, 而不是「一根线穿过一个图标」。
            ⚠ 绘制顺序 = 通道 0 → 4, 即由远及近(通道轴朝右下 ⇒ 序号越大越靠近观者),
              后画的自然压在前面画的之上, 这就是等距场景的画家算法。 */}
        {Array.from({ length: board.laneCount }, (_, lane) => {
          const live = hoverLane === lane || (entryLane === lane && phase === "advancing");
          // 每一节的推进区间。最后一节是短桩, 尾端不缩(它没有地板可插)。
          const runs: [number, number][] = [];
          for (let seg = 0; seg < SEG_COUNT; seg++) {
            runs.push([nodeU(seg - 1) + TILE_INSET, nodeU(seg) - TILE_INSET]);
          }
          runs.push([nodeU(SEG_COUNT - 1) + TILE_INSET, TRACK_LEN]);
          return (
            <g
              key={lane}
              className={`rb-lane${live ? " is-live" : ""}`}
              style={{ "--i": lane } as CSSProperties}
            >
              {runs.map(([u0, u1], i) => (
                <Pipe key={i} a={pt(u0, lane)} b={pt(u1, lane)} />
              ))}
            </g>
          );
        })}

        {/* 桥管 = 横搭在相邻两条通道之间的水管, **与主管完全同款**(同一个 Pipe、同一套 class)。
            它靠三件事与主管区分, 一件都不能丢(见文件抬头): 朝向相反(右下 vs 右上)、
            身上没有地板、平时根本不在画面上。
            ⚠ 任何阶段都留在 DOM 里, 只靠 .is-hidden 改 opacity —— 卸载会让「记不住就没了」
            这条核心机制被 DevTools 绕过, 也会在回放时重新布局。 */}
        <g className={`rb-bridges${showBridges ? "" : " is-hidden"}`}>
          {board.segments.flatMap((seg) =>
            seg.bridges.map((b) => {
              const u = bridgeU(seg.index, b.row, rows);
              // 端点 = 两条通道的**中线**(不再是平台边缘) ⇒ 与推进动画的折线严格重合。
              return (
                <g key={`${seg.index}-${b.row}-${b.leftLane}`} className="rb-bridge">
                  <Pipe a={pt(u, b.leftLane)} b={pt(u, b.leftLane + 1)} />
                </g>
              );
            }),
          )}
        </g>

        {/* 已走过的路径(含披露页的整条线路) */}
        {donePoints.length > 1 && (
          <path
            className={`rb-trace-done${disclosing ? " is-disclosed" : ""}`}
            d={pathOf(donePoints)}
          />
        )}

        {/* 正在推进的这一段 + 信号点。key 带段号: 每段重挂一次, dash 与 SMIL 动画才会重播。 */}
        {advancing && legPoints.length > 1 && (
          <g key={`${board.round}-${currentSegment}`} className="rb-trace">
            <path
              className="rb-trace-line"
              d={legPath}
              style={{ "--len": legLen, animationDuration: `${travelMs}ms` } as CSSProperties}
            />
            <path
              className="rb-trace-head"
              d={legPath}
              style={
                {
                  "--len": legLen,
                  strokeDasharray: `56 ${legLen}`,
                  animationDuration: `${travelMs}ms`,
                } as CSSProperties
              }
            />
            {ripples.map((r, i) => (
              <circle
                key={i}
                className="rb-ripple"
                cx={r.x}
                cy={r.y}
                r={4}
                style={{ animationDelay: `${Math.round(r.t)}ms` } as CSSProperties}
              />
            ))}
            <circle className="rb-signal" r={9}>
              <animateMotion dur={`${travelMs}ms`} path={legPath} fill="freeze" calcMode="linear" />
            </circle>
          </g>
        )}
      </svg>

      {/* ── 节点地板 + 站在上面的事件图标 ──
          20 个节点**全程可见**(§2.1)。地板上放不下文字, 所以按战棋的标准做法:
          地板上站一个事件图标, 悬停/聚焦时由 ExploreScreen 的侧栏展开完整文本(§11.1)。 */}
      <div className={`rb-nodes${nodesInteractive ? "" : " is-inert"}`}>
        {board.nodes.flatMap((row, seg) =>
          row.map((ev, lane) => {
            const { x, y } = nodeCenter(seg, lane);
            const landedHere = visited[seg] === lane;
            const isCurrent = landedHere && seg === currentSegment - 1 && !advancing;
            const settled = landedHere && seg < currentSegment - 1;
            // 披露页: 玩家放弃掉的段(没走到的)整体压暗, 让「我放弃了什么」看得见
            const abandoned = disclosing && seg >= currentSegment;
            return (
              <button
                key={`${seg}-${lane}-${ev.id}`}
                type="button"
                className={`rb-node k-${ev.kind}${isCurrent ? " is-current" : ""}${
                  settled ? " is-settled" : ""
                }${abandoned ? " is-abandoned" : ""}${ev.risk ? ` r-${ev.risk}` : ""}`}
                style={
                  {
                    ...tileBox(x, y),
                    "--i": seg * 5 + lane,
                    "--seg": seg,
                  } as CSSProperties
                }
                tabIndex={nodesInteractive ? 0 : -1}
                disabled={!nodesInteractive}
                onPointerEnter={() => onHoverNode({ seg, lane })}
                onPointerLeave={() => onHoverNode(null)}
                onFocus={() => onHoverNode({ seg, lane })}
                onBlur={() => onHoverNode(null)}
                title={ev.title}
              >
                <Tile />
                {/* 脚下的落地投影 —— 「站在地板上」这件事的物理依据 */}
                <span className="rb-tile-shadow" aria-hidden />
                <span className="rb-node-icon">
                  <StandingIcon kind={ev.kind} />
                </span>
              </button>
            );
          }),
        )}
      </div>

      {/* ── 「探索路线」: 遮蔽态正中的那一颗按钮 ──
          它是本轮唯一进入 revealing 的入口, 按下即消失、**这一轮再也回不来**(见 session.startReveal)。
          故意做得像个探针触发器而不是普通按钮 —— 玩家要意识到这一下是不可撤销的。 */}
      {sealed && (
        // ⚠ 居中定位挂在这层 anchor 上, **不能**挂在 button 自己身上:
        //   全站的 base.css 有 `button:active:not(:disabled){transform:translateY(1px)}`,
        //   特异性比单个类名高 —— 按下的瞬间它会把 translate(-50%,-50%) 整条顶掉,
        //   按钮当场朝右下跳半个自身宽高, 从光标底下跑走, click 根本不触发。
        //   拆成两层后按钮本体不持有 transform, 那条按下反馈就只是它本来的意思。
        //   探针环同样挪到 anchor 上: button 有 clip-path(全站斜切角), 留在里面会被裁掉。
        <div
          className="rb-probe-anchor"
          style={{ left: `${ROUTE_PANEL_W / 2}px`, top: `${ROUTE_PANEL_H / 2}px` }}
        >
          <span className="rb-probe-ring" aria-hidden />
          <button
            type="button"
            className="rb-probe"
            onClick={onStartReveal}
            title="向签路注入探针, 全图桥接会短暂显形 —— 本轮仅此一次"
          >
            <span className="rb-probe-label">探索路线</span>
            <span className="rb-probe-note">全图桥接仅显形一次</span>
          </button>
        </div>
      )}
    </div>
  );
}
