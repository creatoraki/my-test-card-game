// ★ 天赋树面板 —— 徽章专属的节点图。
//
// 底层一张 <svg viewBox="0 0 W H"> 画连线: 徽章核心图形(画布中心, 纯视觉)到六条链首
// 各一条「从徽章长出来」的连线, 链内按 requires 逐颗相连。上层是绝对定位的 TalentNode
// 按钮。坐标与 RouteBoard 同一套做法: 全部是设计 px(badge.canvas), 缩放交给 StageCanvas。
//
// 连线三态: is-dim(前置未满足) / is-open(可解锁) / is-active(两端均已激活)。
// 节点五态与交互由 TalentNode 承载, 本组件只负责把「已激活集合 + 剩余点数」换算成
// 每个节点的视觉态 —— 判定函数一律来自 @/data/squadTalents, 不在组件里重写规则。

import type { CSSProperties } from "react";
import {
  branchNodesOf,
  canRefund,
  getNode,
  isUnlocked,
  type SquadBadgeDef,
  type SquadResourceKey,
  type TalentNodeDef,
} from "@/data";
import { cx } from "@/ui/common/cx";
import { TalentNode, type TalentNodeState } from "../TalentNode";
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
  onRefund,
  onHoverKey,
}: TalentTreeProps) {
  const { width, height } = badge.canvas;
  const center = { x: width / 2, y: height / 2 };
  const activeSet = new Set(activated);

  // 链首 = requires 为空的节点; 中心 → 链首的连线状态只看这颗节点。
  const roots = badge.nodes.filter((node) => node.requires.length === 0);

  // 一条连线的状态: 目标节点已激活 → active; 前置满足 → open; 否则 dim。
  function lineStatus(target: TalentNodeDef): "active" | "open" | "dim" {
    if (activeSet.has(target.id)) return "active";
    return isUnlocked(activated, target) ? "open" : "dim";
  }

  return (
    <section className={cx(s["tt"], locked && s["is-locked"])} aria-label="天赋树">
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
          {/* 中心 → 各链首: 「从徽章长出来」。 */}
          {roots.map((node) => (
            <line
              key={`core-${node.id}`}
              className={cx(s["tt-line"], s[`is-${lineStatus(node)}`])}
              x1={center.x}
              y1={center.y}
              x2={node.x}
              y2={node.y}
            />
          ))}
          {/* 链内: 前置节点 → 本节点。 */}
          {badge.nodes.flatMap((node) =>
            node.requires.map((reqId) => {
              const from = getNode(badge, reqId);
              if (!from) return null;
              return (
                <line
                  key={`${reqId}-${node.id}`}
                  className={cx(s["tt-line"], s[`is-${lineStatus(node)}`])}
                  x1={from.x}
                  y1={from.y}
                  x2={node.x}
                  y2={node.y}
                />
              );
            }),
          )}
        </svg>

        {/* ── 徽章核心图形(纯视觉) ── */}
        <div
          className={s["tt-core"]}
          style={{ left: `${center.x - 48}px`, top: `${center.y - 48}px` }}
          aria-hidden
        >
          <BadgeGlyph />
        </div>

        {/* ── 节点层 ── */}
        {badge.branches.flatMap((branch) =>
          branchNodesOf(badge, branch.id).map((node) => {
            const size = NODE_SIZE[node.tier];
            const state = nodeStateOf(badge, node, activated, remaining);
            const latest = pulse?.nodeId === node.id;
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
                popSide={node.y < height / 2 ? "bottom" : "top"}
                onActivate={() => onActivate(node.id)}
                onRefund={() => onRefund(node.id)}
                onShake={() => onRequestShake(node.id)}
                onHoverKey={onHoverKey}
                style={{
                  left: `${node.x - size / 2}px`,
                  top: `${node.y - size / 2}px`,
                  "--tn-size": `${size}px`,
                } as CSSProperties}
              />
            );
          }),
        )}
      </div>
    </section>
  );
}
