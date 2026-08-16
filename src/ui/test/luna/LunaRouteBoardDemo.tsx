import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { traceSegment } from "@/explore/route";
import type { NodeEvent, NodeEventKind, RouteSegment } from "@/explore/types";
import { cx } from "@/ui/common/cx";
import sceneBackground from "@/assets/占位场景素材.png";
import { makeLunaBoard } from "./lunaRouteMock";
import s from "./LunaRouteBoardDemo.module.css";

type Point = [number, number];
type DemoPhase = "sealed" | "revealed" | "landed" | "moving" | "complete";

const LANE_COUNT = 5;
const SEGMENT_COUNT = 4;
const SIGNAL_DURATION_MS = 1450;
const ENTRY_LABELS = ["A", "B", "C", "D", "E"];

// Demo 自己维护一份等距投影，避免依赖正式路线图的布局常量或样式。
const ADV_X = 0.894;
const ADV_Y = -0.447;
const LANE_X = 0.894;
const LANE_Y = 0.447;
const SEG_PITCH = 200;
const LANE_GAP = 124;
const TILE_HALF = 20;
const TILE_D = 9;
const TILE_INSET = 22;
const ICON_H = 40;
const ENTRY_U = -96;
const PAD = 32;
const TILE_W = 2 * TILE_HALF * (ADV_X + LANE_X);
const TILE_TOP_H = 2 * TILE_HALF * (LANE_Y - ADV_Y);
const TILE_BOX_H = TILE_TOP_H + TILE_D;
const TRACK_END = ENTRY_U + SEG_PITCH + (SEGMENT_COUNT - 1) * SEG_PITCH;
const S_MAX = (LANE_COUNT - 1) * LANE_GAP;
const rawX = (u: number, laneOffset: number) => u * ADV_X + laneOffset * LANE_X;
const rawY = (u: number, laneOffset: number) => u * ADV_Y + laneOffset * LANE_Y;
const X_LO = rawX(ENTRY_U - TILE_HALF, -TILE_HALF);
const X_HI = Math.max(rawX(TRACK_END, S_MAX), rawX(TRACK_END + TILE_HALF, S_MAX + TILE_HALF));
const Y_LO = Math.min(rawY(TRACK_END, 0) - ICON_H, rawY(TRACK_END, -TILE_HALF));
const Y_HI = rawY(ENTRY_U - TILE_HALF, S_MAX + TILE_HALF) + TILE_D;
const BOARD_WIDTH = Math.round(X_HI - X_LO + PAD * 2);
const BOARD_HEIGHT = Math.round(Y_HI - Y_LO + PAD * 2);
const ORIGIN_X = PAD - X_LO;
const ORIGIN_Y = PAD - Y_LO;

function nodeU(segment: number): number {
  return segment < 0 ? ENTRY_U : ENTRY_U + SEG_PITCH + segment * SEG_PITCH;
}

function laneS(lane: number): number {
  return lane * LANE_GAP;
}

function screenPoint(u: number, laneOffset: number): Point {
  return [ORIGIN_X + u * ADV_X + laneOffset * LANE_X, ORIGIN_Y + u * ADV_Y + laneOffset * LANE_Y];
}

function nodePoint(segment: number, lane: number): Point {
  return screenPoint(nodeU(segment), laneS(lane));
}

function bridgePoint(segment: number, row: number, lane: number, rows: number): Point {
  const from = nodeU(segment - 1) + 48;
  const to = nodeU(segment) - 48;
  return screenPoint(from + ((row + 1) * (to - from)) / (rows + 1), laneS(lane));
}

function pathOf(points: Point[]): string {
  return points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
}

function lengthOf(points: Point[]): number {
  let length = 0;
  for (let index = 1; index < points.length; index += 1) {
    length += Math.hypot(points[index][0] - points[index - 1][0], points[index][1] - points[index - 1][1]);
  }
  return length;
}

function segmentRoutePoints(segment: RouteSegment, laneIn: number, rows: number, segmentIndex: number): Point[] {
  const points: Point[] = [nodePoint(segmentIndex - 1, laneIn)];
  const { steps } = traceSegment(segment, laneIn, rows);
  for (const step of steps) {
    if (step.movedFrom == null) continue;
    const point = bridgePoint(segmentIndex, step.row, step.movedFrom, rows);
    points.push(point, bridgePoint(segmentIndex, step.row, step.lane, rows));
  }
  points.push(nodePoint(segmentIndex, steps[steps.length - 1].lane));
  return points;
}

