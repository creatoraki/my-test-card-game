// ★ 区域路由图(等距瓦片战棋视角) ★ —— 探索页的主体交互, 见 探索模式设计.md §2 与 §11.1。
//
// 一轮 = 一张 5 通道 × 4 推进段的图。各阶段各对应一种画面, 全部落在同一张 SVG 上:
//   generating —— 棋盘沿推进方向(左下 → 右上)逐条浮现(起点地板 → 连线 → 节点地板), 共 GENERATE_MS; 全程不可交互。
//                 ⚠ 桥接自始至终不出现 —— 这一段是「浮现仪式」, 不是信息展示。
//   sealed    —— 图已浮现完、桥接仍遮蔽, 正中悬一个「探索路线」按钮。不限时。
//   revealing —— **全图 4 段桥接一次性全显** + 顶部倒计时; 玩家在这 2-3 秒里用眼睛记。
//                只能由 sealed 阶段按下按钮进入, 一轮仅此一次。
//   choosingEntry —— 桥接整体淡出到 opacity:0(⚠ 只改 opacity, **不卸载**: DOM 里留着才不会被
//                「查看元素」看穿); 入口通道 A-E 变成可点按钮。★ 全轮唯一一次自由选择。
//   advancing —— 信号沿当前推进段的折线前进: 顺主管朝右上 → 走到岔口拐上桥管 → 落到隔壁通道;
//                **代表玩家的几何体小人跟在信号点后半步走同一条折线**(见下面的 <Pawn>)。
//   leaving   —— **离场行走**: 玩家在 atNode 选了「前往下一区域」之后, 棋子沿本轮**剩余的整条
//                线路**从当前落点一路走到第 4 段终点, 走线跟着他同速描出来, 桥接一并显形。
//                ⚠ 这一相的意义是「不许把人瞬移进战斗」: 走完(onLeaveDone)才进披露页。
//                没有剩余线路可走时(0 节点直推 / 已走满 4 段)session 会跳过它。
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
// ★ 呈现方式: **瓦片地板 + 黑色连线**。20 个节点各是一块等距瓦片地板(正方形地板的等距投影
//   = 2:1 菱形 + 厚度), **地板的材质本身跟着该节点的事件类型走**(顶面/侧面/砖缝按 --k 轻度染色,
//   风险标记再叠一档 —— 见 RouteBoard.css 的 .rb-tile-top), 地板上**站着**一个立体感的事件图标;
//   ★ 5 个入口(A-E)**刻意不是同一类物件**: 同样的 2:1 底盘, 但材质与零件表都另起一套 ——
//     亮青高填充的台面 + 外扩光环 + 指向推进方向的人字标 + 升起的光柱 + 大一档的立体字母
//     (见下面的 <EntryTile>)。「入口」与「事件」在画面上必须一眼分得开, 别把两者的样式合并回去;
//   地板之间用**一条嵌进地面的细线**相连(暗色轨槽 + 细导线两层描边, 圆头端帽塞进地板边缘,
//   不是圆柱水管)。
//   ★ 这条线的颜色是**低饱和暖灰铜**(--rb-pipe), 刻意不是冷白 —— 它读作「没通电的裸金属导槽」,
//     通电(悬停 / 电流 / 桥接显形)才转成发光的冷色。⚠ 别改回冷白: 那会与显形中的亮青桥接
//     同属冷色且明度更高, 揭示的那两三秒里 20 条主线比 4 段桥接还抢眼(见 CSS 里 --rb-pipe 的注释)。
//   ⚠ 这条线是电流特效(信号推进/已走路径/悬停通电)的轨道: 端点与端帽照着电流定,
//     电流比它粗、跑过去把它整条盖住 —— 详见 RouteBoard.css 里 .rb-pipe 处的对齐约定。
//   ⚠ **桥接平时用的是与主线完全相同的那条线**, 没有独立材质 —— 这是刻意的(见下);
//     唯一的例外是**揭示期**: 那两三秒里桥接换成闪烁的亮青, 与暖铜底线在色相与明度上双向拉开(见 CSS)。
//   ★ 选完入口之后, 「不是玩家这一条」的通道主线整体压暗(.rb-lane.is-dim, 见下面的 dim):
//     推进期画面上同时跑着电流走线与已走路径, 20 条等亮的主线会把它们淹掉。
//
//   ⚠ 等距下两条轴都是斜线, §11.1 点名的唯一真实风险是它们**形状撞车**。旧版靠「走廊平台 vs
//     发光天桥」两种材质来区分; 本版取消了那套材质对立, 风险改由三件事承担, ⚠ 改动本文件时
//     务必保住这三条, 否则那条风险会原样回来:
//       ① 两条轴的**屏幕朝向天然相反** —— 主线朝右上, 桥线朝右下;
//       ② **地板只长在推进轴上** —— 串着地板的那条线就是通道, 横着搭的那根没有地板;
//       ③ 桥线**平时根本不在画面上**(沿用只改 opacity 的遮蔽机制), 它一出现就只可能是「跨道」。
//
// ★ 本文件所有坐标都是「设计 px」, 与 stage.ts 的 1920×1080 画布同一套尺度 ——
//   面板由 ExploreScreen 定位, 这里只管面板内部的构图。改版式直接改下面的常量。

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { traceSegment } from "@/explore/route";
import type {
  ExplorePhase,
  NodeEventKind,
  RouteBoard as RouteBoardData,
  RouteSegment,
} from "@/explore/types";
import { prefersReducedMotion } from "@/ui/app/transitions";
import { cx } from "@/ui/common/cx";
import s from "./RouteBoard.module.css";

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
// ⚠ 起点 → 第 1 段的推进距离**必须与段间距相等**: 这条通道上的 5 块地板是同一种东西
//   (「一格」), 起点那一格短一截会读成「第 1 段特别近 / 起点是贴上去的」, 节奏当场不匀。
//   两个数写成一个常量, 免得以后又被分头改开。
const SEG_PITCH = 200; // 相邻两块地板之间的推进距离(沿推进轴) —— 起点 → 段 1 也走这个数
const ENTRY_RUN = SEG_PITCH;
const LANE_GAP = 124; // 相邻通道的中心距(沿通道轴)

