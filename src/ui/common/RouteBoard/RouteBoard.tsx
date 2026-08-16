// ★ 区域路线图(等距薄片地砖) ★ —— 探索页的主体交互, 见 探索模式设计.md §2 与 §11.1。
//
// ★ 投影(§11.1): **经典战棋的等距(平行)投影**, 2:1 斜率, 地砖尺寸全程恒定, 绝不用透视 ——
//   透视会让第 3、4 段的桥接变小变密, 玩家会归因为「看不清」而不是「没记住」, 那是视觉不公平。
//   推进轴(沿通道向前) = 左下 → 右上   通道轴(跨到隔壁通道) = 左上 → 右下
//   ⚠ 投影常量与 matrix 一律从 routeIso 取: 棋盘、连线、地砖必须共享同一套斜率。
//
// ★ 每块格子 = 一块很小的哑光空砖 + 一枚**悬在砖上方的自发光图标**:
//   没有屏、没有底板、没有外框, 虚空里就一个符号。砖是方形 DOM 盒子被 TILE_MATRIX 压平成
//   2:1 菱形; 图标盒是同一个方盒被 PANEL_MATRIX 剪切**立起来** ⇒ 正交视角下图标与砖严格垂直。
//   ⛔ 除图标外**不放任何东西**(卡面、编目角标、大字符全部取消, 入口通道号除外):
//     事件类型只由图标与事件色表达, 要读的字全部收进 ExploreScreen 的悬浮浮卡(NodeTip)。
//   为什么用 DOM+CSS 而不是 SVG 重画: 质感几乎全是多层 background 渐变、clip-path 切角与
//   mix-blend-mode 斜向高光, 用 SVG 复刻会丢掉大半; 等距投影是线性变换 ⇒ 一条 matrix 就够。
//
// 各阶段对应的画面(阶段机在 explore/session.ts, 本组件是**受控**的, 自己不推进任何状态):
//   generating —— 地砖与连线沿推进方向逐块浮现, 共 GENERATE_MS; 全程不可交互。
//                 ⚠ 桥接自始至终不出现 —— 这一段是「浮现仪式」, 不是信息展示。
//   sealed    —— 图已浮现完、桥接仍遮蔽; 「探索路线」按钮在棋盘下方(ExploreScreen 负责)。
//   revealing —— **全图 4 段桥接一次性全显**且高亮闪烁; 玩家在这 2-3 秒里用眼睛记。
//   choosingEntry —— 桥接整体淡出到 opacity:0(⚠ 只改 opacity, **不卸载**: DOM 里留着才不会被
//                「查看元素」看穿); 入口通道 A-E 变成可点按钮(脉冲环 + 下指标)。
//   advancing —— 信号沿本段折线前进, 棋子跟在后半步走同一条线。
//   leaving   —— **离场行走**: 棋子沿本轮**剩余的整条线路**走到第 4 段终点, 走线同速描出、
//                桥接一并显形。⚠ 这一相的意义是「不许把人瞬移进战斗」: 走完(onLeaveDone)才进披露页。
//   landed / resolving / atNode —— 落点砖高亮, 已走过的路径保持点亮; 决策浮层由 ExploreScreen 管。
//   roundBattle(披露态) —— 全图桥接常亮 + 实际路径整条描出 + 放弃掉的剩余节点压暗(§11.2)。
//
// ⛔ 禁闪烁约定: 常驻动效只有匀速位移/呼吸缩放, 明暗一律走 transition 或一次性播完。
//   唯一的例外是揭示期的桥接(见 CSS 的 .isRevealing) —— 那两三秒本就是要催人记。
// ⚠ 本文件坐标全是「设计 px」, 与 stage.ts 的 1920×1080 同尺度; 面板由调用方定位。

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { traceSegment } from "@/explore/route";
import type {
  ExplorePhase,
  NodeEvent,
  RouteBoard as RouteBoardData,
  RouteSegment,
} from "@/explore/types";
import { prefersReducedMotion } from "@/ui/app/transitions";
import { cx } from "@/ui/common/cx";
// 面板底图: 16:9 场景占位素材(只有 ground 开着时才用)。
// ⚠ 走 import 而不是在 CSS 里写路径, 打包后才有指纹化的地址。
import boardBg from "@/assets/占位场景素材.png";
import { RouteEventIcon } from "./RouteEventIcon";
import { ADV_X, ADV_Y, LANE_X, LANE_Y, PANEL_MATRIX, TILE_MATRIX, tileBounds } from "./routeIso";
import s from "./RouteBoard.module.css";

// ===================== 版式(设计 px) =====================

// 砖面在**世界坐标**里的边长。两条世界轴都是单位向量, 所以这个数同时就是砖在
// 两个轴向上的屏幕跨度 ⇒ 与 LANE_GAP / SEG_PITCH 直接可比: 差值就是砖缝。
// ⚠ 砖不需要大: 砖上什么都不画(内容全在悬浮图标上), 它只是一块「站位用的台面」。
//   砖越小, 通道之间的空地越多, 那些悬空的图标才有地方浮着 —— 现在只比连线宽一点点。
const TILE = 52;
const TILE_HALF = TILE / 2;
// 薄片厚度(屏幕垂直方向)。⚠ 只有 4px: 再厚就从「地砖」变回「积木」, 整套概念就塌了。
const TILE_DEPTH = 4;