function tileStyle(point: Point): CSSProperties {
  return {
    left: `${point[0] - TILE_W / 2}px`,
    top: `${point[1] - TILE_TOP_H / 2 - 5}px`,
    width: `${TILE_W}px`,
    height: `${TILE_BOX_H}px`,
    "--foot": `${TILE_BOX_H - TILE_TOP_H / 2 - 2}px`,
  } as CSSProperties;
}

function eventAccent(kind: NodeEventKind): string {
  const colors: Record<NodeEventKind, string> = {
    retreat: "#c9ded2",
    loot: "#d0a35a",
    heal: "#62bf91",
    merchant: "#b18ac8",
    route: "#60adbd",
    energy: "#76d7dc",
    hazard: "#c15a59",
    battle: "#d58c5c",
  };
  return colors[kind];
}

const GLYPHS: Record<NodeEventKind, ReactNode> = {
  retreat: <><path d="M10 38h28M14 38V9h20v29M19 20l5-5 5 5" strokeWidth={1.6} /><path d="M24 15v18" strokeWidth={1.5} /></>,
  loot: <><path d="M9 18h30v22H9z" strokeWidth={1.6} /><path d="M9 18l4-8h22l4 8M24 18v22M19 27h10" strokeWidth={1.3} /></>,
  heal: <><circle cx="24" cy="24" r="15" strokeWidth={1.2} /><path d="M24 15v18M15 24h18" strokeWidth={1.7} /></>,
  merchant: <><path d="M12 7h24v34H12z" strokeWidth={1.6} /><path d="M17 13h9v14h-9zM30 13h3M30 19h3M17 33h14" strokeWidth={1.3} /></>,
  route: <><path d="M24 42V26l10-10V6M24 26 14 16V6" strokeWidth={1.6} /><circle cx="24" cy="26" r="3" strokeWidth={1.5} /></>,
  energy: <><path d="M17 8h14l-2 12 4 20H15l4-20z" strokeWidth={1.6} /><path d="m27 16-6 10h6l-3 7" strokeWidth={1.5} /></>,
  hazard: <><path d="M24 8 42 39H6z" strokeWidth={1.6} /><path d="M24 19v9M24 34v.1" strokeWidth={1.8} /></>,
  battle: <><circle cx="24" cy="24" r="13" strokeWidth={1.5} /><path d="M24 7v8M24 33v8M7 24h8M33 24h8" strokeWidth={1.5} /><circle cx="24" cy="24" r="3" strokeWidth={1.5} /></>,
};

function StandingIcon({ kind }: { kind: NodeEventKind }) {
  const art = GLYPHS[kind];
  return (
    <svg className={s.nodeIcon} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <g className={s.iconShadow} transform="translate(0 2)">{art}</g>
      <g>{art}</g>
      <g className={s.iconLight} transform="translate(-0.7 -0.9)">{art}</g>
    </svg>
  );
}

const top = (half: number): Point[] => [
  [TILE_W / 2, 0],
  [TILE_W / 2 + half * (ADV_X + LANE_X), TILE_TOP_H / 2],
  [TILE_W / 2, TILE_TOP_H],
  [TILE_W / 2 - half * (ADV_X + LANE_X), TILE_TOP_H / 2],
];

function Tile({ entry = false }: { entry?: boolean }) {
  const corners = top(entry ? 33 : TILE_HALF);
  const base = top(TILE_HALF);
  const bottom = base.map(([x, y]) => [x, y + TILE_D] as Point);
  return (
    <svg className={s.tile} viewBox={`0 0 ${TILE_W} ${TILE_BOX_H}`} aria-hidden>
      {entry && <polygon className={s.entryHalo} points={corners.map(([x, y]) => `${x},${y}`).join(" ")} />}
      <polygon className={s.tileSide} points={[base[3], base[2], base[1], bottom[1], bottom[2], bottom[3]].map(([x, y]) => `${x},${y}`).join(" ")} />
      <polygon className={s.tileTop} points={base.map(([x, y]) => `${x},${y}`).join(" ")} />
      <polygon className={s.tileGloss} points={`${base[0][0]},${base[0][1]} ${base[1][0]},${base[1][1]} ${TILE_W * 0.67},${TILE_TOP_H * 0.33} ${TILE_W * 0.33},${TILE_TOP_H * 0.16}`} />
      <polygon className={s.tileSeam} points={top(TILE_HALF * 0.62).map(([x, y]) => `${x},${y}`).join(" ")} />
      <polyline className={entry ? s.entryEdge : s.tileEdge} points={`${base[0][0]},${base[0][1]} ${base[1][0]},${base[1][1]}`} />
      {entry && <>
        <polyline className={s.entryChevron} points={`${TILE_W / 2 - 9},${TILE_TOP_H / 2 + 4} ${TILE_W / 2},${TILE_TOP_H / 2 - 5} ${TILE_W / 2 + 9},${TILE_TOP_H / 2 + 4}`} />
      </>}
    </svg>
  );
}

