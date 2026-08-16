// ★ 区域路线图(等距薄片地砖) —— qwen 版视觉方案 ★
//
// 与 explore/RouteBoard 同一套**投影与数据结构**(2:1 等距, 推进轴朝右上 / 通道轴朝右下,
// 5 通道 × 4 推进段), 区别全在**格子的做法**上:
//
//   ⛔ 这一版**没有任何立体图标**, 也没有台座造型: 地面上的东西一律是平的,
//     需要立起来的信息(事件图标)走「从砖中心往上投影出一块直立面板」这条路子。
//   ★ 每块格子 = 把 src/ui/common/EventPanel 里那块「插画占位区」(.scenePlaceholder)
//     **整个平放到地上**变成一块地砖: 一个方形 DOM 盒子 + 一条等距 matrix 压平 ⇒
//     占位区的美工(底色渐变 / 切角内边框 / 透视网格 / 中心光球)原封不动地躺在地面上,
//     薄片 + 落地投影负责把它「贴」在地上。
//   ⛔ 砖面上**不放任何文字**(占位区那套编目角标与中心大字符全部取消):
//     事件类型只由事件色表达, 要读的字全部收进悬停详情卡。
//
//   为什么用 DOM+CSS 而不是 SVG 重画: 占位区的质感几乎全是多层 background 渐变、
//   clip-path 切角与 mix-blend-mode 斜向高光, 用 SVG 复刻会丢掉大半。
//   等距投影是线性变换 ⇒ 一条 matrix 就是精确的「平放」, 见 qwenIso.ts。
//
// ⛔ 沿用原版的禁闪烁约定: 常驻动效只有匀速位移/呼吸缩放, 明暗一律走 transition 或一次性播完。
// ⚠ 本文件坐标全是「设计 px」, 与 stage.ts 的 1920×1080 同尺度。

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { traceSegment } from "@/explore/route";
import type { NodeEvent, RouteBoard as RouteBoardData, RouteSegment } from "@/explore/types";
import { cx } from "@/ui/common/cx";
// 面板底图: 16:9 场景占位素材。⚠ 走 import 而不是在 CSS 里写路径, 打包后才有指纹化的地址。
import boardBg from "@/assets/占位场景素材.png";
import { QwenEventIcon } from "./QwenEventIcon";
// ⚠ 投影常量与 matrix 一律从 qwenIso 取: 棋盘、连线、地砖必须共享同一套斜率。
import { ADV_X, ADV_Y, LANE_X, LANE_Y, TILE_MATRIX, tileBounds } from "./qwenIso";
import s from "./QwenRouteBoard.module.css";

// ===================== 版式(设计 px) =====================

// 砖面在**世界坐标**里的边长。两条世界轴都是单位向量, 所以这个数同时就是砖在
// 两个轴向上的屏幕跨度 ⇒ 与 LANE_GAP / SEG_PITCH 直接可比: 差值就是砖缝。
// ⚠ 砖比 opus 版大得多(54 → 104): 砖面上要读得出占位区的边框/网格/小字, 小砖会糊成一片。
const TILE = 104;
const TILE_HALF = TILE / 2;
// 薄片厚度(屏幕垂直方向)。⚠ 只有 7px: 再厚就从「地砖」变回「积木」, 整套概念就塌了。
const TILE_DEPTH = 7;

const LANE_GAP = 132; // 相邻通道中心距 ⇒ 砖缝 28
const SEG_PITCH = 205; // 相邻两块地砖的推进距离 ⇒ 砖缝 101, 中间走连线
const ENTRY_RUN = SEG_PITCH; // 起点 → 段 1 用同一个数, 四段节奏才匀
const ENTRY_U = -100;
const TILE_INSET = 46; // 连线两端缩进量 ⇒ 端帽塞进砖的边缘之下

const { w: TILE_W, h: TILE_H } = tileBounds(TILE); // ≈ 186 × 93

// 直立投影面板从砖面中心往上占掉的净空(光锥 + 面板, 见 CSS 的 --proj-h)。
// ⚠ 改 CSS 里的面板高度必须同步改这里, 否则最远那一排的面板会被上边界切掉。
const PROJ_H = 96;

const LANE_COUNT = 5;
const SEG_COUNT = 4;
const ENTRY_LABELS = ["A", "B", "C", "D", "E"];

// 推进动画节奏: 信号点先跑完整段(travelMs), 棋子再以 1/2.6 的速度走同一条线。
const SIGNAL_SPEED = 0.42;
const SIGNAL_MIN_MS = 820;
const SIGNAL_MAX_MS = 2000;
const PAWN_SPEED_DIV = 2.6;
const SEG_TAIL_MS = 280;

