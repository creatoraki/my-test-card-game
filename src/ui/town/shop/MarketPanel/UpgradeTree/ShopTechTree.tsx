import { useMemo, type CSSProperties, type KeyboardEvent } from "react";
import {
  SHOP_TECH_CANVAS,
  SHOP_TECHS,
  shopTechState,
  type ShopTech,
  type ShopTechState,
} from "@/data";
import type { ItemStack } from "@/items/types";
import { cx } from "@/ui/common/cx";
import {
  SHOP_TECH_CORE,
  SHOP_TECH_HIT_RADIUS,
  SHOP_TECH_NODE_RADIUS,
  shopTechEdges,
} from "./shopTechGeometry";
import { ShelfPlusGlyph, SupplyLoopGlyph } from "./techIcons";
import s from "./ShopTechTree.module.css";

interface Props {
  doneTechs: string[];
  loot: number;
  storage: ItemStack[];
  selectedId: string | null;
  onSelect: (techId: string) => void;
}

const STATE_LABEL: Record<ShopTechState, string> = {
  done: "已研究",
  available: "可研究",
  lacking: "材料或积分不足",
  locked: "前置节点未完成",
};

export function ShopTechTree({ doneTechs, loot, storage, selectedId, onSelect }: Props) {
  const edges = useMemo(() => shopTechEdges(), []);
  const states = useMemo(
    () => new Map(SHOP_TECHS.map((tech) => [tech.id, shopTechState(tech, doneTechs, loot, storage)])),
    [doneTechs, loot, storage],
  );

  const edgeState = (targetId: string): "done" | "open" | "dim" => {
    const state = states.get(targetId);
    if (state === "done") return "done";
    if (state === "available" || state === "lacking") return "open";
    return "dim";
  };

  const pressNode = (event: KeyboardEvent<SVGGElement>, tech: ShopTech) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onSelect(tech.id);
  };

  return (
    <section className={s.tree} aria-label="商店科技树">
      <div className={s.treeHead}>
        <div>
          <span className={s.kicker}>货架维护系统</span>
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
          viewBox={`0 0 ${SHOP_TECH_CANVAS.width} ${SHOP_TECH_CANVAS.height}`}
          role="group"
          aria-label="货架扩容与补货链路科技路线"
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
            <circle cx={SHOP_TECH_CORE.x} cy={SHOP_TECH_CORE.y} r={56} />
            <circle className={s.coreInner} cx={SHOP_TECH_CORE.x} cy={SHOP_TECH_CORE.y} r={42} />
            <text x={SHOP_TECH_CORE.x} y={SHOP_TECH_CORE.y - 5}>商品</text>
            <text x={SHOP_TECH_CORE.x} y={SHOP_TECH_CORE.y + 20}>货架</text>
          </g>

          {SHOP_TECHS.map((tech, index) => {
            const state = states.get(tech.id) ?? "locked";
            const Glyph = tech.kind === "slot" ? ShelfPlusGlyph : SupplyLoopGlyph;
            const nodeStyle = {
              "--node-delay": `${index * 40}ms`,
              "--node-final-opacity": state === "locked" ? "0.48" : "1",
            } as CSSProperties;
            return (
              <g
                key={tech.id}
                className={cx(s.node, s[`is-${state}`], s[`is-${tech.kind}`], selectedId === tech.id && s["is-selected"])}
                style={nodeStyle}
                role="button"
                tabIndex={0}
                aria-label={`${tech.name}，${STATE_LABEL[state]}`}
                aria-pressed={selectedId === tech.id}
                onClick={() => onSelect(tech.id)}
                onKeyDown={(event) => pressNode(event, tech)}
              >
                <circle className={s.hit} cx={tech.x} cy={tech.y} r={SHOP_TECH_HIT_RADIUS} />
                <circle className={s.nodeBody} cx={tech.x} cy={tech.y} r={SHOP_TECH_NODE_RADIUS} />
                <circle className={s.nodeCore} cx={tech.x} cy={tech.y} r={25} />
                <g className={s.icon} transform={`translate(${tech.x - 24} ${tech.y - 24})`}>
                  <Glyph />
                </g>
                <text className={s.nodeLabel} x={tech.x} y={tech.y + 70}>{tech.name}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