const TILE_HALF = 20; // 地板在世界坐标里的半边长(⇒ 正方形边长 40)
const TILE_D = 9; // 地板厚度(纯屏幕垂直方向)
const ICON_H = 40; // 站在地板上的图标高度 —— 同时就是面板上边界要留的净空
const ENTRY_U = -96; // 起点地板的推进坐标(第 1 段节点之前一格)
const TILE_INSET = 22; // 连线两端从地板中心往里缩多少 ⇒ 圆头端帽正好塞进地板边缘

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
export const TILE_BOX_H = TILE_TOP_H + TILE_D; // 连厚度一起的按钮盒高

// 站在地板上的图标顶端相对瓦片顶面中心的高度 —— 悬浮卡要贴在它上方。
export const NODE_ICON_TOP = ICON_H + TILE_TOP_H / 2;

const ENTRY_LABELS = ["A", "B", "C", "D", "E"];

// 「探索路线」横条的**底边**距面板底边的距离(anchor 走 translate(-50%,-100%), 见 CSS)。
// ⚠ 见下面挂 .rb-probe-anchor 处的长注释: 横条顶边必须留在最低那块节点地板的底沿(y ≈ 585)之下,
//   这个数往上调就会重新遮挡段 1 · 通道 E 的节点。面板高约 702 ⇒ 底部有约 110px 的净空。
const PROBE_BOTTOM_INSET = 6;

// 信号点的行进速度(设计 px / ms)与时长夹逼。
// ⚠ 比上一版更慢(0.75 → 0.42): §11.2 要求「足够慢地逐格经过主管与桥管」——
//   推进动画是每个推进段的核心仪式感, 快了就只剩一个结果通知。
const SIGNAL_SPEED = 0.42;
const SIGNAL_MIN_MS = 900;
const SIGNAL_MAX_MS = 2200;
const SIGNAL_TAIL_MS = 260; // 抵达节点后多停一拍再结算, 免得画面一到就跳
// 玩家棋子的节奏: **等信号点把整条折线跑完**(= travelMs)才起步 —— 信号点是「路线被点亮」,
// 小人是「人真的走过去」, 两件事分开演, 不抢同一拍。
// 走的速度是信号点的 1/3(耗时 ×3): 推进段是本页的核心仪式感, 人走得慢才看得清他从哪条通道
// 拐到哪条通道去。⚠ 一段推进的总时长因此是 travelMs × 4, onArrive 的计时器按 pawnDoneMs 排,
//   改这个数一定会同步改变段落节奏, 不要只当成一个动画参数。
const PAWN_SPEED_DIV = 3;

// ★ 离场行走(phase = "leaving")的速度: 玩家在 atNode 按下「前往下一区域」之后, 棋子要**沿本轮
//   剩下的整条线路一路走到第 4 段终点**, 走完才弹披露页 —— 「放弃剩余节点」不等于被瞬移进战斗。
// ⚠ 刻意比推进段的走速(SIGNAL_SPEED / PAWN_SPEED_DIV ≈ 0.14)快一档: 这一段最长要走 4 个
//   推进段(近千 px), 用推进段的速度会拖到 6 秒以上 —— 那是过场, 不是仪式感。
//   但仍明显慢于信号点(0.42), 读得出是「人在走」而不是「线被点亮」。
const LEAVE_SPEED = 0.28;
const LEAVE_MIN_MS = 900;
const LEAVE_MAX_MS = 3600;
// reduced-motion: 路径信息保留(线照样描、人照样沿线移动), 只压到最短可辨识时长。
// ⚠ 与 .rb-trace-walk 共用这一个数 —— 那条线的 animationDuration 是内联传进去的, 两者天然同步。
const LEAVE_REDUCED_MS = 420;

// ★ 生成演出总时长。RouteBoard.css 的 rbGen* 关键帧按这条时间轴排:
//   起点地板 0-740 / 连线逐节绘制 380-1480 / 节点地板落位 1090-1998 / 扫描光带 0-1900。
//   **改这里必须同步改那几段的 delay+duration**, 否则 ExploreScreen 的定时器会比画面早或晚落地。
//   reduced-motion 走下面的压缩值。
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
// 轨道**到最后一块地板为止**。⚠ 这里曾经再往前伸出一截 RUN_OUT 的短桩(本意是「信号继续向前」),
//   但第 4 段之后没有任何东西, 它在画面上就是 5 根连着空气的线头 —— 已删除, 不要加回来。
const TRACK_LEN = nodeU(SEG_COUNT - 1);
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
// 推进方向上从起点地板的最外角一直到末段地板的最外角, 通道方向上是两侧地板各自的最外角。
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
// 上边界取两者较高的一个: 站在最远那块地板上的图标顶端, 或末段地板本身的上尖角。
// 下边界要算上最近那块地板的厚度。
const Y_LO = Math.min(rawY(nodeU(SEG_COUNT - 1), 0) - ICON_H, rawY(TRACK_LEN, S_MIN));
const Y_HI = rawY(U_MIN, S_TOP) + TILE_D;
const ORIGIN_X = PAD - X_LO;
const ORIGIN_Y = PAD - Y_LO;

export const ROUTE_PANEL_W = Math.round(X_HI - X_LO + PAD * 2);
export const ROUTE_PANEL_H = Math.round(Y_HI - Y_LO + PAD * 2);