// 砖面 → 地面的屏幕落差。★ 砖是一片**有厚度**的薄片, 节点中心那个坐标算的是砖面(= 薄片的
// **上表面**)的中心; 而连线与棋子是**画在地面上**的东西, 两者本来就不在同一个高度上。
// ⇒ 连线层与棋子层整体下移这一档, 线才读作「从砖底下穿过去」, 而不是擦着砖的上半部飘过。
// ⚠ 这不是纯几何量(薄片厚度只有 TILE_DEPTH=4): 砖底下还压着一摊下移 6px 的落地影,
//   砖的视觉重心被它一起拽下去, 实测要下移 6px 才对得齐。⛔ 不要「修正」回 TILE_DEPTH。
// ⚠ 连线层与棋子层必须用**同一个**值: 棋子是沿着连线的路径走的, 差一点点走起来就浮在线上方。
// ★ 悬停时砖抬起 6px, 线留在原地 ⇒ 线相对砖又沉下去一档, 这是对的: 砖被抬离了地面。
const GROUND_DROP = 6;

const LANE_GAP = 132; // 相邻通道中心距 ⇒ 砖缝 80
const SEG_PITCH = 205; // 相邻两块地砖的推进距离 ⇒ 砖缝 153, 中间走连线
const ENTRY_RUN = SEG_PITCH; // 起点 → 段 1 用同一个数, 四段节奏才匀
const ENTRY_U = -100;
const TILE_INSET = 20; // 连线两端缩进量 ⇒ 端帽塞进砖的边缘之下(比 TILE_HALF 小 6)

const { w: TILE_W, h: TILE_H } = tileBounds(TILE); // ≈ 93 × 46

// 砖(连厚度)的屏幕盒高 —— NodeTip 下翻时要让开这一截。
export const TILE_BOX_H = TILE_H + TILE_DEPTH;

// 悬浮图标那个方盒的边长(**剪切前**)。⚠ 它**比砖还大**: 图标才是主角, 砖只是它的落脚点。
const PROJ_PANEL = 72;
// 图标盒从砖面中心往上占掉的净空。盒底边沿通道轴躺在地面上(左端抬起半个宽度 × 通道轴斜率),
// 所以最高点 = 盒高 + 底边左端的抬升量。⚠ 这个数只由 PROJ_PANEL 推出, 不要手写。
const PROJ_H = Math.round(PROJ_PANEL * (1 + LANE_Y / 2));

// 悬浮图标顶端相对砖面中心的高度 —— 悬停浮卡(NodeTip)要贴在它上方。
export const NODE_ICON_TOP = PROJ_H + TILE_H / 2;

const LANE_COUNT = 5;
const SEG_COUNT = 4;
const ENTRY_LABELS = ["A", "B", "C", "D", "E"];

// 推进动画节奏: 信号点先跑完整段(travelMs), 棋子再以 1/2.6 的速度走同一条线。
const SIGNAL_SPEED = 0.42;
const SIGNAL_MIN_MS = 820;
const SIGNAL_MAX_MS = 2000;
const PAWN_SPEED_DIV = 2.6;
const SEG_TAIL_MS = 280; // 抵达节点后多停一拍再回调 onArrive, 免得画面一到就跳

// ★ 离场行走的速度: 玩家在 atNode 按下「前往下一区域」之后, 棋子要**沿本轮剩下的整条线路
//   一路走到第 4 段终点**, 走完才弹披露页 —— 「放弃剩余节点」不等于被瞬移进战斗。
// ⚠ 刻意比推进段的走速(SIGNAL_SPEED / PAWN_SPEED_DIV ≈ 0.16)快一档: 这一段最长要走 4 个
//   推进段(近千 px), 用推进段的速度会拖到 6 秒以上 —— 那是过场, 不是仪式感。
//   但仍明显慢于信号点(0.42), 读得出是「人在走」而不是「线被点亮」。
const LEAVE_SPEED = 0.28;
const LEAVE_MIN_MS = 900;
const LEAVE_MAX_MS = 3600;
// reduced-motion: 路径信息保留(线照样描、人照样沿线移动), 只压到最短可辨识时长。
// ⚠ 与 .traceWalk 共用这一个数 —— 那条线的 animationDuration 是内联传进去的, 两者天然同步。
const LEAVE_REDUCED_MS = 420;

// ★ 生成演出总时长 = RouteBoard.module.css 里 qGen* 最晚那一支播完的时刻:
//   最远那块砖的悬浮图标 delay 760 + 3×300(段) + 4×42(通道) + 380(时长) ≈ 2208ms, 取整留一点余量。
//   **改这里必须同步改那几段的 delay+duration**, 否则调用方的定时器会比画面早或晚落地。
export const GENERATE_MS = 2260;
// reduced-motion: CSS 那边把整套生成动画直接关掉(见 @media 段), 这里只留一拍最短停顿。
export const GENERATE_REDUCED_MS = 320;

// ===================== 坐标换算 =====================
function nodeU(seg: number): number {
  return seg < 0 ? ENTRY_U : ENTRY_U + ENTRY_RUN + seg * SEG_PITCH;
}
const TRACK_LEN = nodeU(SEG_COUNT - 1);
const S_MAX = (LANE_COUNT - 1) * LANE_GAP;

