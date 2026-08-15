// ★ 天赋树面板(径向版) —— html-templates/天赋树.html 的 React/TS 组件化。
//
// 视觉: 暗底金色。画布中央是徽章核心线框(纯视觉, 无文字), 六条分支绕中心等角放射,
//   连线带渐变发光与流动光点, 节点为 SVG 圆盘 + 方向图标; 未激活灰色无光, 激活点亮分支本色。
// 交互: 左键激活 / Shift+点击快捷点亮整条路径 / 右键或 Alt+点击退还 / Delete 退还;
//   点数不足只抖动, 悬浮节点出详情浮卡并联动底部属性预览(onHoverKey)。
// 规则: 解锁/退还/花费判定一律来自 @/data/squadTalents 纯函数, 本组件不重写。
// 悬浮提示使用面板内浮卡(非原生 title), 坐标全部为设计 px, 缩放交给 StageCanvas。

import {
  useMemo,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import {
  canRefund,
  costToReach,
  isUnlocked,
  pathTo,
  spentPoints,
  type SquadBadgeDef,
  type SquadResourceKey,
  type TalentNodeDef,
} from "@/data";
import { cx } from "@/ui/common/cx";
import { TrackIcon } from "./icons";
import {
  RADIAL_CANVAS,
  RADIAL_CENTER,
  branchHueOf,
  buildRadialLayout,
  nodeRadius,
} from "./talentGeometry";
import s from "./TalentTreeRadial.module.css";

// 一次性读取(项目惯例, 不监听变化)。
const REDUCED_MOTION =
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// 徽章核心线框(72×72, 纯视觉, 不参与连线状态)。
function BadgeGlyph() {
  return (
    <svg width={72} height={72} viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="M36 5 60 19v28L36 61 12 47V19L36 5Z" strokeWidth={1.2} opacity={0.38} />
      <path d="M36 14 51 23v18l-15 9-15-9V23l15-9Z" strokeWidth={1.6} />
      <circle cx="36" cy="32" r="6" strokeWidth={1.6} />
      <path d="M36 22v20M26 32h20" strokeWidth={1.4} />
    </svg>
  );
}

type NodeState = "locked" | "available" | "unaffordable" | "active" | "refundable";

const STATUS_TEXT: Record<NodeState, string> = {
  locked: "前置节点尚未点亮",
  available: "点击点亮",
  unaffordable: "训练点不足",
  active: "已激活 · 有后续节点依赖, 暂不可退还",
  refundable: "已激活 · 右键 / Alt+点击退还",
};

function nodeStateOf(
  badge: SquadBadgeDef,
  node: TalentNodeDef,
  activated: string[],
  remaining: number,
): NodeState {
  if (activated.includes(node.id)) {
    return canRefund(badge, activated, node.id) ? "refundable" : "active";
  }
  if (!isUnlocked(activated, node)) return "locked";
  return remaining >= node.cost ? "available" : "unaffordable";
}

interface HoverInfo {
  nodeId: string;
  x: number;
  y: number;
  side: "top" | "bottom";
}

interface TalentTreeRadialProps {
  badge: SquadBadgeDef;
  activated: string[];
  remaining: number;
  /** 远征中(或徽章未启用)整棵树只读。 */
  locked: boolean;
  resourceLabels: Record<SquadResourceKey, string>;
  /** 刚激活的节点(播点亮动效; n 用于重挂载 key 重播)。 */
  pulse: { nodeId: string; n: number } | null;
  shakeId: string | null;
  onRequestShake: (nodeId: string) => void;
  onActivate: (nodeId: string) => void;
  onQuickBuy: (nodeId: string) => void;
  onRefund: (nodeId: string) => void;
  /** 悬浮节点时上报资源键(联动外部预览, 页面未接预览时可不传)。 */
  onHoverKey?: (key: SquadResourceKey | null) => void;
  /** 点击中央徽章核心(页面用它开关徽章切换浮层)。 */
  onCoreClick?: () => void;
  /** 父组件唯一的外观通道(铁律 3)。 */
  className?: string;
}

export function TalentTreeRadial({
  badge,
  activated,
  remaining,
  locked,
  resourceLabels,
  pulse,
  shakeId,
  onRequestShake,
  onActivate,
  onQuickBuy,
  onRefund,
  onHoverKey,
  onCoreClick,
  className,
}: TalentTreeRadialProps) {
  const layout = useMemo(() => buildRadialLayout(badge), [badge]);
  const activeSet = useMemo(() => new Set(activated), [activated]);
  const totalCost = useMemo(
    () => badge.nodes.reduce((sum, node) => sum + node.cost, 0),
    [badge],
  );
  const spent = useMemo(() => spentPoints(badge, activated), [badge, activated]);
  const [hover, setHover] = useState<HoverInfo | null>(null);

  // 悬浮节点的依赖路径(链路高亮预览)。
  const traceNodeIds = useMemo(() => {
    if (!hover) return new Set<string>();
    return new Set(pathTo(badge, hover.nodeId).map((node) => node.id));
  }, [badge, hover]);

  const hoverNode = hover ? badge.nodes.find((node) => node.id === hover.nodeId) : undefined;
  const hoverState = hoverNode ? nodeStateOf(badge, hoverNode, activated, remaining) : null;
  const hoverReach =
    hoverNode && hoverState && hoverState !== "active" && hoverState !== "refundable"
      ? costToReach(badge, activated, hoverNode.id)
      : undefined;

  function clearHover() {
    setHover(null);
    onHoverKey?.(null);
  }

  function enterNode(node: TalentNodeDef, x: number, y: number) {
    setHover({ nodeId: node.id, x, y, side: y < RADIAL_CANVAS.height / 2 ? "bottom" : "top" });
    onHoverKey?.(node.key);
  }

  function lineStatus(node: TalentNodeDef): "active" | "open" | "dim" {
    if (activeSet.has(node.id)) return "active";
    return isUnlocked(activated, node) ? "open" : "dim";
  }

  // 点击/键盘共用的节点主操作: Alt 退还、Shift 快捷点亮、普通激活/抖动。
  function pressNode(
    node: TalentNodeDef,
    state: NodeState,
    modifiers: { altKey: boolean; shiftKey: boolean },
  ) {
    if (locked) return;
    const active = state === "active" || state === "refundable";
    if (state === "refundable" && modifiers.altKey) {
      onRefund(node.id);
      return;
    }
    if (!active && modifiers.shiftKey) {
      const reach = costToReach(badge, activated, node.id);
      if (reach <= remaining) onQuickBuy(node.id);
      else onRequestShake(node.id);
      return;
    }
    if (active) return;
    if (state === "available") onActivate(node.id);
    else if (state === "unaffordable") onRequestShake(node.id);
  }

  function handleNodeClick(event: MouseEvent<SVGGElement>, node: TalentNodeDef, state: NodeState) {
    const active = state === "active" || state === "refundable";
    if ((state === "refundable" && event.altKey) || (!active && event.shiftKey)) {
      event.preventDefault();
    }
    pressNode(node, state, { altKey: event.altKey, shiftKey: event.shiftKey });
  }

  function handleNodeContextMenu(event: MouseEvent<SVGGElement>, node: TalentNodeDef, state: NodeState) {
    event.preventDefault();
    if (locked) return;
    if (state === "refundable") onRefund(node.id);
    else if (state === "active") onRequestShake(node.id);
  }

  function handleNodeKeyDown(event: KeyboardEvent<SVGGElement>, node: TalentNodeDef, state: NodeState) {
    if (locked) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      pressNode(node, state, { altKey: event.altKey, shiftKey: event.shiftKey });
      return;
    }
    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      if (state === "refundable") onRefund(node.id);
      else if (state === "active") onRequestShake(node.id);
    }
  }

  return (
    <section
      className={cx(s["trr"], locked && s["is-locked"], hover && s["has-trace"], className)}
      aria-label="天赋树"
    >
      <header className={s["trr-head"]}>
        <span className={s["trr-kicker"]}>{badge.kicker}</span>
        <h3 className={s["trr-title"]}>{badge.name} · 天赋树</h3>
        <div
          className={s["trr-counter"]}
          aria-label={`剩余 ${remaining} 训练点, 已投入 ${spent}/${totalCost}`}
        >
          <span className={s["trr-counter-label"]}>剩余</span>
          <strong>{remaining}</strong>
          <span className={s["trr-counter-total"]}>· {spent}/{totalCost} 已投入</span>
        </div>
      </header>

      <div
        className={s["trr-stage"]}
        style={{ width: `${RADIAL_CANVAS.width}px`, height: `${RADIAL_CANVAS.height}px` }}
      >
        <svg
          className={s["trr-svg"]}
          viewBox={`0 0 ${RADIAL_CANVAS.width} ${RADIAL_CANVAS.height}`}
          onContextMenu={(event) => event.preventDefault()}
        >
          <defs>
            <radialGradient id="trr-core-body" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fff8e8" />
              <stop offset="40%" stopColor="#ffd700" />
              <stop offset="80%" stopColor="#cc8800" />
              <stop offset="100%" stopColor="#664400" />
            </radialGradient>
            <radialGradient id="trr-core-halo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255,215,0,0.35)" />
              <stop offset="60%" stopColor="rgba(255,180,80,0.12)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            {layout.map((branch) => {
              const hue = branchHueOf(branch.branchIndex);
              return (
                <linearGradient
                  key={branch.branchIndex}
                  id={`trr-grad-${branch.branchIndex}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#fff5e0" />
                  <stop offset="30%" stopColor={hue.hue} />
                  <stop offset="100%" stopColor={hue.deep} />
                </linearGradient>
              );
            })}
            <filter id="trr-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="trr-soft" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="12" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="trr-strong" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="20" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <circle cx={RADIAL_CENTER.x} cy={RADIAL_CENTER.y} r={260} fill="url(#trr-core-halo)" />

          {/* ── 连线层(纯装饰) ── */}
          <g aria-hidden>
            {layout.map((branch) => {
              const hue = branchHueOf(branch.branchIndex);
              const traced = branch.nodes.some((node) => traceNodeIds.has(node.id));
              const status = branch.nodes.length
                ? lineStatus(branch.nodes[branch.nodes.length - 1])
                : "dim";
              return (
                <g
                  key={branch.branchIndex}
                  className={cx(s["trr-branch"], traced && s["is-trace"])}
                  style={
                    {
                      "--trr-hue": hue.hue,
                      "--trr-deep": hue.deep,
                      "--trr-grad": `url(#trr-grad-${branch.branchIndex})`,
                    } as CSSProperties
                  }
                >
                  <path
                    id={`trr-branch-${branch.branchIndex}`}
                    className={cx(s["trr-line"], s[`is-${status}`], traced && s["is-trace"])}
                    d={branch.pathD}
                  />
                  {status === "active" && !REDUCED_MOTION && (
                    <circle className={s["trr-orb"]} r={3.5} filter="url(#trr-glow)">
                      <animateMotion
                        dur={`${7 + branch.branchIndex * 1.3}s`}
                        repeatCount="indefinite"
                      >
                        <mpath href={`#trr-branch-${branch.branchIndex}`} />
                      </animateMotion>
                    </circle>
                  )}
                </g>
              );
            })}
          </g>

          {/* ── 徽章核心(可点击: 开关徽章切换浮层) ── */}
          <g
            className={s["trr-core"]}
            transform={`translate(${RADIAL_CENTER.x}, ${RADIAL_CENTER.y})`}
            role="button"
            tabIndex={0}
            aria-label="切换小队徽章"
            onClick={onCoreClick}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onCoreClick?.();
              }
            }}
          >
            <circle className={s["trr-core-pulse"]} r={46} />
            <circle className={s["trr-core-pulse"]} r={46} style={{ animationDelay: "1.5s" }} />
            <circle className={s["trr-core-body"]} r={48} fill="url(#trr-core-body)" />
            <g className={s["trr-core-glyph"]} transform="translate(-36, -36) scale(0.5)">
              <BadgeGlyph />
            </g>
          </g>

          {/* ── 链末标签(纯装饰) ── */}
          <g aria-hidden>
            {layout.map((branch) => {
              if (!branch.nodes.length) return null;
              const hue = branchHueOf(branch.branchIndex);
              const activeCount = branch.nodes.filter((node) => activeSet.has(node.id)).length;
              const status =
                activeCount === 0 ? "empty" : activeCount === branch.nodes.length ? "complete" : "progress";
              const traced = branch.nodes.some((node) => traceNodeIds.has(node.id));
              return (
                <g
                  key={`${branch.branchIndex}-label`}
                  className={cx(s["trr-label"], s[`is-${status}`], traced && s["is-trace"])}
                  transform={`translate(${branch.labelPoint.x.toFixed(1)}, ${branch.labelPoint.y.toFixed(1)})`}
                  style={{ "--trr-hue": hue.hue, "--trr-deep": hue.deep } as CSSProperties}
                >
                  <rect className={s["trr-label-bg"]} x={-66} y={-21} width={132} height={42} rx={21} />
                  <text className={s["trr-label-name"]} y={-6}>
                    {branch.branchIndex < badge.branches.length ? badge.branches[branch.branchIndex].name : ""}
                  </text>
                  <text className={s["trr-label-count"]} y={14}>
                    {activeCount}/{branch.nodes.length}
                  </text>
                </g>
              );
            })}
          </g>

          {/* ── 节点层 ── */}
          {layout.map((branch) => {
            const hue = branchHueOf(branch.branchIndex);
            const traced = branch.nodes.some((node) => traceNodeIds.has(node.id));
            return (
              <g
                key={`${branch.branchIndex}-nodes`}
                className={cx(s["trr-node-branch"], traced && s["is-trace"])}
              >
                {branch.nodes.map((node, idx) => {
                  const point = branch.nodePoints[idx];
                  const radius = nodeRadius(node, idx);
                  const state = nodeStateOf(badge, node, activated, remaining);
                  const active = state === "active" || state === "refundable";
                  const isLatest = pulse?.nodeId === node.id;
                  const isShaking = shakeId === node.id;
                  const effectLabel = `${resourceLabels[node.key]} +${node.value}`;
                  return (
                    <g
                      key={`${node.id}-${isLatest && active ? pulse?.n : "stable"}`}
                      className={cx(
                        s["trr-node"],
                        s[`is-${state}`],
                        isLatest && active && s["is-latest"],
                        isShaking && s["is-shaking"],
                        traceNodeIds.has(node.id) && s["is-trace"],
                        locked && s["is-disabled"],
                      )}
                      transform={`translate(${point.x.toFixed(1)}, ${point.y.toFixed(1)})`}
                      style={{ "--trr-hue": hue.hue, "--trr-deep": hue.deep } as CSSProperties}
                      role="button"
                      tabIndex={locked ? -1 : 0}
                      aria-label={`${node.name}: ${effectLabel}, 消耗 ${node.cost} 训练点。${STATUS_TEXT[state]}`}
                      onClick={(event) => handleNodeClick(event, node, state)}
                      onContextMenu={(event) => handleNodeContextMenu(event, node, state)}
                      onKeyDown={(event) => handleNodeKeyDown(event, node, state)}
                      onMouseEnter={() => enterNode(node, point.x, point.y)}
                      onMouseLeave={clearHover}
                      onFocus={() => enterNode(node, point.x, point.y)}
                      onBlur={clearHover}
                    >
                      <g className={s["trr-node-visual"]}>
                        <circle
                          className={s["trr-node-outer"]}
                          r={radius + 10}
                          fill={hue.hue}
                          filter="url(#trr-strong)"
                        />
                        <circle className={s["trr-node-main"]} r={radius} />
                        <circle className={s["trr-node-color"]} r={radius - 3} />
                        <circle className={s["trr-node-inner"]} r={radius - 6} />
                        <g
                          className={s["trr-node-icon"]}
                          transform={`translate(${-(radius * 0.78)}, ${-(radius * 0.78)}) scale(${(radius * 0.78) / 24})`}
                        >
                          <TrackIcon branchId={badge.branches[branch.branchIndex]?.id ?? ""} />
                        </g>
                        {node.tier === "major" && active && (
                          <circle className={s["trr-node-pulse"]} r={radius} />
                        )}
                      </g>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>

        {/* ── 悬浮详情浮卡(组件浮层, 非原生 title) ── */}
        {hover && hoverNode && hoverState && (
          <div
            className={cx(s["trr-tip"], hover.side === "bottom" ? s["is-bottom"] : s["is-top"])}
            style={{ left: `${hover.x}px`, top: `${hover.y}px` }}
          >
            <div className={s["trr-tip-head"]}>
              <span className={s["trr-tip-icon"]}>✦</span>
              <div>
                <div className={s["trr-tip-title"]}>{hoverNode.name}</div>
                <div className={s["trr-tip-tier"]}>
                  {badge.branches.find((branch) => hoverNode.id.startsWith(`${branch.id}-`))?.name ??
                    "天赋"}
                </div>
              </div>
            </div>
            <div className={s["trr-tip-effect"]}>
              {resourceLabels[hoverNode.key]} +{hoverNode.value}
            </div>
            <div className={s["trr-tip-status"]}>{STATUS_TEXT[hoverState]}</div>
            {hoverReach != null && (
              <div className={s["trr-tip-reach"]}>
                点亮到此还需 {hoverReach} 点
                {hoverReach > hoverNode.cost && " · Shift+点击 一次点亮全路径"}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
