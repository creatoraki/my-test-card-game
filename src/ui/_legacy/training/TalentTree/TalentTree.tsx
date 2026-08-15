// ★ 天赋树面板 —— 徽章专属的节点图。
//
// 底层一张 <svg viewBox="0 0 W H"> 画连线: 徽章核心图形(画布下方, 纯视觉, 不是节点)到六条链首
// 各一条「从徽章长出来」的连线, 链内按 requires 逐颗相连。上层是绝对定位的 TalentNode
// 按钮。坐标与 RouteBoard 同一套做法: 全部是设计 px(badge.canvas), 缩放交给 StageCanvas。
//
// 连线三态: is-dim(前置未满足) / is-open(可解锁) / is-active(两端均已激活)。
// 节点五态与交互由 TalentNode 承载, 本组件只负责把「已激活集合 + 剩余点数」换算成
// 每个节点的视觉态 —— 判定函数一律来自 @/data/squadTalents, 不在组件里重写规则。

import { useState, type CSSProperties } from "react";
import {
  branchNodesOf,
  canRefund,
  costToReach,
  getNode,
  isUnlocked,
  pathTo,
  type SquadBadgeDef,
  type SquadResourceKey,
  type TalentNodeDef,
} from "@/data";
import { cx } from "@/ui/common/cx";
import { TalentNode, type TalentNodeState } from "../TalentNode";
import { BRANCH_HUE } from "../styles/branchTheme";
import s from "./TalentTree.module.css";

// 徽章核心图形: 72×72 线框徽章(纯视觉, 不是节点, 不参与连线状态)。
function BadgeGlyph() {
  return (
    <svg viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="M36 5 60 19v28L36 61 12 47V19L36 5Z" strokeWidth={1.2} opacity={0.38} />
      <path d="M36 14 51 23v18l-15 9-15-9V23l15-9Z" strokeWidth={1.6} />
      <circle cx="36" cy="32" r="6" strokeWidth={1.6} />
      <path d="M36 22v20M26 32h20" strokeWidth={1.4} />
    </svg>
  );
}

// 节点直径: major(末节点)比 minor 大一档。
const NODE_SIZE = { minor: 46, major: 60 } as const;

interface Point {
  x: number;
  y: number;
}

function radialPoint(center: Point, target: Point, distance: number): Point {
  const dx = target.x - center.x;
  const dy = target.y - center.y;
  const length = Math.hypot(dx, dy) || 1;
  return {
    x: center.x + (dx / length) * distance,
    y: center.y + (dy / length) * distance,
  };
}

function curvePath(from: Point, to: Point): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const midpoint = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  const normal = { x: -dy / length, y: dx / length };
  const control = { x: midpoint.x + normal.x * 10, y: midpoint.y + normal.y * 10 };
  return `M ${from.x} ${from.y} Q ${control.x} ${control.y} ${to.x} ${to.y}`;
}

interface TalentTreeProps {
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
  onHoverKey: (key: SquadResourceKey | null) => void;
}

function nodeStateOf(
  badge: SquadBadgeDef,
  node: TalentNodeDef,
  activated: string[],
  remaining: number,
): TalentNodeState {
  if (activated.includes(node.id)) {
    return canRefund(badge, activated, node.id) ? "refundable" : "active";
  }
  if (!isUnlocked(activated, node)) return "locked";
  return remaining >= node.cost ? "available" : "unaffordable";
}

