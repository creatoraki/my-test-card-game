import { useMemo, type KeyboardEvent } from "react";
import {
  TECH_NODES,
  TECH_TREE_CANVAS,
  techLevel,
  techNodeState,
  type TechNodeDef,
  type TechNodeState,
  type TechTreeState,
} from "@/data";
import type { ItemStack } from "@/items/types";
import { cx } from "@/ui/common/cx";
import {
  TECH_TREE_CORE,
  TECH_TREE_HIT_RADIUS,
  TECH_TREE_LEVEL_RADIUS,
  TECH_TREE_NODE_RADIUS,
  techTreeEdges,
} from "./techTreeGeometry";
import s from "./TechTreeGraph.module.css";

interface Props {
  categoryId: string;
  levels: TechTreeState["levels"];
  loot: number;
  storage: ItemStack[];
  selectedId: string | null;
  onSelect: (nodeId: string) => void;
}

const STATE_LABEL: Record<TechNodeState, string> = {
  maxed: "已满级",
  available: "可研究",
  lacking: "材料或积分不足",
  locked: "前置节点未完成",
};

function iconOf(node: TechNodeDef): string {
  return node.id === "training-points" ? "＋" : "◈";
}

export function TechTreeGraph({ categoryId, levels, loot, storage, selectedId, onSelect }: Props) {
  const nodes = useMemo(
    () => TECH_NODES.filter((node) => node.categoryId === categoryId),
    [categoryId],
  );
  const edges = useMemo(() => techTreeEdges(categoryId), [categoryId]);
  const states = useMemo(
    () => new Map(nodes.map((node) => [node.id, techNodeState(node, levels, loot, storage)])),
    [levels, loot, nodes, storage],
  );

  const edgeState = (targetId: string): "done" | "open" | "dim" => {
    const state = states.get(targetId);
    if (state === "maxed") return "done";
    if (state === "available" || state === "lacking") return "open";
    return "dim";
  };

  const pressNode = (event: KeyboardEvent<SVGGElement>, node: TechNodeDef) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onSelect(node.id);
  };

  return (
    <section className={s.graph} aria-label="科技节点图">
      <div className={s.graphHead}>
        <div>
          <span className={s.kicker}>全局研究网络</span>
          <h3>科技路线</h3>
        </div>
        <div className={s.legend} aria-label="科技节点状态">
          <span><i className={s.legendMaxed} />已满级</span>
          <span><i className={s.legendAvailable} />可研究</span>
          <span><i className={s.legendLacking} />资源不足</span>
          <span><i className={s.legendLocked} />未解锁</span>
        </div>
      </div>
      <div className={s.stage}>
        <svg
          className={s.svg}
          viewBox={`0 0 ${TECH_TREE_CANVAS.width} ${TECH_TREE_CANVAS.height}`}
          role="group"
          aria-label="当前分类的科技路线"
        >
          <g className={s.edges} aria-hidden>
            {edges.map((edge) => (
              <line
                key={edge.id}
                className={cx(s.line, s[`is-${edgeState(edge.targetId)}`])}
                x1={edge.from.x}
                y1={edge.from.y}
                x2={edge.to.x}
                y2={edge.to.y}
              />
            ))}
          </g>
          <g className={s.core} aria-hidden>
            <circle cx={TECH_TREE_CORE.x} cy={TECH_TREE_CORE.y} r={56} />
            <circle className={s.coreInner} cx={TECH_TREE_CORE.x} cy={TECH_TREE_CORE.y} r={42} />
            <text x={TECH_TREE_CORE.x} y={TECH_TREE_CORE.y - 5}>研究中心</text>
            <text x={TECH_TREE_CORE.x} y={TECH_TREE_CORE.y + 20}>核心</text>
          </g>
          {nodes.map((node) => {
            const state = states.get(node.id) ?? "locked";
            const level = techLevel(levels, node.id);
            const progress = Math.min(100, (level / node.maxLevel) * 100);
            return (
              <g
                key={node.id}
                className={cx(s.node, s[`is-${state}`], selectedId === node.id && s["is-selected"])}
                role="button"
                tabIndex={0}
                aria-label={`${node.name}，${STATE_LABEL[state]}，等级 ${level}/${node.maxLevel}`}
                aria-pressed={selectedId === node.id}
                onClick={() => onSelect(node.id)}
                onKeyDown={(event) => pressNode(event, node)}
              >
                <circle className={s.hit} cx={node.x} cy={node.y} r={TECH_TREE_HIT_RADIUS} />
                <circle className={s.levelTrack} cx={node.x} cy={node.y} r={TECH_TREE_LEVEL_RADIUS} />
                <circle
                  className={s.levelProgress}
                  cx={node.x}
                  cy={node.y}
                  r={TECH_TREE_LEVEL_RADIUS}
                  pathLength={100}
                  strokeDasharray="100"
                  strokeDashoffset={100 - progress}
                />
                <circle className={s.nodeBody} cx={node.x} cy={node.y} r={TECH_TREE_NODE_RADIUS} />
                <circle className={s.nodeCore} cx={node.x} cy={node.y} r={24} />
                <text className={s.icon} x={node.x} y={node.y + 8}>{iconOf(node)}</text>
                <text className={s.levelLabel} x={node.x} y={node.y + 68}>Lv.{level}/{node.maxLevel}</text>
                <text className={s.nodeLabel} x={node.x} y={node.y + 94}>{node.name}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