function Pipe({ from, to }: { from: Point; to: Point }) {
  return <><line className={s.pipeBed} x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} /><line className={s.pipe} x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} /></>;
}

function SignalSatellite() {
  return <g className={s.satellite}><circle className={s.satelliteShadow} r="14" /><circle className={s.satelliteCore} r="6" /><path className={s.satelliteArm} d="M-5-5-12-12m5 17-7 7M5-5l7-7M5 5l7 7" /></g>;
}

function Pawn() {
  return <g className={s.pawn}><ellipse className={s.pawnShadow} cy="1" rx="16" ry="6" /><path className={s.pawnBody} d="M-11 0-7-27h14L11 0z" /><path className={s.pawnFace} d="m-7-27 7-4 7 4-7 4z" /><path className={s.pawnEdge} d="M-7-27 0-23l7-4M0-23v-8" /></g>;
}

function NodeProjection({ kind }: { kind: NodeEventKind }) {
  return (
    <span className={s.nodeProjection} aria-hidden="true">
      <span className={s.projectionStem} />
      <span className={s.projectionPlane}>
        <span className={s.projectionPlaneGrid} />
        <span className={s.projectionCorner} />
        <StandingIcon kind={kind} />
      </span>
    </span>
  );
}

function phaseCopy(phase: DemoPhase, entryLane: number | null, currentSegment: number): string {
  if (phase === "sealed") return "航道封锁 · 等待观测授权";
  if (phase === "revealed") return "闸门显形 · 选择一个入口通道";
  if (phase === "moving") return `信号推进中 · 航段 ${currentSegment + 1} / ${SEGMENT_COUNT}`;
  if (phase === "complete") return "本轮观测完成 · 航迹已归档";
  return `已接入 ${ENTRY_LABELS[entryLane ?? 0]} 通道 · 等待下一段指令`;
}