// 一根桥接在本段内的推进距离。段内均分, 首尾各留一格 —— 免得桥管贴在节点地板上。
// ⚠ 首段不再单独用一个更小的留空(旧值 40): 起点 → 段 1 的距离已经和段间距一样了,
//   两边用同一个数, 四段的桥接才是等间距的。
function bridgeU(seg: number, row: number, rows: number): number {
  const from = nodeU(seg - 1) + 48;
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

// ===================== 连线 =====================
// **一条嵌进地面的细线**: 两层同几何的描边 —— 底下一条更粗的暗色「轨槽」(.rb-pipe-bed),
// 上面一条细亮线(.rb-pipe); 都是圆头端帽, 塞进地板边缘。粗细与配色全在 RouteBoard.css。
// ⚠ 两层的意义: 单层白线贴在暗背景上会读成「画上去的一笔」; 垫一层比它宽一档的近黑槽之后,
//   亮线读作**躺在凹槽里的导体**, 等距场景的地面关系才立得住。改线宽必须两层一起改。
// ⚠ 它存在的意义是给电流特效(.rb-trace-line / .rb-trace-head / .rb-signal)当轨道, 所以
//   **几何必须与电流完全一致**: 同一组端点、同样的 round 端帽/接头; 亮线比电流细一档,
//   电流跑过去把亮线整条盖住、只在两侧留下轨槽的暗边 —— 任何一项改了都会露出错位。
// ⚠ 主管与桥管仍共用这一组 class ⇒ 平时天然同款(见抬头 ③), 揭示期的换色由 CSS 单独挂。
//
// ★ --len(这一节的屏幕长度)与 --j(这一节在通道里的序号)是**给生成演出用的**:
//   生成期两层一起走 stroke-dashoffset 的逐节绘制, 延迟按 --i(通道) + --j(节号) 排成
//   一个平行于通道轴、沿推进轴推进的波面; spark 是跟在绘制头上的那点火花。
//   ⚠ 平时这三个都不生效(CSS 里只有 .is-generating 作用域读它们), 不影响常态渲染。
function Pipe({
  a,
  b,
  j = 0,
  spark = false,
}: {
  a: [number, number];
  b: [number, number];
  j?: number;
  spark?: boolean;
}) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const geo = { x1: a[0], y1: a[1], x2: b[0], y2: b[1] };
  return (
    <g style={{ "--len": len.toFixed(1), "--j": j } as CSSProperties}>
      <line className={s["rb-pipe-bed"]} {...geo} />
      <line className={s["rb-pipe"]} {...geo} />
      {spark && <line className={s["rb-pipe-spark"]} {...geo} />}
    </g>
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
    <svg className={s["rb-tile"]} viewBox={`0 0 ${TILE_W} ${TILE_BOX_H}`} aria-hidden>
      {/* 侧面: 左下 + 右下两条边一起挤出厚度(先画, 顶面压在上面) */}
      <polygon
        className={s["rb-tile-side"]}
        points={poly([T_LEFT, T_BOTTOM, T_RIGHT, drop(T_RIGHT), drop(T_BOTTOM), drop(T_LEFT)])}
      />
      <polygon className={s["rb-tile-top"]} points={poly([T_TOP, T_RIGHT, T_BOTTOM, T_LEFT])} />
      <polygon
        className={s["rb-tile-seam"]}
        points={poly([T_TOP, T_RIGHT, T_BOTTOM, T_LEFT].map(seamPt))}
      />
    </svg>
  );
}

// ===================== 入口地板(A-E 专用) =====================
// ★ 入口与 20 块事件地板**必须一眼分得开**: 事件地板是「暗底 + 事件色轻度染色」的普通砖,
//   入口则是一座**亮青的发光登船台** —— 换的不只是颜色, 连零件表都不一样:
//     ① 顶面高填充的亮青实心(事件砖是 18% 的轻染) ⇒ 五块入口在一片暗棋盘上直接跳出来;
//     ② 外面套一圈**外扩的虚线光环**(halo), 事件砖没有任何外扩物件;
//     ③ 顶面上刻两枚指向**推进方向**的等距人字标(chevron) ⇒ 「从这里往右上出发」;
//     ④ 前缘(u = +h 那条边, 即朝推进方向的那条棱)单独加粗点亮, 读作登船台的出发沿。
//   再加上 CSS 里那道从地板升起的光柱(.rb-entry-beam)与比节点大一档的立体字母,
//   「入口」在画面上是一类**独立的物件**, 而不是「另一种颜色的事件砖」。
// ⚠ 几何一律用下面的 elocal(du, ds) 从世界坐标投影, **不要直接写屏幕 px**:
//   手写的斜线一旦不是 2:1, 在等距场景里会当场读成「飘在地板上方的贴纸」。
// ⚠ 全部零件都不接受指针事件(见 CSS): 光环外扩到按钮盒之外, 否则会把邻座通道的悬停吃掉。
const elocal = (du: number, ds: number): [number, number] => [
  TILE_W / 2 + du * ADV_X + ds * LANE_X,
  TILE_TOP_H / 2 + du * ADV_Y + ds * LANE_Y,
];
// 光环: 比地板(半边长 TILE_HALF=20)大一圈的同心菱形。
const HALO_HALF = 33;
// 人字标: 尖端朝 +u(推进方向), 两翼沿通道轴张开 ⇒ 投影后仍是标准 2:1 的箭头。
const chevron = (a: number): string => poly([elocal(a, -9), elocal(a + 9, 0), elocal(a, 9)]);

function EntryTile() {
  const corners = (h: number): [number, number][] => [
    elocal(h, -h), // 上角
    elocal(h, h), // 右角
    elocal(-h, h), // 下角
    elocal(-h, -h), // 左角
  ];
  return (
    <svg className={s["rb-tile"]} viewBox={`0 0 ${TILE_W} ${TILE_BOX_H}`} aria-hidden>
      {/* 外扩光环: 画在最底层, 地板压在它上面 ⇒ 读作「从台座底下透出来的光圈」。 */}
      <polygon className={s["rb-entry-halo"]} points={poly(corners(HALO_HALF))} />
      <polygon
        className={s["rb-tile-side"]}
        points={poly([T_LEFT, T_BOTTOM, T_RIGHT, drop(T_RIGHT), drop(T_BOTTOM), drop(T_LEFT)])}
      />
      <polygon className={s["rb-tile-top"]} points={poly([T_TOP, T_RIGHT, T_BOTTOM, T_LEFT])} />
      <polygon className={s["rb-tile-seam"]} points={poly(corners(TILE_HALF * SEAM))} />
      {/* 前缘: 朝推进方向的那条棱(上角—右角), 单独加粗点亮。 */}
      <polyline className={s["rb-entry-edge"]} points={poly([T_TOP, T_RIGHT])} />
      {/* 两枚人字标, 沿推进轴一前一后。 */}
      <polyline className={s["rb-entry-chevron"]} points={chevron(-9)} />
      <polyline className={s["rb-entry-chevron"]} points={chevron(0)} />
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
      <g className={s["ri-body"]} transform="translate(0 2)">
        {art}
      </g>
      <g>{art}</g>
      <g className={s["ri-lit"]} transform="translate(-0.7 -0.9)">
        {art}
      </g>
    </svg>
  );
}