export const QWEN_GENERATE_MS = 2100;

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
// ⚠ 上边界取的是**最远那块砖的投影面板顶端**(u 最大 / s 最小 = 屏幕最高的那块砖),
//   不是砖本身的上沿: 面板立在砖中心上方, 少算这一截就会被面板容器裁掉。
const Y_LO = Math.min(rawY(U_MAX, S_MIN), rawY(TRACK_LEN, 0) - PROJ_H);
const Y_HI = rawY(U_MIN, S_TOP) + TILE_DEPTH;
const ORIGIN_X = PAD - X_LO;
const ORIGIN_Y = PAD - Y_LO;

export const QWEN_PANEL_W = Math.round(X_HI - X_LO + PAD * 2);
export const QWEN_PANEL_H = Math.round(Y_HI - Y_LO + PAD * 2);

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

// ===================== 地砖 + 直立投影 =====================
// DOM 由下往上五层:
//   ① 落地影   —— 2:1 的模糊椭圆, **不参与 matrix**(它本来就是地面上的一摊影子);
//   ② 薄片侧壁 —— 与砖面同形的一片半透明玻璃断面, 在**屏幕空间**下移 TILE_DEPTH ⇒ 下缘露一线厚度;
//   ③ 砖面     —— 一块干净的磨砂玻璃地砖(跟着 matrix 躺倒), 内部只留投影源那圈光斑;
//   ④ 光锥     —— 从砖面中心往上发散、越高越淡的一束光;
//   ⑤ 投影面板 —— **正对观者直立**的一块半透明面板, 事件图标画在它上面。
//
// ★ 为什么面板正对观者而不是沿某条世界轴立起来: 它是「投影出来的画面」, 不是场景里的实体牌子;
//   投影面朝人是全息投影的常识, 也让图标保持正读 —— 沿世界轴斜切会让每个图标都歪着, 25 块砖
//   一起歪就没法看了。
// ⚠ 面板与光锥都**不参与 matrix**, 只有 ①②③ 躺在地上。这条边界一旦破了, 立面与地面就混成一团。
// ⛔ 砖面上**不放任何文字, 也不再画卡面**: 地砖只剩玻璃底 + 收边 + 投影源光斑(+ 风险警示带),
//   所有内容都上到投影面板上去。要读的详情仍然只在悬停详情卡里。
//   ⚠ 因此砖按钮自己没有可访问名称, 调用方必须给 aria-label。
function TileArt({ icon, risk }: { icon: ReactNode; risk?: boolean }) {
  return (
    <>
      <span className={s.tileShadow} aria-hidden />
      <span className={s.tileSlab} aria-hidden />
      <span className={s.tileFace} aria-hidden>
        {/* 投影源: 砖面上的一圈光斑。放在砖面**内部** ⇒ 跟着 matrix 压成 2:1 椭圆, 天然躺在地上。 */}
        <span className={s.projSource} />
        {risk && <span className={s.faceRisk} />}
      </span>
      {/* ⚠ 光锥与面板必须留在砖面**外面**: 砖面 overflow:hidden 且被 matrix 压平,
          放进去会被裁掉一半, 剩下的一半还会跟着躺倒。 */}
      <span className={s.projBeam} aria-hidden />
      <span className={s.projPanel} aria-hidden>
        <span className={s.projScan} />
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

// ===================== 玩家棋子 =====================
// ⛔ 不做立体小人(那是 opus 版的语言, 与「全平」的基调冲突)。
// 这一版的棋子是一枚**贴地的等距光环 + 实心核心**: 同样躺在地面上, 靠亮度与动效区分。
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

// ===================== 悬浮详情卡 =====================
// ⚠ 不用原生 title 属性(项目约定): 悬停详情一律由组件渲染。
// ⚠ 卡片挂在**投影面板顶端之上**(PROJ_H), 不是砖的上沿 —— 挂在砖上会把面板整个盖住。
function NodeCard({ ev, x, y, seg }: { ev: NodeEvent; x: number; y: number; seg: number }) {
  const sign = ev.energyDelta > 0 ? "+" : "";
  return (
    <div
      className={cx(s.card, s[`k-${ev.kind}`])}
      style={{ left: `${x}px`, top: `${y - PROJ_H - 10}px` }}
      role="status"
    >
      <span className={s.cardSeg}>第 {seg + 1} 推进段</span>
      <strong className={s.cardTitle}>{ev.title}</strong>
      <p className={s.cardDesc}>{ev.description}</p>
      <span className={s.cardEnergy}>
        净化粒子 {sign}
        {ev.energyDelta}
      </span>
      {ev.risk && <span className={s.cardRisk}>{ev.risk === "highRisk" ? "高风险" : "纯负面"}</span>}
    </div>
  );
}

interface Props {
  board: RouteBoardData;
  /** 桥接是否显形。预览页由控制条驱动; 产线上对应 revealing / disclosure 两相。 */
  showBridges: boolean;
  /** 生成演出(逐块浮现)是否正在播 —— 播放期间锁交互。 */
  generating: boolean;
}

export function QwenRouteBoard({ board, showBridges, generating }: Props) {
  const rows = board.rowsPerSegment;
  const [hoverLane, setHoverLane] = useState<number | null>(null);
  const [hoverNode, setHoverNode] = useState<{ seg: number; lane: number } | null>(null);
  const [entryLane, setEntryLane] = useState<number | null>(null);
  // 已抵达的推进段数(0-4)。walking = 正在播第 `progress` 段的推进。
  const [progress, setProgress] = useState(0);
  const [walking, setWalking] = useState(false);

  // 换一张图 ⇒ 推进状态全清(组件在预览页是靠 key 重挂的, 这条是兜底)。
  useEffect(() => {
    setEntryLane(null);
    setProgress(0);
    setWalking(false);
    setHoverNode(null);
  }, [board]);

  // 每段的入通道序列: lanes[i] = 走第 i 段时所在的入通道; lanes[4] = 终点通道。
  const lanes = useMemo(() => {
    if (entryLane == null) return [];
    const out = [entryLane];
    let lane = entryLane;
    for (let i = 0; i < SEG_COUNT; i++) {
      lane = traceSegment(board.segments[i], lane, rows).laneOut;
      out.push(lane);
    }
    return out;
  }, [board, entryLane, rows]);

  // 正在推进的这一段
  const legPoints = useMemo<[number, number][]>(() => {
    if (!walking || entryLane == null || progress >= SEG_COUNT) return [];
    return segmentPoints(board.segments[progress], lanes[progress], rows, progress);
  }, [walking, board, entryLane, lanes, progress, rows]);

  // 已经走完的那些段
  const donePoints = useMemo<[number, number][]>(() => {
    if (entryLane == null || progress === 0) return [];
    const out: [number, number][] = [];
    for (let i = 0; i < progress; i++) {
      const pts = segmentPoints(board.segments[i], lanes[i], rows, i);
      out.push(...(i === 0 ? pts : pts.slice(1)));
    }
    return out;
  }, [board, entryLane, lanes, progress, rows]);

  const legPath = useMemo(() => pathOf(legPoints), [legPoints]);
  const legLen = useMemo(() => lengthOf(legPoints), [legPoints]);
  const travelMs = Math.min(SIGNAL_MAX_MS, Math.max(SIGNAL_MIN_MS, legLen / SIGNAL_SPEED));
  const pawnDoneMs = travelMs + travelMs * PAWN_SPEED_DIV;

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

  // 一段播完 → 落位, 若还有剩余段则接着播下一段。
  useEffect(() => {
    if (!walking || legPoints.length < 2) return;
    const id = window.setTimeout(() => {
      const next = progress + 1;
      setProgress(next);
      if (next >= SEG_COUNT) setWalking(false);
    }, pawnDoneMs + SEG_TAIL_MS);
    return () => window.clearTimeout(id);
  }, [walking, progress, legPath, legPoints.length, pawnDoneMs]);

  // ⚠ animateMotion 必须显式 beginElement(begin="indefinite"):
  //   begin="0s" 是相对 SVG 时间容器启动算的, 第二段之后会直接跳到终态(棋子凭空瞬移)。
  const motionRef = useRef<SVGElement | null>(null);
  useEffect(() => {
    if (!walking || legPoints.length < 2) return;
    (motionRef.current as SVGAnimationElement | null)?.beginElement();
  }, [walking, legPath, legPoints.length]);

  // 棋子静止站位: 没落过地就停在起点砖上, 否则停在最近一次的落点砖上。
  const pawnAt = useMemo(() => {
    if (entryLane == null) return null;
    if (progress === 0) return nodeCenter(-1, entryLane);
    return nodeCenter(progress - 1, lanes[progress]);
  }, [entryLane, lanes, progress]);

  // ★ 画家算法: 屏幕上越靠下的砖越「近」, 必须后画。
  //   屏幕 y ∝ (s − u), 所以深度键就是 laneS(lane) − nodeU(seg), 升序 = 由远及近。
  //   ⚠ 砖虽然是薄片, 但落地影与悬停时抬起的那几 px 仍会互相压 —— 少了这一步, 远处那块的
  //     影子会盖在近处那块的砖面上。
  const sortedNodes = useMemo(() => {
    const out = board.nodes.flatMap((row, seg) => row.map((ev, lane) => ({ ev, seg, lane })));
    return out.sort((a, b) => laneS(a.lane) - nodeU(a.seg) - (laneS(b.lane) - nodeU(b.seg)));
  }, [board]);

  const activeLane = entryLane == null ? null : lanes[Math.min(progress, SEG_COUNT)];
  const interactive = !generating && !walking;
  const hoverEv = hoverNode ? board.nodes[hoverNode.seg][hoverNode.lane] : null;
  const hoverPos = hoverNode ? nodeCenter(hoverNode.seg, hoverNode.lane) : null;

  // 砖的几何全部通过 CSS 变量下发 ⇒ 尺寸只在本文件里定义一次, CSS 不重复写死任何一个数。
  const rootStyle = {
    width: `${QWEN_PANEL_W}px`,
    height: `${QWEN_PANEL_H}px`,
    "--board-bg": `url(${boardBg})`,
    "--tile-matrix": TILE_MATRIX,
    "--tile-size": `${TILE}px`,
    "--tile-w": `${TILE_W.toFixed(1)}px`,
    "--tile-h": `${TILE_H.toFixed(1)}px`,
    "--tile-depth": `${TILE_DEPTH}px`,
  } as CSSProperties;

  return (
    <div className={cx(s.root, generating && s.isGenerating)} style={rootStyle}>
      {/* 地面: 16:9 场景占位图 + 中性暗色遮罩 + 等距网格, 让棋盘有「站在一块场地上」的底 */}
      <div className={s.ground} aria-hidden />

      {/* ── 场地: 主线 / 桥线 / 电流 ── */}
      <svg
        className={s.svg}
        viewBox={`0 0 ${QWEN_PANEL_W} ${QWEN_PANEL_H}`}
        style={{ height: `${QWEN_PANEL_H}px` }}
        aria-hidden
      >
        {/* 主线: 由远及近(通道 0 → 4)绘制 = 等距场景的画家算法 */}
        {Array.from({ length: board.laneCount }, (_, lane) => {
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
            ⚠ 任何阶段都留在 DOM 里, 只改 opacity —— 卸载会让「记不住就没了」被 DevTools 绕过。 */}
        <g className={cx(s.bridges, !showBridges && s.isHidden)}>
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

        {donePoints.length > 1 && <path className={s.traceDone} d={pathOf(donePoints)} />}

        {walking && legPoints.length > 1 && (
          <g key={`${board.round}-${progress}`}>
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
            <circle className={s.signal} r={9}>
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
          const usable = interactive && entryLane == null && !blocked;
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
                setEntryLane(lane);
                setHoverLane(null);
                setWalking(true);
              }}
            >
              {/* 入口的投影面板上直接立着通道号 —— 面板是正读的, 字母不会像躺在地上时那样难认 */}
              <TileArt icon={<span className={s.entryMark}>{ENTRY_LABELS[lane] ?? lane + 1}</span>} />
            </button>
          );
        })}
      </div>

      {/* ── 20 个事件节点 ──
          ⚠ **必须按等距深度排序渲染**(见 sortedNodes)。 */}
      <div className={cx(s.nodes, !interactive && s.isInert)}>
        {sortedNodes.map(({ ev, seg, lane }) => {
          const { x, y } = nodeCenter(seg, lane);
          const landed = entryLane != null && lanes[seg + 1] === lane && seg < progress;
          const isCurrent = landed && seg === progress - 1;
          const settled = landed && seg < progress - 1;
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
                hovered && s.isHovered,
                ev.risk && s[`r-${ev.risk}`],
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
              tabIndex={interactive ? 0 : -1}
              disabled={!interactive}
              onPointerEnter={() => setHoverNode({ seg, lane })}
              onPointerLeave={() => setHoverNode(null)}
              onFocus={() => setHoverNode({ seg, lane })}
              onBlur={() => setHoverNode(null)}
            >
              <TileArt icon={<QwenEventIcon kind={ev.kind} />} risk={Boolean(ev.risk)} />
            </button>
          );
        })}
      </div>

      {/* ── 玩家棋子(单独一层, 压在砖层之上) ── */}
      {entryLane != null && (
        <svg
          className={s.pawnLayer}
          viewBox={`0 0 ${QWEN_PANEL_W} ${QWEN_PANEL_H}`}
          style={{ height: `${QWEN_PANEL_H}px` }}
          aria-hidden
        >
          {walking && legPoints.length > 1 ? (
            <g key={`${board.round}-${progress}-walk`} className={cx(s.pawn, s.isWalking)}>
              <Pawn />
              {/* 等信号点跑完再起步只能用 keyPoints 做, 不能用 begin 延迟 ——
                  未开始的 animateMotion 会把元素按在自己的原点(面板左上角)上。 */}
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

      {hoverNode && hoverEv && hoverPos && (
        <NodeCard ev={hoverEv} x={hoverPos.x} y={hoverPos.y} seg={hoverNode.seg} />
      )}
    </div>
  );
}