const PAD = 34;
const rawX = (u: number, sv: number) => u * ADV_X + sv * LANE_X;
const rawY = (u: number, sv: number) => u * ADV_Y + sv * LANE_Y;
const U_MIN = ENTRY_U - TILE_HALF;
const U_MAX = TRACK_LEN + TILE_HALF;
const S_MIN = -TILE_HALF;
const S_TOP = S_MAX + TILE_HALF;
const X_LO = rawX(U_MIN, S_MIN);
const X_HI = rawX(U_MAX, S_TOP);
// ⚠ 上边界取的是**最远那块砖的悬浮图标顶端**(u 最大 / s 最小 = 屏幕最高的那块砖),
//   不是砖本身的上沿: 图标立在砖中心上方, 少算这一截就会被面板容器裁掉。
const Y_LO = Math.min(rawY(U_MAX, S_MIN), rawY(TRACK_LEN, 0) - PROJ_H);
const Y_HI = rawY(U_MIN, S_TOP) + TILE_DEPTH;
const ORIGIN_X = PAD - X_LO;
const ORIGIN_Y = PAD - Y_LO;

export const ROUTE_PANEL_W = Math.round(X_HI - X_LO + PAD * 2);
export const ROUTE_PANEL_H = Math.round(Y_HI - Y_LO + PAD * 2);

function sx(u: number, sv: number): number {
  return ORIGIN_X + rawX(u, sv);
}
function sy(u: number, sv: number): number {
  return ORIGIN_Y + rawY(u, sv);
}
function laneS(lane: number): number {
  return lane * LANE_GAP;
}

// 桥接在本段内的推进坐标: 段内均分, 首尾各让开一整块砖。
function bridgeU(seg: number, row: number, rows: number): number {
  const from = nodeU(seg - 1) + TILE_HALF + 8;
  const to = nodeU(seg) - TILE_HALF - 8;
  return from + ((row + 1) * (to - from)) / (rows + 1);
}

/** 某块砖的屏幕中心(= 砖面中心) —— 调用方画悬浮浮卡/光柱要用。 */
export function nodeCenter(seg: number, lane: number): { x: number; y: number } {
  return { x: sx(nodeU(seg), laneS(lane)), y: sy(nodeU(seg), laneS(lane)) };
}
function pt(u: number, lane: number): [number, number] {
  return [sx(u, laneS(lane)), sy(u, laneS(lane))];
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

// ===================== 连线 =====================
// 三层: 近黑轨槽(bed) + 暖铜导线(pipe) + 顶部一线高光(gloss)。
// ⚠ 轨槽必须始终比导线宽, 否则凹槽读成描边; 高光必须比导线细, 否则线变成两根。
function Pipe({ a, b, j = 0 }: { a: [number, number]; b: [number, number]; j?: number }) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const geo = { x1: a[0], y1: a[1], x2: b[0], y2: b[1] };
  return (
    <g style={{ "--len": len.toFixed(1), "--j": j } as CSSProperties}>
      <line className={s.pipeBed} {...geo} />
      <line className={s.pipe} {...geo} />
      <line className={s.pipeGloss} {...geo} />
    </g>
  );
}

// ===================== 地砖 + 悬空图标 =====================
// DOM 由下往上四层:
//   ① 落地影   —— 2:1 的模糊椭圆, **不参与 matrix**(它本来就是地面上的一摊影子);
//   ② 薄片侧壁 —— 与砖面同形的一片实心断面, 在**屏幕空间**下移 TILE_DEPTH ⇒ 下缘露一线厚度;
//   ③ 砖面     —— 一块哑光小地砖(跟着 TILE_MATRIX 躺倒): 底色 + 收边 + 事件类型纹理;
//   ④ 发光棱   —— 砖**朝向观者的那两条棱**(右下 = 方盒 bottom 边, 左下 = 方盒 left 边,
//                 在屏幕最下那个角交汇成 "V"), 用吃满饱和度的事件色发光。
//                 ★ 这是砖上唯一带浓色的一笔, 几何推导见 .tileEdge 的注释;
//   ⑤ 悬空图标 —— 沿通道轴**直立**在砖中心上方的一枚自发光图标(走 PANEL_MATRIX)。
//
// ★ 图标为什么走 PANEL_MATRIX 而不是正对观者: 这一版要的是**正交视角下的立面** ——
//   图标与地砖在画面里必须严格垂直, 才读得出「它是浮在这块地砖上方的」。所以图标跟砖一样
//   由 routeIso 的同一套斜率剪切: 砖躺平(TILE_MATRIX), 图标立起(PANEL_MATRIX), 二者共面垂直。
//   图标因此也跟着斜 —— 这是正交投影的正确读数, 不要给它反向补偿。
// ⛔⛔ **画面上只剩这一枚图标**: 没有屏、没有底板、没有外框、没有网格、没有扫描线,
//   连四个角的切角框都删了。.projPanel 只是图标的**定位容器**(尺寸 + 剪切 + 命中区),
//   它自己必须永远是完全透明的、不画任何东西 —— 一枚悬在虚空里发光的符号, 就是全部。
// ⛔ 砖面上不放任何文字, 也没有投影源光斑: 图标直接浮在砖上, 不是被一盏灯投出来的。
//   ⚠ 因此砖按钮自己没有可访问名称, 调用方必须给 aria-label。
// ★ 砖面唯一的「内容」是事件类型标记(kind 给了才画, 入口砖没有), 分两种做法:
//   · BAND_KINDS(危险 / 撤离)—— 砖面下缘一条**纹理带**, 位置尺寸沿用原来的风险警示带。
//     这两类是「地形告示」性质的事件(此处危险 / 此处可离场), 用警示条纹读起来最直接。
//   · 其余六类 —— 砖面正中**平铺一枚同款事件图标**(与悬浮图标共用 RouteEventIcon 的路径),
//     它在砖面**里面**, 跟着 TILE_MATRIX 一起被压平 ⇒ 读作「印在地面上的标记」, 不是又一枚浮标。
//   ⛔ 两种做法都只占砖面的一小块, 不要铺满: 满铺会让每块砖变成一张花纹卡片, 地面的整体感就散了。
//   ⚠ 砖上的标记与悬浮图标同色系但**明显更暗**(--k 掺暗灰, 见 .faceGlyph): 层次是
//     「地面刻痕 vs 自发光符号」—— 一旦提到跟悬浮图标一样亮, 两枚图标就开始互相抢主角。
//   ⛔ 风险度(highRisk / negative)在砖上**完全不表现**: 那是浮卡里的文字标签的事。
const BAND_KINDS = new Set<NodeEvent["kind"]>(["hazard", "retreat"]);