export function TalentTree({
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
}: TalentTreeProps) {
  const { width, height } = badge.canvas;
  const center = { x: width / 2, y: height - 40 };
  const coreSize = 80;
  const activeSet = new Set(activated);
  const [hoverNodeId, setHoverNodeId] = useState<string | null>(null);
  const traceNodes = hoverNodeId ? pathTo(badge, hoverNodeId) : [];
  const traceNodeIds = new Set(traceNodes.map((node) => node.id));
  const traceEdges = new Set<string>();

  for (const node of traceNodes) {
    traceEdges.add(`${node.requires[0] ?? "core"}->${node.id}`);
  }

  // 一条连线的状态: 目标节点已激活 → active; 前置满足 → open; 否则 dim。
  function lineStatus(target: TalentNodeDef): "active" | "open" | "dim" {
    if (activeSet.has(target.id)) return "active";
    return isUnlocked(activated, target) ? "open" : "dim";
  }

  function renderLine(
    key: string,
    from: Point,
    to: Point,
    target: TalentNodeDef,
    hue: { hue: string; deep: string },
  ) {
    const status = lineStatus(target);
    const traced = traceEdges.has(key);
    const d = curvePath(from, to);
    return (
      <g
        key={key}
        className={cx(traced && s["is-trace"])}
        style={{ "--tt-hue": hue.hue, "--tt-deep": hue.deep } as CSSProperties}
      >
        <path
          className={cx(s["tt-line"], s[`is-${status}`], traced && s["is-trace"])}
          d={d}
        />
        {status === "active" && <path className={s["tt-line-flow"]} d={d} />}
      </g>
    );
  }

  return (
    <section
      className={cx(s["tt"], locked && s["is-locked"], hoverNodeId && s["has-trace"])}
      aria-label="天赋树"
    >
      <header className={s["tt-head"]}>
        <span className={s["tt-kicker"]}>{badge.kicker}</span>
        <h3 className={s["tt-title"]}>{badge.name} · 天赋树</h3>
      </header>

      <div
        className={s["tt-stage"]}
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        {/* ── 连线层 ── */}
        <svg className={s["tt-svg"]} viewBox={`0 0 ${width} ${height}`} aria-hidden>
          {badge.branches.map((branch) => {
            const branchNodes = branchNodesOf(badge, branch.id);
            const hue = BRANCH_HUE[branch.id] ?? { hue: "var(--tr-glow)", deep: "var(--tr-glow-deep)" };
            const branchTraced = branchNodes.some((node) => traceNodeIds.has(node.id));
            const root = branchNodes[0];
            return (
              <g
                key={branch.id}
                className={cx(s["tt-branch"], branchTraced && s["is-trace"])}
                style={{ "--tt-hue": hue.hue, "--tt-deep": hue.deep } as CSSProperties}
              >
                {root && renderLine(
                  `core->${root.id}`,
                  radialPoint(center, root, 54),
                  { x: root.x, y: root.y },
                  root,
                  hue,
                )}
                {branchNodes.slice(1).flatMap((node) =>
                  node.requires.map((reqId) => {
                    const from = getNode(badge, reqId);
                    if (!from) return null;
                    return renderLine(
                      `${reqId}->${node.id}`,
                      { x: from.x, y: from.y },
                      { x: node.x, y: node.y },
                      node,
                      hue,
                    );
                  }),
                )}
              </g>
            );
          })}
        </svg>

        {/* ── 徽章核心图形(纯视觉) ── */}
        <div
          className={s["tt-core"]}
          style={{
            left: `${center.x - coreSize / 2}px`,
            top: `${center.y - coreSize / 2}px`,
          }}
          aria-hidden
        >
          <BadgeGlyph />
        </div>

        {/* ── 链末标签 ── */}
        {badge.branches.map((branch) => {
          const branchNodes = branchNodesOf(badge, branch.id);
          const tail = branchNodes[branchNodes.length - 1];
          if (!tail) return null;
          const hue = BRANCH_HUE[branch.id] ?? { hue: "var(--tr-glow)", deep: "var(--tr-glow-deep)" };
          const activeCount = branchNodes.filter((node) => activeSet.has(node.id)).length;
          const status = activeCount === 0 ? "empty" : activeCount === branchNodes.length ? "complete" : "progress";
          const tailRadius = Math.hypot(tail.x - center.x, tail.y - center.y);
          const label = radialPoint(center, tail, tailRadius + 46);
          const branchTraced = branchNodes.some((node) => traceNodeIds.has(node.id));
          return (
            <div
              key={`${branch.id}-label`}
              className={cx(
                s["tt-label"],
                s[`is-${status}`],
                branchTraced && s["is-trace"],
              )}
              style={{
                left: `${label.x}px`,
                top: `${label.y}px`,
                "--tt-hue": hue.hue,
                "--tt-deep": hue.deep,
              } as CSSProperties}
              aria-label={`${branch.name} ${activeCount}/${branchNodes.length}`}
            >
              <span>{branch.name}</span>
              <strong>{activeCount}/{branchNodes.length}</strong>
            </div>
          );
        })}

        {/* ── 节点层 ── */}
        {badge.branches.map((branch) => {
          const branchNodes = branchNodesOf(badge, branch.id);
          const hue = BRANCH_HUE[branch.id] ?? { hue: "var(--tr-glow)", deep: "var(--tr-glow-deep)" };
          const branchTraced = branchNodes.some((node) => traceNodeIds.has(node.id));
          return (
            <div
              key={`${branch.id}-nodes`}
              className={cx(s["tt-node-branch"], branchTraced && s["is-trace"])}
            >
              {branchNodes.map((node) => {
                const size = NODE_SIZE[node.tier];
                const state = nodeStateOf(badge, node, activated, remaining);
                const latest = pulse?.nodeId === node.id;
                const reach = costToReach(badge, activated, node.id);
                const active = state === "active" || state === "refundable";
                return (
                  <TalentNode
                    key={`${node.id}-${latest ? pulse?.n : "stable"}`}
                    node={node}
                    branchId={branch.id}
                    effectLabel={`${resourceLabels[node.key]} +${node.value}`}
                    state={state}
                    disabled={locked}
                    isLatest={latest}
                    isShaking={shakeId === node.id}
                    isTrace={traceNodeIds.has(node.id)}
                    reachCost={hoverNodeId === node.id && !active && !locked ? reach : undefined}
                    canQuickBuy={!active && reach <= remaining}
                    popSide={node.y < height / 2 ? "bottom" : "top"}
                    onActivate={() => onActivate(node.id)}
                    onQuickBuy={() => onQuickBuy(node.id)}
                    onRefund={() => onRefund(node.id)}
                    onShake={() => onRequestShake(node.id)}
                    onHoverKey={onHoverKey}
                    onHoverNode={setHoverNodeId}
                    style={{
                      left: `${node.x - size / 2}px`,
                      top: `${node.y - size / 2}px`,
                      "--tn-size": `${size}px`,
                      "--tn-hue": hue.hue,
                      "--tn-deep": hue.deep,
                    } as CSSProperties}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </section>
  );
}
