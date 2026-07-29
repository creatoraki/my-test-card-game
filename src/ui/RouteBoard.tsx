// ★ 失真路由图(阿弥陀签) ★ —— 探索页的主体交互, 见 探索模式设计.md §2。
//
// 一段的四个阶段各对应一种画面, 全部落在同一张 SVG 上:
//   revealing —— 横线全显 + 顶部一条倒计时进度条; 玩家在这几秒内**用眼睛记**。
//   choosing  —— 横线整体淡出到 opacity:0(⚠ 只改 opacity, **不卸载**: DOM 里留着才不会被
//                「查看元素」看穿, 也免得回放时重新布局); 入口 A-E 变成可点按钮。
//   routing   —— 信号沿 traceRoute() 求出的折线下行, 走过的线段实时点亮, 拐点留下扩散环。
//   landed / resolving —— 落点终点卡被「撞」一下并高亮, 其余四张压暗;
//                浮层(先选分支、再看结算)由 ExploreScreen 负责, 不在这一层。
//
// ★ 本文件所有坐标都是「设计 px」, 与 stage.ts 的 1920×1080 画布同一套尺度 ——
//   面板由 ExploreScreen 定位, 这里只管面板内部的构图。改版式直接改下面的常量。

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { traceRoute } from "../explore/route";
import type { ExplorePhase, RouteBoard as RouteBoardData, RouteEventKind } from "../explore/types";
import "./RouteBoard.css";

// ===================== 版式旋钮(设计 px) =====================
const LANE_X0 = 120; // 第一条竖线的横坐标
const LANE_GAP = 220; // 竖线间距 ⇒ 面板宽 = LANE_X0 * 2 + LANE_GAP * (laneCount - 1)
// 竖线顶端 = 灯箱下沿。入口那块「悬挂灯箱」整个挂在 0..TOP_Y 这一段里
// (吊索 ENTRY_ROPE + 箱体 ENTRY_H), 箱体底边正好插在竖线顶端上。
const ENTRY_ROPE = 22;
const ENTRY_W = 132;
const ENTRY_H = 108;
const TOP_Y = ENTRY_ROPE + ENTRY_H;
const BOTTOM_Y = 470; // 竖线底端(终点卡上沿)
const NODE_W = 200; // 终点事件卡宽
const NODE_TOP = 490; // 终点事件卡上沿
const NODE_H = 172;

const ENTRY_LABELS = ["A", "B", "C", "D", "E"];

// 信号点的行进速度(设计 px / ms)与时长夹逼。
// 太快看不清横移、太慢每段都在等 —— 0.75 px/ms 下一条典型路径约 1.1 秒。
const SIGNAL_SPEED = 0.75;
const SIGNAL_MIN_MS = 800;
const SIGNAL_MAX_MS = 2400;
const SIGNAL_TAIL_MS = 220; // 抵达终点后多停一拍再结算, 免得画面一到就跳

export const ROUTE_PANEL_H = NODE_TOP + NODE_H + 24;
export function routePanelWidth(laneCount: number): number {
  return LANE_X0 * 2 + LANE_GAP * (laneCount - 1);
}

function laneX(lane: number): number {
  return LANE_X0 + lane * LANE_GAP;
}
// 面板坐标系里某条线的中心横坐标 + 终点卡的上沿。
// ★ 导出给 ExploreScreen 画「落点 → 结算浮层」的光柱用 —— 版式常量只在本文件有一份。
export const laneCenterX = laneX;
export const NODE_TOP_Y = NODE_TOP;
// 横线所在的行的纵坐标。行均分竖线全长, 首尾各留一格 —— 免得横线贴在入口/终点上。
function rowY(row: number, rowCount: number): number {
  return TOP_Y + ((row + 1) * (BOTTOM_Y - TOP_Y)) / (rowCount + 1);
}