function TileArt({ icon, kind }: { icon: ReactNode; kind?: NodeEvent["kind"] }) {
  return (
    <>
      <span className={s.tileShadow} aria-hidden />
      <span className={s.tileSlab} aria-hidden />
      <span className={s.tileFace} aria-hidden>
        {kind &&
          (BAND_KINDS.has(kind) ? (
            <span className={s.faceKind} />
          ) : (
            <span className={s.faceGlyph}>
              <RouteEventIcon kind={kind} />
            </span>
          ))}
      </span>
      {/* ⚠ 发光棱同样必须在砖面**外面**: 砖面 overflow:hidden 会把往砖外溢的辉光整圈裁掉,
          放进去就只剩往砖内侧渗的半圈光。它与砖面同级、共用 TILE_MATRIX ⇒ 压平后严丝合缝。
          ⚠ 一个盒子画两条棱(::before / ::after), 辉光挂在盒子上 ⇒ 状态规则只需改这一层。 */}
      <span className={s.tileEdge} aria-hidden />
      {/* ⚠ 图标必须留在砖面**外面**: 砖面 overflow:hidden 且被 TILE_MATRIX 压平,
          放进去会被裁掉一半, 剩下的一半还会跟着躺倒。 */}
      <span className={s.projPanel} aria-hidden>
        <span className={s.projIcon}>{icon}</span>
      </span>
    </>
  );
}

// 砖按钮的定位盒 = 砖面**未压平前**的方形盒子, 中心落在节点中心。
// ⚠ 压平后的菱形比这个盒子宽(≈1.79 倍)、矮(≈0.89 倍), 会溢出盒子 —— 这是对的:
//   按钮盒本身 pointer-events:none, 命中测试交给压平后的 .tileFace, 命中区因此就是菱形本身。
function tileBox(x: number, y: number): CSSProperties {
  return {
    left: `${x - TILE_HALF}px`,
    top: `${y - TILE_HALF}px`,
    width: `${TILE}px`,
    height: `${TILE}px`,
  };
}

// ===================== 起点的「点我」提示标 =====================
// 悬在通道号**上方**的一枚双人字下指标 —— 起点砖唯一的显式指令: 往下点这块砖。
// ★ 为什么是符号而不是文字: 这一版的虚空里只允许站图标与通道号, 一行小字会立刻需要底板衬托,
//   「屏」就又回来了。双人字是「往这里去 / 点这里」的通用语, 不需要翻译。
// ⚠ 它跟着 PANEL_MATRIX 一起被剪切(与通道号同一个容器) ⇒ 看上去是斜的, 这是正交投影的正确读数。
// ⚠ 只在**可点**的入口上出现(见 .entryCue): 已选中 / 未到阶段 / 已封锁的入口都不该指挥玩家点它。
function EntryCue() {
  return (
    <span className={s.entryCue} aria-hidden>
      <svg viewBox="0 0 24 20" fill="none" stroke="currentColor" strokeWidth={2.4}>
        <path d="M4 3l8 7 8-7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 10l8 7 8-7" strokeLinecap="round" strokeLinejoin="round" opacity={0.5} />
      </svg>
    </span>
  );
}

// ===================== 玩家棋子 =====================
// ⛔ 不做立体小人(那与「全平」的基调冲突)。
// 棋子是一枚**贴地的等距光环 + 实心核心**: 同样躺在地面上, 靠亮度与动效区分。
const PAWN_R = 22;
function Pawn() {
  const rx = PAWN_R * (ADV_X + LANE_X) * 0.5;
  const ry = PAWN_R * (LANE_Y - ADV_Y) * 0.5;
  return (
    <g className={s.pawnBody}>
      <ellipse className={s.pawnHalo} rx={rx * 1.5} ry={ry * 1.5} />
      <ellipse className={s.pawnRing} rx={rx} ry={ry} />
      <ellipse className={s.pawnCore} rx={rx * 0.34} ry={ry * 0.34} />
    </g>
  );
}

// 段内折线 → 屏幕折线: 顺主线走到岔口, 拐上桥线落到隔壁通道。
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
    pts.push(pt(u, st.movedFrom));
    pts.push(pt(u, st.lane));
  }
  pts.push(pt(nodeU(segIndex), steps[steps.length - 1].lane));
  return pts;
}

