import { useMemo, type KeyboardEvent } from "react";
import {
  NUTRITION_TECH_CANVAS,
  NUTRITION_TECHS,
  nutritionTechState,
  type NutritionTech,
  type NutritionTechState,
} from "@/data";
import type { ItemStack } from "@/items/types";
import { cx } from "@/ui/common/cx";
import {
  NUTRITION_TECH_CORE,
  NUTRITION_TECH_HIT_RADIUS,
  NUTRITION_TECH_NODE_RADIUS,
  nutritionTechEdges,
} from "./techTreeGeometry";
import s from "./NutritionTechTree.module.css";

interface Props {
  doneTechs: string[];
  loot: number;
  storage: ItemStack[];
  selectedId: string | null;
  onSelect: (techId: string) => void;
}

const STATE_LABEL: Record<NutritionTechState, string> = {
  done: "已研究",
  available: "可研究",
  lacking: "材料或积分不足",
  locked: "前置节点未完成",
};

export function NutritionTechTree({ doneTechs, loot, storage, selectedId, onSelect }: Props) {
  const edges = useMemo(() => nutritionTechEdges(), []);
  const states = useMemo(
    () => new Map(NUTRITION_TECHS.map((tech) => [tech.id, nutritionTechState(tech, doneTechs, loot, storage)])),
    [doneTechs, loot, storage],
  );

  const edgeState = (targetId: string): "done" | "open" | "dim" => {
    const state = states.get(targetId);
    if (state === "done") return "done";
    if (state === "available" || state === "lacking") return "open";
    return "dim";
  };

  const pressNode = (event: KeyboardEvent<SVGGElement>, tech: NutritionTech) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onSelect(tech.id);
  };

  return (
    <section className={s.tree} aria-label="疗养舱科技树">
      <div className={s.treeHead}>
        <div>
          <span className={s.kicker}>疗养液循环系统</span>
          <h3>科技路线</h3>
        </div>
        <div className={s.legend} aria-label="科技节点状态">
          <span><i className={s.legendDone} />已研究</span>
          <span><i className={s.legendOpen} />可研究</span>
          <span><i className={s.legendDim} />未解锁</span>
        </div>
      </div>
      <div className={s.stage}>
        <svg
          className={s.svg}
          viewBox={`0 0 ${NUTRITION_TECH_CANVAS.width} ${NUTRITION_TECH_CANVAS.height}`}
          role="group"
          aria-label="席位扩建与疗养液配比科技路线"
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
            <circle cx={NUTRITION_TECH_CORE.x} cy={NUTRITION_TECH_CORE.y} r={56} />
            <circle className={s.coreInner} cx={NUTRITION_TECH_CORE.x} cy={NUTRITION_TECH_CORE.y} r={42} />
            <text x={NUTRITION_TECH_CORE.x} y={NUTRITION_TECH_CORE.y - 5}>疗养舱</text>
            <text x={NUTRITION_TECH_CORE.x} y={NUTRITION_TECH_CORE.y + 20}>核心</text>
          </g>
          {NUTRITION_TECHS.map((tech) => {
            const state = states.get(tech.id) ?? "locked";
            return (
              <g
                key={tech.id}
                className={cx(s.node, s[`is-${state}`], s[`is-${tech.kind}`], selectedId === tech.id && s["is-selected"])}
                role="button"
                tabIndex={0}
                aria-label={`${tech.name}, ${STATE_LABEL[state]}`}
                aria-pressed={selectedId === tech.id}
                onClick={() => onSelect(tech.id)}
                onKeyDown={(event) => pressNode(event, tech)}
              >
                <circle className={s.hit} cx={tech.x} cy={tech.y} r={NUTRITION_TECH_HIT_RADIUS} />
                <circle className={s.nodeBody} cx={tech.x} cy={tech.y} r={NUTRITION_TECH_NODE_RADIUS} />
                <circle className={s.nodeCore} cx={tech.x} cy={tech.y} r={22} />
                <text className={s.icon} x={tech.x} y={tech.y + 8}>{tech.kind === "capacity" ? "＋" : "≈"}</text>
                <text className={s.nodeLabel} x={tech.x} y={tech.y + 70}>{tech.name}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