// ===================== 终点事件图标 =====================
// 画法与据点/控制终端统一: 48×48 视框、stroke="currentColor"、主体 strokeWidth 1.6、
// 陪衬 1.2 + 低透明度。⚠ 刻意不用 emoji —— 全项目场景内图标一律线框 SVG。
const ICONS: Record<RouteEventKind, ReactNode> = {
  // 战斗: 交叉的两把工业撬棍
  battle: (
    <>
      <path d="M12 38L36 12" strokeWidth={1.6} />
      <path d="M12 12l24 26" strokeWidth={1.6} />
      <circle cx="24" cy="25" r="3.4" strokeWidth={1.2} opacity={0.5} />
    </>
  ),
  // 精英: 撬棍之上加一道尖角冠
  elite: (
    <>
      <path d="M12 40L36 14" strokeWidth={1.6} />
      <path d="M12 14l24 26" strokeWidth={1.6} />
      <path d="M14 10l5 6 5-8 5 8 5-6" strokeWidth={1.4} strokeLinejoin="round" />
    </>
  ),
  // BOSS: 主机塔 + 顶部信号弧, 读作「总控在看着你」
  boss: (
    <>
      <path d="M14 20h20v22H14z" strokeWidth={1.6} strokeLinejoin="round" />
      <path d="M20 28h8M20 34h8" strokeWidth={1.2} opacity={0.6} />
      <circle cx="24" cy="12" r="3" strokeWidth={1.6} />
      <path d="M15 14a11 11 0 0 1 18 0" strokeWidth={1.2} opacity={0.55} />
    </>
  ),
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

interface Props {
  board: RouteBoardData;
  phase: ExplorePhase;
  entryLane: number | null;
  exitLane: number | null;
  /** 只在 choosing 阶段可用; 由 ExploreScreen 转给 store 的 pickEntry。 */
  onPickEntry: (lane: number) => void;
  /** 走线动画播完。ExploreScreen 据此调 runStore.enterEncounter()(内部走 routeDone)。 */
  onRouteDone: () => void;
}

export function RouteBoard({ board, phase, entryLane, exitLane, onPickEntry, onRouteDone }: Props) {
  const width = routePanelWidth(board.laneCount);
  // 悬停/聚焦中的入口 —— 只用来把**那一条竖线**点亮。
  // ⚠ 绝不据此提示终点: 竖线本身不泄露信息(它是常显的), 但一旦预告落点, 整套记忆玩法就没了。
  const [hoverLane, setHoverLane] = useState<number | null>(null);

  // 折线的拐点序列。traceRoute 只给「入口 / 每次横移 / 终点」三类关键节点,
  // 一次横移要拆成「先落到该行」「再横过去」两个点, 折线才画得出直角。
  const points = useMemo<[number, number][]>(() => {
    if (entryLane == null) return [];
    const steps = traceRoute(board, entryLane);
    const pts: [number, number][] = [[laneX(entryLane), TOP_Y]];
    for (const st of steps) {
      if (st.movedFrom == null) continue;
      const y = rowY(st.row, board.rowCount);
      pts.push([laneX(st.movedFrom), y], [laneX(st.lane), y]);
    }
    pts.push([laneX(steps[steps.length - 1].lane), BOTTOM_Y]);
    return pts;
  }, [board, entryLane]);

  const pathD = useMemo(
    () => points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" "),
    [points],
  );
  // 折线长度自己算(全是水平/垂直段, 精确): 既当 dasharray 用, 也用来定走线时长。
  const pathLen = useMemo(() => {
    let len = 0;
    for (let i = 1; i < points.length; i++) {
      len += Math.abs(points[i][0] - points[i - 1][0]) + Math.abs(points[i][1] - points[i - 1][1]);
    }
    return len;
  }, [points]);

  const travelMs = Math.min(SIGNAL_MAX_MS, Math.max(SIGNAL_MIN_MS, pathLen / SIGNAL_SPEED));

  // 每次「横移完成」的时刻与坐标 —— 走线经过拐点时在那里留一圈扩散环。
  // 时间按**路径长度占比**折算(而不是 SIGNAL_SPEED): travelMs 被上下夹逼过, 只有占比才与动画同步。
  const ripples = useMemo(() => {
    const out: { x: number; y: number; t: number }[] = [];
    if (points.length < 2 || pathLen <= 0) return out;
    let cum = 0;
    for (let i = 1; i < points.length; i++) {
      const [px, py] = points[i - 1];
      const [x, y] = points[i];
      cum += Math.abs(x - px) + Math.abs(y - py);
      // 水平段的终点 = 一次换线完成; 最后一个点 = 抵达终点卡
      if (py === y || i === points.length - 1) out.push({ x, y, t: (cum / pathLen) * travelMs });
    }
    return out;
  }, [points, pathLen, travelMs]);

  // 走线播完 → 通知上层结算。⚠ 计时器挂 effect 里(而非裸 setTimeout): 战斗/离页导致卸载时
  // 清理函数顺手撤掉, 不会有卸载后回调。
  useEffect(() => {
    if (phase !== "routing") return;
    const id = window.setTimeout(onRouteDone, travelMs + SIGNAL_TAIL_MS);
    return () => window.clearTimeout(id);
  }, [phase, travelMs, onRouteDone, board.segment]);

  const showBars = phase === "revealing";
  const routed =
    phase === "routing" || phase === "landed" || phase === "resolving" || phase === "inBattle";
  // 落点已定、还没结算完的两个阶段: 其余四张卡压暗, 注意力交给浮层。
  const settling = phase === "landed" || phase === "resolving" || phase === "inBattle";
  // 展示线路的那几秒里终点卡不接受指针 —— 玩家此刻必须盯着横线, 不该被悬停详情分走注意力。
  const nodesInteractive = phase !== "revealing" && phase !== "routing";

  return (
    <div className="route-board" style={{ width: `${width}px`, height: `${ROUTE_PANEL_H}px` }}>
      {/* ── 顶部倒计时: 只在展示阶段出现, 宽度由 CSS 动画从 100% 收到 0 ── */}
      <div className="rb-timer" aria-hidden>
        {phase === "revealing" && (
          // key 带段号: 换段时强制重挂, 关键帧才会从头播
          <span
            key={board.segment}
            className="rb-timer-fill"
            style={{ animationDuration: `${board.revealDurationMs}ms` }}
          />
        )}
      </div>

      {/* ── 入口 A-E: 从面板顶沿吊下来的灯箱招牌 ──
          常态各自缓慢摆动(相位靠 --i 错开), 悬停时停摆下压、灯管点亮、所属竖线整条转亮。
          ⚠ 所有反馈都是位移/描边色的连续过渡, **没有任何明暗闪烁**(见 RouteBoard.css 抬头的约定)。 */}
      <div className="rb-entries" style={{ height: `${TOP_Y}px` }}>
        {Array.from({ length: board.laneCount }, (_, lane) => {
          const blocked = board.blockedLanes.includes(lane);
          const active = entryLane === lane;
          const usable = phase === "choosing" && !blocked;
          return (
            <button
              key={lane}
              type="button"
              className={`rb-entry${active ? " is-active" : ""}${blocked ? " is-blocked" : ""}`}
              style={
                {
                  left: `${laneX(lane) - ENTRY_W / 2}px`,
                  width: `${ENTRY_W}px`,
                  "--i": lane,
                  "--rope": `${ENTRY_ROPE}px`,
                  "--box-h": `${ENTRY_H}px`,
                } as CSSProperties
              }
              disabled={!usable}
              onPointerEnter={() => usable && setHoverLane(lane)}
              onPointerLeave={() => setHoverLane((l) => (l === lane ? null : l))}
              onFocus={() => usable && setHoverLane(lane)}
              onBlur={() => setHoverLane((l) => (l === lane ? null : l))}
              onClick={() => onPickEntry(lane)}
              title={blocked ? "该入口已被隔断封锁" : `从 ${ENTRY_LABELS[lane]} 口进入`}
            >
              <span className="rb-entry-rope" aria-hidden />
              <span className="rb-entry-box">
                <span className="rb-entry-no">{String(lane + 1).padStart(2, "0")}</span>
                <span className="rb-entry-letter">{ENTRY_LABELS[lane] ?? lane + 1}</span>
                <span className="rb-entry-tube" aria-hidden />
              </span>
            </button>
          );
        })}
      </div>

      {/* ── 阿弥陀签本体 ── */}
      <svg
        className="rb-svg"
        viewBox={`0 0 ${width} ${BOTTOM_Y + 20}`}
        style={{ height: `${BOTTOM_Y + 20}px` }}
        aria-hidden
      >
        {/* 竖线: 全程可见, 它不泄露任何信息。悬停某个入口时对应的那条整条点亮(通电预览)。 */}
        {Array.from({ length: board.laneCount }, (_, lane) => (
          <line
            key={lane}
            className={`rb-lane${hoverLane === lane ? " is-live" : ""}`}
            x1={laneX(lane)}
            y1={TOP_Y}
            x2={laneX(lane)}
            y2={BOTTOM_Y}
          />
        ))}

        {/* 横线: ⚠ 任何阶段都留在 DOM 里, 只靠 .is-hidden 改 opacity —— 卸载会让「记不住就没了」
            这条核心机制被 DevTools 绕过, 也会在回放时重新布局。 */}
        <g className={`rb-bars${showBars ? "" : " is-hidden"}`}>
          {board.crossbars.map((c) => (
            <line
              key={`${c.row}-${c.leftLane}`}
              className="rb-bar"
              x1={laneX(c.leftLane)}
              y1={rowY(c.row, board.rowCount)}
              x2={laneX(c.leftLane + 1)}
              y2={rowY(c.row, board.rowCount)}
            />
          ))}
        </g>

        {/* 已走过的路径 + 信号点。key 带入口: 重选/换段时重挂, SMIL 与 dash 动画才会重播。 */}
        {routed && points.length > 1 && (
          <g key={`${board.segment}-${entryLane}`} className="rb-trace">
            <path
              className="rb-trace-line"
              d={pathD}
              style={
                {
                  "--len": pathLen,
                  animationDuration: `${travelMs}ms`,
                  // resolving 时动画已结束, fill-mode: forwards 让它保持全亮
                } as CSSProperties
              }
            />
            {/* 亮头: 与主线同步推进的一小段更白的 dash, 读作「信号的头部」 */}
            <path
              className="rb-trace-head"
              d={pathD}
              style={
                {
                  "--len": pathLen,
                  strokeDasharray: `64 ${pathLen}`,
                  animationDuration: `${travelMs}ms`,
                } as CSSProperties
              }
            />
            {/* 拐点扩散环: 每次换线留一圈, 抵达终点再留一圈。单次播放, 播完即止。 */}
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
            {phase === "routing" && (
              <circle className="rb-signal" r={9}>
                <animateMotion
                  dur={`${travelMs}ms`}
                  path={pathD}
                  fill="freeze"
                  calcMode="linear"
                />
              </circle>
            )}
          </g>
        )}
      </svg>

      {/* ── 终点事件卡: 常驻可见(玩家要靠它们判断值不值得赌某个入口) ──
          悬停时整卡抬起并在下方展开详情(完整描述 + 两条分支各自的代价) ——
          「这张卡到底能怎么处理」是选入口前最该看清的信息。 */}
      <div className={`rb-nodes${nodesInteractive ? "" : " is-inert"}`}>
        {board.events.map((ev, lane) => {
          const landed = routed && exitLane === lane;
          return (
            // ⚠ 详情必须挂在这层 slot 上而**不是**卡片里: 卡片有 clip-path(斜切角),
            //   而 clip-path 会一并裁掉后代 —— 挂进去的浮层会被切得一点不剩。
            <div
              key={`${lane}-${ev.id}`}
              className={`expl-node-slot k-${ev.kind}`}
              style={{
                left: `${laneX(lane) - NODE_W / 2}px`,
                top: `${NODE_TOP}px`,
                width: `${NODE_W}px`,
                height: `${NODE_H}px`,
              }}
              tabIndex={nodesInteractive ? 0 : -1}
            >
              <div
                className={`expl-node${landed ? " is-landed" : ""}${
                  landed && settling ? " is-struck" : ""
                }${settling && !landed ? " is-dim" : ""}`}
              >
                <span className="expl-node-icon">
                  <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
                    {ICONS[ev.kind]}
                  </svg>
                </span>
                <span className="expl-node-title">{ev.title}</span>
                {ev.energyDelta !== 0 && (
                  <span className={`expl-node-energy ${ev.energyDelta > 0 ? "up" : "down"}`}>
                    粒子 {ev.energyDelta > 0 ? "+" : ""}
                    {ev.energyDelta}
                  </span>
                )}
                {ev.risk && (
                  <span className={`expl-node-risk ${ev.risk}`}>
                    {ev.risk === "negative" ? "纯损耗" : "高风险"}
                  </span>
                )}
              </div>

              <div className="expl-node-detail">
                <p className="expl-node-detail-desc">{ev.description}</p>
                {ev.choices?.map((c) => (
                  <p key={c.id} className="expl-node-detail-choice">
                    <span className="expl-node-detail-label">{c.label}</span>
                    <span className="expl-node-detail-cost">{c.desc}</span>
                  </p>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