interface Props {
  board: RouteBoardData;
  phase: ExplorePhase;
  entryLane: number | null;
  /** 信号当前所处通道: advancing 时是**本段的入通道**, landed 之后是落点通道。 */
  currentLane: number | null;
  /** 已抵达的推进段数(0-4)。advancing 时它同时就是「正在走第几段」的 0-based 段号。 */
  currentSegment: number;
  /** 只在 choosingEntry 阶段可用; 由调用方转给 store 的 pickEntry。 */
  onPickEntry: (lane: number) => void;
  /** 推进动画播完 → store 的 arrive()(会话从 advancing 进 landed)。 */
  onArrive: () => void;
  /** 离场行走播完 → store 的 leaveDone()(会话从 leaving 进 routeDisclosure)。
   *  ⚠ 没有剩余线路可走时(理论上 session 已经拦掉)本组件会立刻回调, 阶段机不会卡死。 */
  onLeaveDone: () => void;
  /** 悬停/聚焦某个节点 → 调用方的节点悬浮浮卡。null = 移开。 */
  onHoverNode: (at: { seg: number; lane: number } | null) => void;
  /** 面板底图(16:9 场景素材 + 暗色遮罩 + 等距网格)。
   *  ⚠ 页面本身已有全屏场景时必须传 false, 否则画面中央会多出一块矩形贴图。 */
  ground?: boolean;
}