// ===================== 玩家棋子(几何体小人) =====================
// ★ 「我在哪」的实体表达。它常驻在当前位置(选完入口 → 起点地板; 每段落地 → 落点地板),
//   推进时**跟在白色信号点后面**沿同一条折线走过去 —— 走过的那条荧光线就是它的运动轨迹。
//
// ⚠ 刻意用**实心几何面**而不是线框: 节点事件图标全是线框(见 StandingIcon), 两者一实一虚,
//   玩家一眼能分清「我」和「这里有什么事」。明暗分档沿用地板的语言(顶面亮 / 右侧面中 / 左侧面暗),
//   它才读作「站在这块棋盘里的一个东西」, 而不是贴在画面上的一枚 UI 标记。
// ⚠ 左右对称, **不做朝向翻转**: 桥接可能朝任一侧跨, 判方向要按段算, 收益不抵复杂度。
//
// 局部坐标: **原点在脚底**(0,0), 整个人朝 −y 长出去 —— animateMotion 与静止定位都只需把原点
// 摆到地板顶面中心, 不用再补任何高度偏移。
// ⚠ 整体高约 48px, 与站在地板上的事件图标(ICON_H = 40)同一量级并略高一档 ——
//   玩家自己必须是这张图上最容易一眼找到的东西, 比事件图标小就会淹在棋盘里。
const PAWN_BW = 12; // 躯干底面半宽
const PAWN_TW = 8; // 躯干顶面半宽(上小下大的棱台)
const PAWN_TH = 28; // 躯干高
const PAWN_NECK = 4; // 躯干顶面 → 头部底面的间隙
const PAWN_HW = 7.5; // 头(小立方体)半宽
const PAWN_HH = 13; // 头高

// 一个等距实体在屏幕上只看得见三个面: 顶面(2:1 菱形) + 朝观者的左右两个侧面。
// 底面菱形四角(半宽 w, 基准高度 y): 左 / 下 / 右 / 上 —— 与 <Tile> 的 2:1 比例一致。
function diamond(w: number, y: number) {
  const L: [number, number] = [-w, y];
  const B: [number, number] = [0, y + w / 2];
  const R: [number, number] = [w, y];
  return { L, B, R };
}