export function LunaRouteBoardDemo() {
  const [round, setRound] = useState(7);
  const [phase, setPhase] = useState<DemoPhase>("sealed");
  const [entryLane, setEntryLane] = useState<number | null>(null);
  const [currentLane, setCurrentLane] = useState<number | null>(null);
  const [currentSegment, setCurrentSegment] = useState(0);
  const [hovered, setHovered] = useState<NodeEvent | null>(null);
  const signalMotionRef = useRef<SVGElement | null>(null);
  const pawnMotionRef = useRef<SVGElement | null>(null);
  const board = useMemo(() => makeLunaBoard(round), [round]);
  const rows = board.rowsPerSegment;
  const inputLane = currentLane ?? entryLane;
  const moving = phase === "moving" && inputLane != null && currentSegment < SEGMENT_COUNT;

  const activePoints = useMemo(() => {
    if (!moving || inputLane == null) return [];
    return segmentRoutePoints(board.segments[currentSegment], inputLane, rows, currentSegment);
  }, [board, currentSegment, inputLane, moving, rows]);
  const activePath = pathOf(activePoints);

  const completedPath = useMemo(() => {
    if (entryLane == null) return "";
    const points: Point[] = [];
    let lane = entryLane;
    for (let segment = 0; segment < currentSegment; segment += 1) {
      const route = segmentRoutePoints(board.segments[segment], lane, rows, segment);
      points.push(...(points.length ? route.slice(1) : route));
      lane = traceSegment(board.segments[segment], lane, rows).laneOut;
    }
    return pathOf(points);
  }, [board, currentSegment, entryLane, rows]);

  const visitedLanes = useMemo(() => {
    if (entryLane == null) return [] as number[];
    const lanes: number[] = [];
    let lane = entryLane;
    for (let segment = 0; segment < currentSegment; segment += 1) {
      lane = traceSegment(board.segments[segment], lane, rows).laneOut;
      lanes.push(lane);
    }
    return lanes;
  }, [board, currentSegment, entryLane, rows]);

  useEffect(() => {
    if (!moving || inputLane == null) return;
    signalMotionRef.current && (signalMotionRef.current as SVGAnimationElement).beginElement();
    pawnMotionRef.current && (pawnMotionRef.current as SVGAnimationElement).beginElement();
    const timer = window.setTimeout(() => {
      const nextLane = traceSegment(board.segments[currentSegment], inputLane, rows).laneOut;
      setCurrentLane(nextLane);
      setCurrentSegment((value) => value + 1);
      setPhase(currentSegment + 1 >= SEGMENT_COUNT ? "complete" : "landed");
    }, SIGNAL_DURATION_MS + 240);
    return () => window.clearTimeout(timer);
  }, [board, currentSegment, inputLane, moving, rows]);

  function reset(nextRound = round) {
    setRound(nextRound);
    setPhase("sealed");
    setEntryLane(null);
    setCurrentLane(null);
    setCurrentSegment(0);
    setHovered(null);
  }

  function chooseEntry(lane: number) {
    if (phase !== "revealed" || board.blockedLanes.includes(lane)) return;
    setEntryLane(lane);
    setCurrentLane(lane);
    setPhase("landed");
  }

  const pawnPoint = entryLane == null
    ? null
    : currentSegment === 0 ? nodePoint(-1, entryLane) : nodePoint(currentSegment - 1, currentLane ?? entryLane);
  const satellitePoint = pawnPoint;

  return (
    <div className={s.root} style={{ "--scene-background": `url(${sceneBackground})` } as CSSProperties}>
      <header className={s.header}>
        <div><span className={s.kicker}>LUNA OBSERVATORY / ISOMETRIC ROUTE</span><h2 className={s.title}>月面航线 · 观测台</h2><p className={s.subtitle}>每一次跨越都是短暂的轨道窗口，落点只在信号抵达后确认。</p></div>
        <div className={s.headerMeta}><span className={s.roundStamp}>CYCLE {String(board.round).padStart(2, "0")}</span><span className={s.metaText}>LUNA-04 / REDLINE CHART</span></div>
      </header>

      <div className={s.controlBar}>
        <div className={s.readouts}><span><b className={s.readoutMark} data-tone="route" />航道导线</span><span><b className={s.readoutMark} data-tone="gate" />跨越闸门</span><span><b className={s.readoutMark} data-tone="risk" />风险信号</span></div>
        <div className={s.actions}><button type="button" className={s.quietButton} onClick={() => reset(round + 1)}><span aria-hidden>↻</span> 换周期</button><button type="button" className={s.quietButton} onClick={() => reset()}><span aria-hidden>○</span> 重置</button><button type="button" className={s.authorizeButton} onClick={() => phase === "sealed" && setPhase("revealed")} disabled={phase !== "sealed"}><span aria-hidden>{phase === "sealed" ? "⊙" : "✓"}</span>{phase === "sealed" ? "授权航道" : "航道已授权"}</button></div>
      </div>

      <section className={s.routeStage} aria-label="Luna 等距航线图">
        <div className={s.stageReadout}><span className={s.chartTitle}>ISOMETRIC ROUTE <b>04</b></span><span className={s.phaseCopy}>{phaseCopy(phase, entryLane, currentSegment)}</span></div>
        <div className={s.chartViewport}>
          <div className={s.chart} style={{ width: BOARD_WIDTH, height: BOARD_HEIGHT }}>
            <div className={s.chartGrid} aria-hidden />
            <div className={s.segmentLabels} aria-hidden>{Array.from({ length: SEGMENT_COUNT }, (_, segment) => <span key={segment} style={{ left: nodePoint(segment, 0)[0] + 2, top: nodePoint(segment, 0)[1] - 44 }}>{String(segment + 1).padStart(2, "0")}</span>)}</div>
            <svg className={s.chartSvg} viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`} aria-hidden>
              {Array.from({ length: LANE_COUNT }, (_, lane) => <g key={lane} className={cx(s.lane, entryLane != null && lane !== (currentLane ?? entryLane) && s.laneDim)}>{Array.from({ length: SEGMENT_COUNT }, (_, segment) => <Pipe key={segment} from={screenPoint(nodeU(segment - 1) + TILE_INSET, laneS(lane))} to={screenPoint(nodeU(segment) - TILE_INSET, laneS(lane))} />)}</g>)}
              <g className={cx(s.bridges, phase === "sealed" && s.bridgesHidden)}>{board.segments.flatMap((segment) => segment.bridges.map((bridge) => { const left = bridgePoint(segment.index, bridge.row, bridge.leftLane, rows); const right = bridgePoint(segment.index, bridge.row, bridge.leftLane + 1, rows); return <g key={`${segment.index}-${bridge.row}-${bridge.leftLane}`}><Pipe from={left} to={right} /><circle className={s.bridgePin} cx={left[0]} cy={left[1]} r="3" /><circle className={s.bridgePin} cx={right[0]} cy={right[1]} r="3" /></g>; }))}</g>
              {completedPath && <path className={s.completedPath} d={completedPath} />}
              {moving && activePath && <g key={`${round}-${currentSegment}`}><path className={s.activePath} d={activePath} pathLength="1" style={{ "--travel": `${SIGNAL_DURATION_MS}ms` } as CSSProperties} /><path className={s.activePathHighlight} d={activePath} pathLength="1" style={{ "--travel": `${SIGNAL_DURATION_MS}ms` } as CSSProperties} /><g><SignalSatellite /><animateMotion ref={signalMotionRef} begin="indefinite" dur={`${SIGNAL_DURATION_MS}ms`} path={activePath} fill="freeze" calcMode="linear" /></g><g className={s.movingPawn}><Pawn /><animateMotion ref={pawnMotionRef} begin="indefinite" dur={`${SIGNAL_DURATION_MS}ms`} path={activePath} fill="freeze" calcMode="linear" /></g></g>}
              {!moving && pawnPoint && <g transform={`translate(${pawnPoint[0]} ${pawnPoint[1]})`}><Pawn /></g>}
              {!moving && satellitePoint && <g transform={`translate(${satellitePoint[0]} ${satellitePoint[1]})`}><SignalSatellite /></g>}
            </svg>

            <div className={s.entryLayer}>{ENTRY_LABELS.map((label, lane) => { const blocked = board.blockedLanes.includes(lane); const selected = entryLane === lane; const usable = phase === "revealed" && !blocked; return <button key={label} type="button" className={cx(s.entryMarker, selected && s.entrySelected, blocked && s.entryBlocked)} style={tileStyle(nodePoint(-1, lane))} disabled={!usable} aria-label={blocked ? `${label} 通道已封锁` : `选择 ${label} 通道`} onClick={() => chooseEntry(lane)}><Tile entry /><span className={s.entryBeam} aria-hidden /><span className={s.entryLetter}>{label}</span><small>{blocked ? "CLOSED" : "ENTRY"}</small></button>; })}</div>
            <div className={s.nodeLayer}>{board.nodes.flatMap((row, segment) => row.map((event, lane) => { const visited = visitedLanes[segment] === lane; const current = currentSegment > 0 && segment === currentSegment - 1 && currentLane === lane; return <button key={`${segment}-${lane}-${event.id}`} type="button" className={cx(s.nodeMarker, visited && s.nodeVisited, current && s.nodeCurrent)} data-kind={event.kind} style={{ ...tileStyle(nodePoint(segment, lane)), "--kind": eventAccent(event.kind) } as CSSProperties} aria-label={`${event.title}：${event.description}`} onPointerEnter={() => setHovered(event)} onPointerLeave={() => setHovered(null)} onFocus={() => setHovered(event)} onBlur={() => setHovered(null)}><Tile /><span className={s.tileShadow} aria-hidden /><NodeProjection kind={event.kind} /><span className={s.nodeIndex}>{String(segment + 1).padStart(2, "0")}</span></button>; }))}</div>
          </div>
        </div>
        {hovered && <aside className={s.eventTip}><span style={{ color: eventAccent(hovered.kind) }}>{hovered.kind.toUpperCase()}</span><strong>{hovered.title}</strong><p>{hovered.description}</p></aside>}
      </section>

      <footer className={s.footer}><div className={s.currentSignal}><span className={s.readoutLabel}>CURRENT LINK</span><strong>{inputLane == null ? "NO SIGNAL" : `${ENTRY_LABELS[inputLane]} / ${currentSegment} OF ${SEGMENT_COUNT}`}</strong></div><p>瓦片是节点，斜线是推进轴，暗红只标记信号与风险。</p><button type="button" className={s.advanceButton} onClick={() => phase === "landed" && inputLane != null && currentSegment < SEGMENT_COUNT && setPhase("moving")} disabled={phase !== "landed" || currentSegment >= SEGMENT_COUNT}>{phase === "moving" ? "推进中..." : currentSegment >= SEGMENT_COUNT ? "观测完成" : "发送下一段信号"}<span aria-hidden>→</span></button></footer>
    </div>
  );
}