export function RouteBoard({
  board,
  phase,
  entryLane,
  currentLane,
  currentSegment,
  onPickEntry,
  onArrive,
  onLeaveDone,
  onHoverNode,
  ground = true,
}: Props) {
  const rows = board.rowsPerSegment;
  // 悬停/聚焦中的入口 —— 只用来把**那一条通道的整串连线**点亮。
  // ⚠ 绝不据此提示落点: 主线本身不泄露信息(它是常显的), 但一旦预告落点, 整套记忆玩法就没了。
  const [hoverLane, setHoverLane] = useState<number | null>(null);
  // 悬停中的节点。**只用于砖自己的抬起效果**(浮卡由调用方渲染) ——
  // ⚠ 不能改用 CSS :hover: 砖在多数阶段是 disabled 的, :hover 会在不可交互时也生效。
  const [hoverNode, setHoverNode] = useState<{ seg: number; lane: number } | null>(null);

  const generating = phase === "generating";
  const advancing = phase === "advancing";
  // 离场行走: 「前往下一区域」按下之后、披露页之前的那一段演出(见 session.leaveRegion)。
  const leaving = phase === "leaving";
  // 披露态: 披露页本身 + 其后的战斗签两相。★ 战斗签期间线路继续摊在浮层背后 ——
  // 披露一旦开始就不该再收回去, 那会让玩家以为「刚才那张图我没看够就没了」。
  const disclosing = phase === "roundBattle";
  // 桥接: 揭示期、离场行走与披露页可见。⚠ 其余阶段留在 DOM 里只改 opacity(见抬头)。
  // ★ 离场行走也显形: 人这一路要连过好几根桥, 桥还遮着的话他会读成「在空中横移」。
  //   这不算泄题 —— 本轮的选择已经全部做完了。
  const showBridges = phase === "revealing" || leaving || disclosing;

  // 玩家当前所在的通道 —— **选完入口之后**只有这一条主线保持常态亮度, 其余 4 条压暗。
  // ⚠ advancing 时 currentLane 是**本段的入通道**(人正从这条走出去), 正是该亮着的那条;
  //   刚选完入口、还没推进过时 currentLane 可能尚未落位, 兜底回 entryLane。
  const activeLane = entryLane == null ? null : (currentLane ?? entryLane);

  // 换轮/换阶段时把悬停态清掉, 免得新的一轮留着上一轮的抬起砖、或阶段都变了浮卡还挂着。
  // ⚠ 回调走 ref 转一手: 直接进依赖数组的话, 调用方每渲染换一个新函数就会把悬停清个不停。
  const hoverOut = useRef(onHoverNode);
  hoverOut.current = onHoverNode;
  useEffect(() => {
    setHoverNode(null);
    setHoverLane(null);
    hoverOut.current(null);
  }, [board, phase]);

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

  // ★ 离场行走的路线 = 本轮**剩下的全部推进段**接成的一条折线(当前落点 → 第 4 段终点)。
  //   与 donePoints 同一套算法, 只是起点从 currentSegment 开始接着往下走。
  const walkPoints = useMemo<[number, number][]>(() => {
    if (!leaving || entryLane == null || currentSegment >= SEG_COUNT) return [];
    let lane = currentSegment === 0 ? entryLane : (currentLane ?? entryLane);
    const out: [number, number][] = [];
    for (let i = currentSegment; i < SEG_COUNT; i++) {
      const pts = segmentPoints(board.segments[i], lane, rows, i);
      out.push(...(out.length ? pts.slice(1) : pts));
      lane = traceSegment(board.segments[i], lane, rows).laneOut;
    }
    return out;
  }, [leaving, board, entryLane, currentLane, currentSegment, rows]);

  const legPath = useMemo(() => pathOf(legPoints), [legPoints]);
  const legLen = useMemo(() => lengthOf(legPoints), [legPoints]);
  const travelMs = Math.min(SIGNAL_MAX_MS, Math.max(SIGNAL_MIN_MS, legLen / SIGNAL_SPEED));
  const pawnDoneMs = travelMs + travelMs * PAWN_SPEED_DIV;

  const walkPath = useMemo(() => pathOf(walkPoints), [walkPoints]);
  const walkLen = useMemo(() => lengthOf(walkPoints), [walkPoints]);
  const walkMs = prefersReducedMotion()
    ? LEAVE_REDUCED_MS
    : Math.min(LEAVE_MAX_MS, Math.max(LEAVE_MIN_MS, walkLen / LEAVE_SPEED));

  // 过桥完成的时刻 —— 在那里留一圈扩散环
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

  // 推进播完 → 通知上层落点。⚠ 以**棋子落位**为准而不是信号点: 人还在路上就弹结算浮层,
  //   「他是怎么走过来的」这条唯一的路径信息就被打断了。
  // ⚠ 计时器挂 effect 里(而非裸 setTimeout): 战斗/离页导致卸载时清理函数顺手撤掉。
  useEffect(() => {
    if (!advancing) return;
    const id = window.setTimeout(onArrive, pawnDoneMs + SEG_TAIL_MS);
    return () => window.clearTimeout(id);
  }, [advancing, pawnDoneMs, onArrive, board.round, currentSegment]);

  // 离场行走播完 → 披露页。⚠ 没有路线可走(理论上 session.leaveRegion 已经拦掉)也要立刻回调,
  //   否则阶段机会停在 leaving 上, 玩家的画面就此卡死 —— 这一条兜底不能省。
  useEffect(() => {
    if (!leaving) return;
    const ms = walkPoints.length > 1 ? walkMs + SEG_TAIL_MS : 0;
    const id = window.setTimeout(onLeaveDone, ms);
    return () => window.clearTimeout(id);
  }, [leaving, walkMs, walkPoints.length, onLeaveDone, board.round]);

  // 棋子正在沿折线走 —— 推进段与离场行走两种情况共用同一套 animateMotion。
  // ⚠ 两者只差在「起步前等不等信号点」: 推进段要等(keyPoints 0;0;1), 离场行走没有信号点, 直接走。
  const pawnMoving = advancing ? legPoints.length > 1 : leaving && walkPoints.length > 1;
  const motionPath = advancing ? legPath : walkPath;
  const motionMs = advancing ? pawnDoneMs : walkMs;

  // ⚠ animateMotion 必须显式 beginElement(begin="indefinite"):
  //   begin="0s" 是相对 SVG 时间容器启动算的, 第二段之后会直接跳到终态(棋子凭空瞬移)。
  const motionRef = useRef<SVGElement | null>(null);
  useEffect(() => {
    if (!pawnMoving) return;
    (motionRef.current as SVGAnimationElement | null)?.beginElement();
  }, [pawnMoving, motionPath, board.round, currentSegment]);

  // 棋子静止站位: 没落过地就停在起点砖上, 否则停在最近一次的落点砖上。
  // ⚠ advancing / leaving 期间不用它 —— 那时位置由 animateMotion 沿折线驱动。
  const pawnAt = useMemo(() => {
    if (entryLane == null) return null;
    // ★ 披露页: 人刚刚在 leaving 那一相沿整条线路走到了第 4 段终点, 站位必须跟着落在那里 ——
    //   照旧回落到 currentSegment-1 的话, 披露浮层弹出的同一帧他会倒退回中途那块砖。
    if (disclosing) {
      let lane = entryLane;
      for (let i = 0; i < SEG_COUNT; i++) {
        lane = traceSegment(board.segments[i], lane, rows).laneOut;
      }
      return nodeCenter(SEG_COUNT - 1, lane);
    }
    if (currentSegment === 0 || currentLane == null) return nodeCenter(-1, entryLane);
    return nodeCenter(currentSegment - 1, currentLane);
  }, [entryLane, currentLane, currentSegment, disclosing, board, rows]);

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

  // 节点在哪些阶段可以悬停出详情: 揭示期与推进期一律惰性 ——
  // 那两拍玩家必须盯着桥接/信号, 不该被悬停详情分走注意力(§2.2)。
  const nodesInteractive = !generating && phase !== "revealing" && !advancing && !leaving;

  // ★ 画家算法: 屏幕上越靠下的砖越「近」, 必须后画。
  //   屏幕 y ∝ (s − u), 所以深度键就是 laneS(lane) − nodeU(seg), 升序 = 由远及近。
  //   ⚠ 砖虽然是薄片, 但落地影与悬停时抬起的那几 px 仍会互相压 —— 少了这一步, 远处那块的
  //     影子会盖在近处那块的砖面上。
  const sortedNodes = useMemo(() => {
    const out = board.nodes.flatMap((row, seg) => row.map((ev, lane) => ({ ev, seg, lane })));
    return out.sort((a, b) => laneS(a.lane) - nodeU(a.seg) - (laneS(b.lane) - nodeU(b.seg)));
  }, [board]);

  // 砖的几何全部通过 CSS 变量下发 ⇒ 尺寸只在本文件里定义一次, CSS 不重复写死任何一个数。
  const rootStyle = {
    width: `${ROUTE_PANEL_W}px`,
    height: `${ROUTE_PANEL_H}px`,
    "--board-bg": `url(${boardBg})`,
    "--tile-matrix": TILE_MATRIX,
    "--tile-size": `${TILE}px`,
    "--tile-w": `${TILE_W.toFixed(1)}px`,
    "--tile-h": `${TILE_H.toFixed(1)}px`,
    "--tile-depth": `${TILE_DEPTH}px`,
    "--proj-matrix": PANEL_MATRIX,
    "--proj-panel": `${PROJ_PANEL}px`,
    "--ground-drop": `${GROUND_DROP}px`,
  } as CSSProperties;

  return (
    // ⚠ key 挂轮号: 换轮时整块重挂, 生成动画才会从头再播一遍。
    <div
      key={board.round}
      className={cx(s.root, generating && s.isGenerating)}
      style={rootStyle}
    >
      {/* 地面: 16:9 场景占位图 + 中性暗色遮罩 + 等距网格 —— 只在没有外部场景时才铺 */}
      {ground && <div className={s.ground} aria-hidden />}

      {/* ⛔ 生成期**不做扫过全图的扫描光带**(旧版有, 这一版刻意去掉): 地面是一张场景图,
          横扫的亮带只会把底图冲白一遍。浮现的波面已经由「砖逐块落位 + 连线逐节绘制」
          表达完了(延迟按段 × 通道排, 见 CSS 的 .isGenerating 段), 不需要再加一层光。 */}

      {/* ── 场地: 主线 / 桥线 / 电流 ── */}
      <svg
        className={s.svg}
        viewBox={`0 0 ${ROUTE_PANEL_W} ${ROUTE_PANEL_H}`}
        style={{ height: `${ROUTE_PANEL_H}px` }}
        aria-hidden
      >
        {/* 主线: 由远及近(通道 0 → 4)绘制 = 等距场景的画家算法 */}
        {Array.from({ length: board.laneCount }, (_, lane) => {
          // ⚠ **只认悬停**。曾经把「advancing 时的入通道」也算作通电, 结果推进那几秒画面上
          //   同时亮着两条电光: 棋子真正走的那条折线, 与整条笔直的入通道主线 ——
          //   后者会被读成「他要一直走到底」, 直接和过桥的事实打架。
          const live = hoverLane === lane;
          const dim = activeLane != null && lane !== activeLane;
          const runs: [number, number][] = [];
          for (let seg = 0; seg < SEG_COUNT; seg++) {
            runs.push([nodeU(seg - 1) + TILE_INSET, nodeU(seg) - TILE_INSET]);
          }
          return (
            <g
              key={lane}
              className={cx(s.lane, live && s.isLive, dim && s.isDim)}
              style={{ "--i": lane } as CSSProperties}
            >
              {runs.map(([u0, u1], i) => (
                <Pipe key={i} a={pt(u0, lane)} b={pt(u1, lane)} j={i} />
              ))}
            </g>
          );
        })}

        {/* 桥线: 与主线完全同款(区分靠朝向相反 + 身上没有砖 + 平时不在画面上)。
            ⚠ 任何阶段都留在 DOM 里, 只改 opacity —— 卸载会让「记不住就没了」被 DevTools 绕过。
            ⚠ isRevealing 只挂在**揭示期**: 那几秒桥接要闪烁高亮(禁闪烁约定的唯一例外);
              披露页同样显形但**常亮不闪** —— 那是教学页, 不该再催人。 */}
        <g
          className={cx(
            s.bridges,
            !showBridges && s.isHidden,
            phase === "revealing" && s.isRevealing,
          )}
        >
          {board.segments.flatMap((seg) =>
            seg.bridges.map((b) => (
              <g key={`${seg.index}-${b.row}-${b.leftLane}`} className={s.bridge}>
                <Pipe
                  a={pt(bridgeU(seg.index, b.row, rows), b.leftLane)}
                  b={pt(bridgeU(seg.index, b.row, rows), b.leftLane + 1)}
                />
              </g>
            )),
          )}
        </g>

        {/* 已走过的路径(含披露页的整条线路) */}
        {donePoints.length > 1 && (
          <path
            className={cx(s.traceDone, disclosing && s.isDisclosed)}
            d={pathOf(donePoints)}
          />
        )}

        {/* 离场行走的那条线: 跟着棋子**同速**逐段描出来(不是一次性亮完) ——
            玩家要看到的是「他自己走出了这条线」, 一次性描完就又变回了一张答案图。
            ⚠ 时长由 walkMs 内联给出, reduced-motion 的压缩已经算在 walkMs 里了。 */}
        {leaving && walkPoints.length > 1 && (
          <path
            className={s.traceWalk}
            d={walkPath}
            style={
              { "--len": walkLen, animationDuration: `${Math.round(walkMs)}ms` } as CSSProperties
            }
          />
        )}

        {advancing && legPoints.length > 1 && (
          <g key={`${board.round}-${currentSegment}`}>
            <path
              className={s.traceLine}
              d={legPath}
              style={{ "--len": legLen, animationDuration: `${travelMs}ms` } as CSSProperties}
            />
            <path
              className={s.traceComet}
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
                className={s.ripple}
                cx={r.x}
                cy={r.y}
                r={5}
                style={{ animationDelay: `${Math.round(r.t)}ms` } as CSSProperties}
              />
            ))}
            {/* ⚠ 信号点的半径跟着线一起收: 线细了之后 9px 的点会读成「一颗球在管子上滚」。 */}
            <circle className={s.signal} r={6}>
              <animateMotion dur={`${travelMs}ms`} path={legPath} fill="freeze" calcMode="linear" />
            </circle>
          </g>
        )}
      </svg>

      {/* ── 入口 A-E: 与事件砖同一块砖, 靠独占的青色 + 最左那一列的位置区分 ──
          ⚠ 砖面上没有字, 通道号只能进 aria-label: 少了它读屏里五个入口完全一样。 */}
      <div className={s.entries}>
        {Array.from({ length: board.laneCount }, (_, lane) => {
          const blocked = board.blockedLanes.includes(lane);
          const active = entryLane === lane;
          const usable = phase === "choosingEntry" && !blocked;
          const c = nodeCenter(-1, lane);
          return (
            <button
              key={lane}
              type="button"
              className={cx(s.entry, active && s.isActive, blocked && s.isBlocked)}
              aria-label={`入口 ${ENTRY_LABELS[lane] ?? lane + 1}${blocked ? "(已封锁)" : ""}`}
              style={{ ...tileBox(c.x, c.y), "--i": lane } as CSSProperties}
              disabled={!usable}
              onPointerEnter={() => usable && setHoverLane(lane)}
              onPointerLeave={() => setHoverLane((l) => (l === lane ? null : l))}
              onFocus={() => usable && setHoverLane(lane)}
              onBlur={() => setHoverLane((l) => (l === lane ? null : l))}
              onClick={() => {
                setHoverLane(null);
                onPickEntry(lane);
              }}
            >
              {/* 贴地脉冲环: 从砖往外一圈圈荡开的等距波纹, 只有**还能点**的入口才有。
                  ⚠ 必须排在 TileArt **前面**: 它是地面上的波纹, 得压在砖底下(只露出砖外那截)。 */}
              <span className={s.entryPulse} aria-hidden />
              {/* 入口砖上立着通道号, 号上方再压一枚下指标 —— 立起来的字比躺在地上的好认得多 */}
              <TileArt
                icon={
                  <>
                    <EntryCue />
                    <span className={s.entryMark}>{ENTRY_LABELS[lane] ?? lane + 1}</span>
                  </>
                }
              />
            </button>
          );
        })}
      </div>

      {/* ── 20 个事件节点 ──
          ⚠ **必须按等距深度排序渲染**(见 sortedNodes)。 */}
      <div className={cx(s.nodes, !nodesInteractive && s.isInert)}>
        {sortedNodes.map(({ ev, seg, lane }) => {
          const { x, y } = nodeCenter(seg, lane);
          const landedHere = visited[seg] === lane;
          const isCurrent = landedHere && seg === currentSegment - 1 && !advancing;
          const settled = landedHere && seg < currentSegment - 1;
          // 披露页: 玩家放弃掉的段(没走到的)整体压暗, 让「我放弃了什么」看得见
          const abandoned = disclosing && seg >= currentSegment;
          const hovered = hoverNode?.seg === seg && hoverNode?.lane === lane;
          return (
            <button
              key={`${seg}-${lane}-${ev.id}`}
              type="button"
              className={cx(
                s.node,
                s[`k-${ev.kind}`],
                isCurrent && s.isCurrent,
                settled && s.isSettled,
                abandoned && s.isAbandoned,
                hovered && s.isHovered,
              )}
              aria-label={`第 ${seg + 1} 推进段 · ${ev.title}`}
              style={
                {
                  ...tileBox(x, y),
                  "--i": seg * LANE_COUNT + lane,
                  "--seg": seg,
                  "--lane": lane,
                } as CSSProperties
              }
              tabIndex={nodesInteractive ? 0 : -1}
              disabled={!nodesInteractive}
              onPointerEnter={() => {
                setHoverNode({ seg, lane });
                onHoverNode({ seg, lane });
              }}
              onPointerLeave={() => {
                setHoverNode(null);
                onHoverNode(null);
              }}
              onFocus={() => {
                setHoverNode({ seg, lane });
                onHoverNode({ seg, lane });
              }}
              onBlur={() => {
                setHoverNode(null);
                onHoverNode(null);
              }}
            >
              <TileArt icon={<RouteEventIcon kind={ev.kind} />} kind={ev.kind} />
            </button>
          );
        })}
      </div>

      {/* ── 玩家棋子(单独一层, 压在砖层之上) ── */}
      {entryLane != null && (
        <svg
          className={s.pawnLayer}
          viewBox={`0 0 ${ROUTE_PANEL_W} ${ROUTE_PANEL_H}`}
          style={{ height: `${ROUTE_PANEL_H}px` }}
          aria-hidden
        >
          {pawnMoving ? (
            // key 带段号与「是哪一种行走」: 每段/每次离场重挂一次, animateMotion 才会重播
            <g
              key={`${board.round}-${currentSegment}-${advancing ? "adv" : "leave"}`}
              className={cx(s.pawn, s.isWalking)}
            >
              <Pawn />
              {/* ⚠ 等信号点跑完再起步这件事**只能用 keyPoints 做, 不能用 begin 延迟**:
                  未开始的 animateMotion 会把元素按在自己的原点(面板左上角)上。
                  ★ 离场行走没有信号点先跑, 所以那一支是干净的 0→1, 不需要等待段。 */}
              <animateMotion
                ref={motionRef}
                begin="indefinite"
                dur={`${Math.round(motionMs)}ms`}
                path={motionPath}
                keyPoints={advancing ? "0;0;1" : "0;1"}
                keyTimes={advancing ? `0;${(travelMs / pawnDoneMs).toFixed(4)};1` : "0;1"}
                fill="freeze"
                calcMode="linear"
              />
            </g>
          ) : (
            pawnAt && (
              <g
                className={s.pawn}
                style={{ transform: `translate(${pawnAt.x}px, ${pawnAt.y}px)` }}
              >
                <Pawn />
              </g>
            )
          )}
        </svg>
      )}
    </div>
  );
}
