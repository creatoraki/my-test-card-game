import { useMemo, type CSSProperties, type KeyboardEvent } from "react";
import {
  CARD_SHOP_TECH_CANVAS,
  CARD_SHOP_TECHS,
  cardShopTechState,
  type CardShopTech,
  type CardShopTechState,
} from "@/data";
import type { ItemStack } from "@/items/types";
import { cx } from "@/ui/common/cx";
import {
  CARD_SHOP_TECH_CORE,
  CARD_SHOP_TECH_HIT_RADIUS,
  CARD_SHOP_TECH_NODE_RADIUS,
  cardShopTechEdges,
} from "./cardShopTechGeometry";
import { ShelfPlusGlyph, SupplyLoopGlyph } from "./techIcons";
import s from "./CardShopTechTree.module.css";

interface Props {
  doneTechs: string[];
  loot: number;
  storage: ItemStack[];
  selectedId: string | null;
  onSelect: (techId: string) => void;
}

const STATE_LABEL: Record<CardShopTechState, string> = {
  done: "已研究",
  available: "可研究",
  lacking: "材料或积分不足",
  locked: "前置节点未完成",
};

export function CardShopTechTree({ doneTechs, loot, storage, selectedId, onSelect }: Props) {
  const edges = useMemo(() => cardShopTechEdges(), []);
  const states = useMemo(
    () => new Map(CARD_SHOP_TECHS.map((tech) => [tech.id, cardShopTechState(tech, doneTechs, loot, storage)])),
    [doneTechs, loot, storage],
  );

  const edgeState = (targetId: string): "done" | "open" | "dim" => {
    const state = states.get(targetId);
    if (state === "done") return "done";
    if (state === "available" || state === "lacking") return "open";
    return "dim";
  };

  const pressNode = (event: KeyboardEvent<SVGGElement>, tech: CardShopTech) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onSelect(tech.id);
  };

  return (
    <section className={s.tree} aria-label="卡牌商店科技树">
      <div className={s.treeHead}>
        <div>
          <span className={s.kicker}>展柜维护系统</span>
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
          viewBox={`0 0 ${CARD_SHOP_TECH_CANVAS.width} ${CARD_SHOP_TECH_CANVAS.height}`}
          role="group"
          aria-label="展柜扩容与补货链路科技路线"
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
            <circle cx={CARD_SHOP_TECH_CORE.x} cy={CARD_SHOP_TECH_CORE.y} r={56} />
            <circle className={s.coreInner} cx={CARD_SHOP_TECH_CORE.x} cy={CARD_SHOP_TECH_CORE.y} r={42} />
            <text x={CARD_SHOP_TECH_CORE.x} y={CARD_SHOP_TECH_CORE.y - 5}>卡牌</text>
            <text x={CARD_SHOP_TECH_CORE.x} y={CARD_SHOP_TECH_CORE.y + 20}>展柜</text>
          </g>

          {CARD_SHOP_TECHS.map((tech, index) => {
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
                <circle className={s.hit} cx={tech.x} cy={tech.y} r={CARD_SHOP_TECH_HIT_RADIUS} />
                <circle className={s.nodeBody} cx={tech.x} cy={tech.y} r={CARD_SHOP_TECH_NODE_RADIUS} />
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