function Pawn() {
  const t = diamond(PAWN_TW, -PAWN_TH); // 躯干顶面
  const b = diamond(PAWN_BW, 0); // 躯干底面
  const hy0 = -(PAWN_TH + PAWN_NECK); // 头底面
  const hy1 = hy0 - PAWN_HH; // 头顶面
  return (
    <g className={s["rb-pawn-body"]}>
      {/* 投影留在地面上, **不进呼吸组** —— 人起伏时影子跟着飘会立刻穿帮。 */}
      <ellipse className={s["rb-pawn-shadow"]} cx={0} cy={0} rx={16} ry={6.5} />
      <g className={s["rb-pawn-idle"]}>
        {/* 躯干: 左侧面(暗) / 右侧面(中) / 顶面(亮) */}
        <polygon className={s["rb-pawn-dark"]} points={poly([b.L, b.B, t.B, t.L])} />
        <polygon className={s["rb-pawn-mid"]} points={poly([b.B, b.R, t.R, t.B])} />
        <polygon
          className={s["rb-pawn-lit"]}
          points={poly([t.L, t.B, t.R, [0, -PAWN_TH - PAWN_TW / 2]])}
        />
        {/* 头: 同样三个面 */}
        <polygon
          className={s["rb-pawn-dark"]}
          points={poly([
            [-PAWN_HW, hy0],
            [0, hy0 + PAWN_HW / 2],
            [0, hy1 + PAWN_HW / 2],
            [-PAWN_HW, hy1],
          ])}
        />
        <polygon
          className={s["rb-pawn-mid"]}
          points={poly([
            [0, hy0 + PAWN_HW / 2],
            [PAWN_HW, hy0],
            [PAWN_HW, hy1],
            [0, hy1 + PAWN_HW / 2],
          ])}
        />
        <polygon
          className={s["rb-pawn-lit"]}
          points={poly([
            [-PAWN_HW, hy1],
            [0, hy1 + PAWN_HW / 2],
            [PAWN_HW, hy1],
            [0, hy1 - PAWN_HW / 2],
          ])}
        />
      </g>
    </g>
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
  /** 离场行走播完 → store 的 leaveDone()(会话从 leaving 进 routeDisclosure)。
   *  ⚠ 没有剩余线路可走时(理论上 session 已经拦掉)本组件会立刻回调, 阶段机不会卡死。 */
  onLeaveDone: () => void;
  /** 悬停/聚焦某个节点 → ExploreScreen 的节点悬浮浮卡。null = 移开。 */
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
  onLeaveDone,
  onHoverNode,
}: Props) {
  const rows = board.rowsPerSegment;
  // 悬停/聚焦中的入口 —— 只用来把**那一条通道的整串水管**点亮。
  // ⚠ 绝不据此提示落点: 主管本身不泄露信息(它是常显的), 但一旦预告落点, 整套记忆玩法就没了。
  const [hoverLane, setHoverLane] = useState<number | null>(null);

  const advancing = phase === "advancing";
  // 离场行走: 「前往下一区域」按下之后、披露页之前的那一段演出(见 session.leaveRegion)。
  const leaving = phase === "leaving";
  // 披露态: 披露页本身 + 其后的战斗签两相。★ 战斗签期间线路继续摊在浮层背后 ——
  // 披露一旦开始就不该再收回去, 那会让玩家以为「刚才那张图我没看够就没了」。
  const disclosing =
    phase === "routeDisclosure" || phase === "slotSpinning" || phase === "slotChoosing";
  // 玩家当前所在的通道 —— **选完入口之后**只有这一条主线保持常态亮度, 其余 4 条压暗(见 CSS 的
  // .rb-lane.is-dim)。选入口之前它是 null ⇒ 5 条通道一样亮, 因为那时它们是同等重要的候选。
  // ⚠ advancing 时 currentLane 是**本段的入通道**(人正从这条走出去), 正是该亮着的那条;
  //   刚选完入口、还没推进过时 currentLane 可能尚未落位, 兜底回 entryLane。
  const activeLane = entryLane == null ? null : (currentLane ?? entryLane);
  const generating = phase === "generating";
  const sealed = phase === "sealed";
  // 桥接: 揭示期、离场行走与披露页可见。⚠ 其余阶段留在 DOM 里只改 opacity(见抬头)。
  // ★ 离场行走也显形: 人这一路要连过好几根桥, 桥还遮着的话他会读成「在空中横移」。
  //   这不算泄题 —— 本轮的选择已经全部做完了。
  const showBridges = phase === "revealing" || leaving || disclosing;

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

  const walkPath = useMemo(() => pathOf(walkPoints), [walkPoints]);
  const walkLen = useMemo(() => lengthOf(walkPoints), [walkPoints]);
  const walkMs = prefersReducedMotion()
    ? LEAVE_REDUCED_MS
    : Math.min(LEAVE_MAX_MS, Math.max(LEAVE_MIN_MS, walkLen / LEAVE_SPEED));

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

  // 棋子的时间轴: 先让信号点把整条折线跑完(travelMs), 小人才起步, 再以信号点 1/3 的速度走完同一条线。
  // ⇒ 一段推进的完整时长 = travelMs × (1 + PAWN_SPEED_DIV)。
  const pawnWalkMs = travelMs * PAWN_SPEED_DIV;
  const pawnDoneMs = travelMs + pawnWalkMs;

  // 棋子正在沿折线走 —— 推进段与离场行走两种情况共用同一套 animateMotion(见下面的棋子层)。
  // ⚠ 两者只差在「起步前等不等信号点」: 推进段要等(keyPoints 0;0;1), 离场行走没有信号点, 直接走。
  const pawnMoving = advancing ? legPoints.length > 1 : leaving && walkPoints.length > 1;
  const motionPath = advancing ? legPath : walkPath;
  const motionMs = advancing ? pawnDoneMs : walkMs;

  // 推进播完 → 通知上层落点。⚠ 以**小人落位**为准而不是信号点: 人还在路上就弹结算浮层,
  //   「他是怎么走过来的」这条唯一的路径信息就被打断了。
  // ⚠ 计时器挂 effect 里(而非裸 setTimeout): 战斗/离页导致卸载时清理函数顺手撤掉, 不会有卸载后回调。
  useEffect(() => {
    if (!advancing) return;
    const id = window.setTimeout(onArrive, pawnDoneMs + SIGNAL_TAIL_MS);
    return () => window.clearTimeout(id);
  }, [advancing, pawnDoneMs, onArrive, board.round, currentSegment]);

  // 离场行走播完 → 披露页。⚠ 没有路线可走(理论上 session.leaveRegion 已经拦掉)也要立刻回调,
  //   否则阶段机会停在 leaving 上, 玩家的画面就此卡死 —— 这一条兜底不能省。
  useEffect(() => {
    if (!leaving) return;
    const ms = walkPoints.length > 1 ? walkMs + SIGNAL_TAIL_MS : 0;
    const id = window.setTimeout(onLeaveDone, ms);
    return () => window.clearTimeout(id);
  }, [leaving, walkMs, walkPoints.length, onLeaveDone, board.round]);

  // ★ 棋子的 animateMotion **必须显式 beginElement() 启动**(begin="indefinite")。
  // ⚠ 这是「只有第一段有走路动画、后面几段全是瞬移」那个 bug 的根: SMIL 的 begin="0s" 是相对
  //   **SVG 时间容器启动**算的。第一段推进恰好是这层 <svg> 刚挂上去的那一刻(entryLane 从 null
  //   变成通道号), 容器时间正好 0, 动画正常播; 之后几段容器已经跑了几十秒, 新插进来的动画
  //   begin=0 落在过去 → 直接跳到 fill="freeze" 的终态, 看起来就是人凭空瞬移到落点。
  //   改成 indefinite + 手动 beginElement, 每一段都从「现在」开始, 与容器跑了多久无关。
  const pawnMotionRef = useRef<SVGElement | null>(null);
  useEffect(() => {
    if (!pawnMoving) return;
    (pawnMotionRef.current as SVGAnimationElement | null)?.beginElement();
  }, [pawnMoving, motionPath, board.round, currentSegment]);

  // 玩家棋子的**静止**站位: 还没落过地就站在起点地板上, 否则站在最近一次的落点地板上。
  // ⚠ advancing 期间不用它 —— 那时位置由 animateMotion 沿本段折线驱动。
  const pawnAt = useMemo(() => {
    if (entryLane == null) return null;
    // ★ 披露页: 人刚刚在 leaving 那一相沿整条线路走到了第 4 段终点, 站位必须跟着落在那里 ——
    //   照旧回落到 currentSegment-1 的话, 披露浮层弹出的同一帧他会倒退回中途那块地板,
    //   刚演完的那段行走当场作废(走满 4 段的那条路径两者本就同值, 不受影响)。
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

  // 节点在哪些阶段可以悬停出详情: 揭示期与推进期一律惰性 ——
  // 那两拍玩家必须盯着桥接/信号, 不该被悬停详情分走注意力(§2.2)。
  const nodesInteractive = !generating && phase !== "revealing" && !advancing && !leaving;

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
      className={cx(s["route-board"], generating && s["is-generating"])}
      style={{ width: `${ROUTE_PANEL_W}px`, height: `${ROUTE_PANEL_H}px` }}
    >
      {/* ── 生成期的扫描光带 ──
          一条**平行于通道轴**(朝右下, 靠 CSS 的 skewX 摆成 2:1 斜率)的光带, 在生成的那 2 秒里
          沿推进方向扫过全图一次 —— 它就是连线逐节绘制的那个「波面」的可见化身: 光带扫到哪,
          哪一段线路刚好被画出来。⚠ 单次播放、播完随元素一起卸载, 不是明暗脉冲, 不违反禁闪烁约定。
          ⚠ 只在 generating 时挂载: 它是全屏尺寸的混合层, 常驻会白白吃合成开销。 */}
      {/* ⚠ 必须套一层 overflow:hidden 的 clip 层: 光带要扫出面板两侧才叫「扫过去」,
          裸放在 .route-board 里(它没有 overflow 裁剪)那截尾巴会直接飘到隔壁的侧栏上。 */}
      {generating && (
        <span className={s["rb-scan-clip"]} aria-hidden>
          <span className={s["rb-scan"]} />
        </span>
      )}

      {/* ── 顶部倒计时: 只在揭示阶段出现, 宽度由 CSS 动画从 100% 收到 0 ── */}
      {/* <div className={s["rb-timer"]} aria-hidden>
        {phase === "revealing" && (
          <span
            key={board.round}
            className={s["rb-timer-fill"]}
            style={{ animationDuration: `${board.revealDurationMs}ms` }}
          />
        )}
      </div> */}

      {/* ── 入口 A-E: 每条通道**起点(左下端)**的那一块地板 ──
          与节点地板同款瓦片, 上面站着一个立体字母。五块地板沿通道轴排成一条朝右下的斜线。
          它们仍是全屏最重要的可点物件(§11.2), 故字母比节点图标大一档。
          常态各自极缓慢地上下浮动(相位靠 --i 错开), 悬停时定住抬起、字母点亮、所属通道整串水管转亮。
          ⚠ 所有反馈都是位移/描边色的连续过渡, **没有任何明暗闪烁**(见 RouteBoard.css 抬头的约定)。 */}
      <div className={s["rb-entries"]}>
        {Array.from({ length: board.laneCount }, (_, lane) => {
          const blocked = board.blockedLanes.includes(lane);
          const active = entryLane === lane;
          const usable = phase === "choosingEntry" && !blocked;
          const c = nodeCenter(-1, lane);
          return (
            <button
              key={lane}
              type="button"
              className={cx(s["rb-entry"], active && s["is-active"], blocked && s["is-blocked"])}
              style={{ ...tileBox(c.x, c.y), "--i": lane } as CSSProperties}
              disabled={!usable}
              onPointerEnter={() => usable && setHoverLane(lane)}
              onPointerLeave={() => setHoverLane((l) => (l === lane ? null : l))}
              onFocus={() => usable && setHoverLane(lane)}
              onBlur={() => setHoverLane((l) => (l === lane ? null : l))}
              onClick={() => onPickEntry(lane)}
              // title={blocked ? "该通道已被隔断封锁" : `从 ${ENTRY_LABELS[lane]} 通道进入`}
            >
              <EntryTile />
              <span className={s["rb-tile-shadow"]} aria-hidden />
              {/* 从地板升起的光柱: 入口专属的第三件「事件砖没有的东西」。
                  ⚠ 必须排在字母之前 —— 两者都是绝对定位, 后画的压在上面, 字母要在光里。 */}
              <span className={s["rb-entry-beam"]} aria-hidden />
              <span className={s["rb-entry-letter"]}>{ENTRY_LABELS[lane] ?? lane + 1}</span>
            </button>
          );
        })}
      </div>

      {/* ── 等距场地本体 ── */}
      <svg
        className={s["rb-svg"]}
        viewBox={`0 0 ${ROUTE_PANEL_W} ${ROUTE_PANEL_H}`}
        style={{ height: `${ROUTE_PANEL_H}px` }}
        aria-hidden
      >
        {/* 主管 = 沿**推进轴(右上方向)**把一条通道上的地板串起来的小水管。
            每条通道 4 节: 起点 → 段1 → 段2 → 段3 → 段4, **到最后一块地板为止**。
            每一节两端各沿 u 缩 TILE_INSET, 圆头端帽因此正好塞进地板边缘 ——
            读作「管子插进地板」, 而不是「一根线穿过一个图标」。
            ⚠ 绘制顺序 = 通道 0 → 4, 即由远及近(通道轴朝右下 ⇒ 序号越大越靠近观者),
              后画的自然压在前面画的之上, 这就是等距场景的画家算法。 */}
        {Array.from({ length: board.laneCount }, (_, lane) => {
          // ⚠ **只认悬停**。这里曾经把「advancing 时的入通道」也算作通电, 结果推进那几秒画面上
          //   同时亮着两条电光: 小人真正走的那条折线, 与整条笔直的入通道主管 ——
          //   后者会被读成「他要一直走到底」, 直接和过桥的事实打架。推进期的路线只由走线负责。
          const live = hoverLane === lane;
          // 退到背景层的那几条: 玩家已经选定通道之后, 「不是我这条」的主线不该再和走线抢亮度。
          const dim = activeLane != null && lane !== activeLane;
          // 每一节的推进区间: 起点 → 段1 → … → 段4, 共 4 节, **两端都缩 TILE_INSET**
          // ⇒ 每一节的两个端帽都塞在地板边缘里。
          // ⚠ 这里曾经再补一节 [nodeU(3)+INSET, TRACK_LEN] 的「短桩」, 它尾端没有地板可插,
          //   画出来就是 5 根悬在空中的线头 —— 已删除。连线只连地板与地板。
          const runs: [number, number][] = [];
          for (let seg = 0; seg < SEG_COUNT; seg++) {
            runs.push([nodeU(seg - 1) + TILE_INSET, nodeU(seg) - TILE_INSET]);
          }
          return (
            <g
              key={lane}
              className={cx(s["rb-lane"], live && s["is-live"], dim && s["is-dim"])}
              style={{ "--i": lane } as CSSProperties}
            >
              {runs.map(([u0, u1], i) => (
                <Pipe key={i} a={pt(u0, lane)} b={pt(u1, lane)} j={i} spark={generating} />
              ))}
            </g>
          );
        })}

        {/* 桥管 = 横搭在相邻两条通道之间的水管, **与主管完全同款**(同一个 Pipe、同一套 class)。
            它靠三件事与主管区分, 一件都不能丢(见文件抬头): 朝向相反(右下 vs 右上)、
            身上没有地板、平时根本不在画面上。
            ⚠ 任何阶段都留在 DOM 里, 只靠 .is-hidden 改 opacity —— 卸载会让「记不住就没了」
            这条核心机制被 DevTools 绕过, 也会在回放时重新布局。 */}
        {/* is-revealing 只挂在**揭示期**: 那几秒桥接要闪烁高亮(禁闪烁约定的唯一例外, 见 CSS);
            披露页同样显形但**常亮不闪** —— 那是教学页, 不该再催人。 */}
        <g
          className={cx(
            s["rb-bridges"],
            !showBridges && s["is-hidden"],
            phase === "revealing" && s["is-revealing"],
          )}
        >
          {board.segments.flatMap((seg) =>
            seg.bridges.map((b) => {
              const u = bridgeU(seg.index, b.row, rows);
              // 端点 = 两条通道的**中线**(不再是平台边缘) ⇒ 与推进动画的折线严格重合。
              return (
                <g key={`${seg.index}-${b.row}-${b.leftLane}`} className={s["rb-bridge"]}>
                  <Pipe a={pt(u, b.leftLane)} b={pt(u, b.leftLane + 1)} />
                </g>
              );
            }),
          )}
        </g>

        {/* 已走过的路径(含披露页的整条线路) */}
        {donePoints.length > 1 && (
          <path
            className={cx(s["rb-trace-done"], disclosing && s["is-disclosed"])}
            d={pathOf(donePoints)}
          />
        )}

        {/* 离场行走的那条线: 跟着棋子**同速**逐段描出来(不是一次性亮完) ——
            玩家要看到的是「他自己走出了这条线」, 一次性描完就又变回了一张答案图。
            ⚠ 刻意用独立的 .rb-trace-walk 而不是复用 .rb-trace-line: 后者在 reduced-motion 下被
              一条 400ms !important 覆写掉, 复用会让线与人当场脱节。这里的时长由 walkMs 内联给出,
              reduced-motion 的压缩已经算在 walkMs 里了(见 LEAVE_REDUCED_MS)。 */}
        {leaving && walkPoints.length > 1 && (
          <path
            className={s["rb-trace-walk"]}
            d={walkPath}
            style={
              { "--len": walkLen, animationDuration: `${Math.round(walkMs)}ms` } as CSSProperties
            }
          />
        )}

        {/* 正在推进的这一段 + 信号点。key 带段号: 每段重挂一次, dash 与 SMIL 动画才会重播。 */}
        {advancing && legPoints.length > 1 && (
          <g key={`${board.round}-${currentSegment}`}>
            <path
              className={s["rb-trace-line"]}
              d={legPath}
              style={{ "--len": legLen, animationDuration: `${travelMs}ms` } as CSSProperties}
            />
            {/* 拖尾: 比亮头长得多、淡得多的一段 dash, 与亮头同速 ⇒ 信号后面拖出一条渐隐的尾巴,
                「有东西在跑」这件事因此有了长度感, 而不只是一个孤零零的白点。 */}
            <path
              className={s["rb-trace-comet"]}
              d={legPath}
              style={
                {
                  "--len": legLen,
                  strokeDasharray: `150 ${legLen}`,
                  animationDuration: `${travelMs}ms`,
                } as CSSProperties
              }
            />
            <path
              className={s["rb-trace-head"]}
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
                className={s["rb-ripple"]}
                cx={r.x}
                cy={r.y}
                r={4}
                style={{ animationDelay: `${Math.round(r.t)}ms` } as CSSProperties}
              />
            ))}
            <circle className={s["rb-signal"]} r={9}>
              <animateMotion dur={`${travelMs}ms`} path={legPath} fill="freeze" calcMode="linear" />
            </circle>
          </g>
        )}
      </svg>

      {/* ── 节点地板 + 站在上面的事件图标 ──
          20 个节点**全程可见**(§2.1)。地板上放不下文字, 所以按战棋的标准做法:
          地板上站一个事件图标, 悬停/聚焦时由 ExploreScreen 的侧栏展开完整文本(§11.1)。 */}
      <div className={cx(s["rb-nodes"], !nodesInteractive && s["is-inert"])}>
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
                className={cx(
                  s["rb-node"],
                  s[`k-${ev.kind}`],
                  isCurrent && s["is-current"],
                  settled && s["is-settled"],
                  abandoned && s["is-abandoned"],
                  ev.risk && s[`r-${ev.risk}`],
                )}
                style={
                  {
                    ...tileBox(x, y),
                    "--i": seg * 5 + lane,
                    "--seg": seg,
                    // 生成期地板落位的错开量按「段 + 通道」两维排, 波面才与连线的绘制波面同向
                    "--lane": lane,
                  } as CSSProperties
                }
                tabIndex={nodesInteractive ? 0 : -1}
                disabled={!nodesInteractive}
                onPointerEnter={() => onHoverNode({ seg, lane })}
                onPointerLeave={() => onHoverNode(null)}
                onFocus={() => onHoverNode({ seg, lane })}
                onBlur={() => onHoverNode(null)}
                // title={ev.title}
              >
                <Tile />
                {/* 脚下的落地投影 —— 「站在地板上」这件事的物理依据 */}
                <span className={s["rb-tile-shadow"]} aria-hidden />
                <span className={s["rb-node-icon"]}>
                  <StandingIcon kind={ev.kind} />
                </span>
              </button>
            );
          }),
        )}
      </div>

      {/* ── 玩家棋子层 ──
          ⚠ 单独一层而不是塞进 .rb-svg: 棋子必须压在地板层(.rb-nodes z:1 / .rb-entries z:2)之上,
            否则它站在某块地板上时会被那颗按钮的瓦片挡掉半个身子。z:3 在探针按钮(z:4)之下。
          ⚠ 整层套 TILE_NUDGE 的位移: 地板是被 tileBox() 朝左上微调过的(见那里的注释),
            棋子不跟着挪就会站在地板外沿。静止与推进用的是同一套偏移 ⇒ 两态交接处不会跳。
          ⚠ 推进态分两拍: 先由信号点把整条折线跑完(travelMs), 小人才起步, 再以 1/3 的速度
            走完同一条线(travelMs × PAWN_SPEED_DIV)。onArrive 的计时器按 pawnDoneMs 排,
            结算浮层因此一定在人站定之后才弹。
          ⚠ 棋子的位置变化**一律是连续的**: 推进走 animateMotion(滞后靠 keyPoints 而不是 begin,
            见下面的注释), 静止态之间走 CSS transform 过渡 —— 任何一处瞬移都会让「他是怎么走过来的」
            这条唯一的路径信息断掉。 */}
      {entryLane != null && (
        <svg
          className={s["rb-pawn-layer"]}
          viewBox={`0 0 ${ROUTE_PANEL_W} ${ROUTE_PANEL_H}`}
          style={{
            height: `${ROUTE_PANEL_H}px`,
            transform: `translate(${TILE_NUDGE_X}px, ${TILE_NUDGE_Y}px)`,
          }}
          aria-hidden
        >
          {pawnMoving ? (
            // key 带段号与「是哪一种行走」: 每段/每次离场重挂一次, animateMotion 才会重播
            <g
              key={`${board.round}-${currentSegment}-${advancing ? "adv" : "leave"}`}
              className={cx(s["rb-pawn"], s["is-walking"])}
              style={{ "--pawn-hold": `${advancing ? Math.round(travelMs) : 0}ms` } as CSSProperties}
            >
              <Pawn />
              {/* ⚠ 等信号点跑完再起步这件事**只能用 keyPoints 做, 不能用 begin 延迟**:
                  animateMotion 未开始时元素停在自己的原点(= 面板左上角), 那一段时间里小人会先
                  出现在画面角上再瞬移到路径起点。改成「总时长 = 等待 + 行程」, 前 travelMs 把
                  进度按在 0(人就站在本段起点那块地板上不动), 之后线性走完 —— 没有任何一帧是跳的。
                  ⚠ begin="indefinite" + 上面 effect 里的 beginElement(): 见那里的注释, 这是
                    「第二段之后全变瞬移」的解法, 不要改回 begin="0s"。
                  ★ 离场行走没有信号点先跑, 所以那一支是干净的 0→1, 不需要等待段。 */}
              <animateMotion
                ref={pawnMotionRef}
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
                className={s["rb-pawn"]}
                style={{ transform: `translate(${pawnAt.x}px, ${pawnAt.y}px)` }}
              >
                <Pawn />
              </g>
            )
          )}
        </svg>
      )}

      {/* ── 「探索路线」: 遮蔽态**贴在面板底边居中**的那一条横条 ──
          它是本轮唯一进入 revealing 的入口, 按下即消失、**这一轮再也回不来**(见 session.startReveal)。
          故意做得像个探针触发器而不是普通按钮 —— 玩家要意识到这一下是不可撤销的。
          ⚠ 它曾经摆在面板正中(ROUTE_PANEL_H / 2), 正好压在棋盘斜带的腰上, 把中间几段节点挡掉 ——
            而 sealed 恰恰是玩家**唯一**能从容悬停查看 20 个节点的阶段(nodesInteractive 在这一相为真),
            挡住等于把这一相废掉。故改为贴底边: 棋盘是左下 → 右上的斜带, 面板底边中段是天然空白。
          ⚠ PROBE_BOTTOM_INSET 这个数不能随手调大: 最低的一块**节点**地板(段 1 · 通道 E)的底沿
            约在 y = 585, 面板高约 702 —— 横条(约 62px 高)顶边必须留在 590 以下才一个节点都不压。
            往上挪就会重新开始遮挡。压住通道 E 起点地板的下沿是可以的: sealed 阶段起点按钮本就
            disabled、地板本身不带任何信息, 站在上面的字母又在地板**上方**, 不会被盖到。 */}
      {sealed && (
        // ⚠ 居中定位挂在这层 anchor 上, **不能**挂在 button 自己身上:
        //   全站的 base.css 有 `button:active:not(:disabled){transform:translateY(1px)}`,
        //   特异性比单个类名高 —— 按下的瞬间它会把 translate(-50%,-50%) 整条顶掉,
        //   按钮当场朝右下跳半个自身宽高, 从光标底下跑走, click 根本不触发。
        //   拆成两层后按钮本体不持有 transform, 那条按下反馈就只是它本来的意思。
        //   探针环同样挪到 anchor 上: button 有 clip-path(全站斜切角), 留在里面会被裁掉。
        <div
          className={s["rb-probe-anchor"]}
          style={{
            left: `${ROUTE_PANEL_W / 2}px`,
            top: `${ROUTE_PANEL_H - PROBE_BOTTOM_INSET}px`,
          }}
        >
          <span className={s["rb-probe-ring"]} aria-hidden />
          <button
            type="button"
            className={s["rb-probe"]}
            onClick={onStartReveal}
            // title="向签路注入探针, 全图桥接会短暂显形 —— 本轮仅此一次"
          >
            <span className={s["rb-probe-label"]}>探索路线</span>
            <span className={s["rb-probe-sep"]} aria-hidden />
            <span className={s["rb-probe-note"]}>全图桥接仅显形一次</span>
          </button>
        </div>
      )}
    </div>
  );
}
