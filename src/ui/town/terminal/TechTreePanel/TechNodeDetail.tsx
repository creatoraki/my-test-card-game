import { useState } from "react";
import {
  TECH_BRANCHES,
  TECH_CATEGORIES,
  TECH_NODES,
  getItemDef,
  techLevel,
  techNextCost,
  techNodeCheck,
  techNodeState,
  type TechNodeState,
  type TechTreeState,
} from "@/data";
import type { ItemStack } from "@/items/types";
import ItemTooltip, {
  tooltipPointFromElement,
  type TooltipPoint,
} from "@/ui/common/item/ItemTooltip";
import ItemSlot from "@/ui/common/item/ItemSlot";
import { cx } from "@/ui/common/cx";
import s from "./TechNodeDetail.module.css";

interface Props {
  categoryId: string;
  selectedId: string | null;
  levels: TechTreeState["levels"];
  loot: number;
  storage: ItemStack[];
  onResearch: (nodeId: string) => void;
}

const STATE_TEXT: Record<TechNodeState, string> = {
  maxed: "已满级，效果已生效",
  available: "前置已完成，可以研究",
  lacking: "材料或积分不足",
  locked: "需要先完成前置节点",
};

function effectAtLevel(nodeId: string, level: number, fallback: string): string {
  if (nodeId === "training-points") return `+${level} 训练点`;
  if (nodeId === "scrap-price") return `换金物售价 +${level * 10}%`;
  return fallback;
}

interface HoveredItem {
  stack: ItemStack;
  point: TooltipPoint;
}

export function TechNodeDetail({ categoryId, selectedId, levels, loot, storage, onResearch }: Props) {
  const [hoveredItem, setHoveredItem] = useState<HoveredItem | null>(null);
  const category = TECH_CATEGORIES.find((entry) => entry.id === categoryId);
  const nodes = TECH_NODES.filter((node) => node.categoryId === categoryId);
  const tech = TECH_NODES.find((node) => node.id === selectedId && node.categoryId === categoryId);
  const invested = nodes.reduce((sum, node) => sum + techLevel(levels, node.id), 0);
  const maxLevel = nodes.reduce((sum, node) => sum + node.maxLevel, 0);

  if (!tech || !category) {
    return (
      <aside className={s.detail} aria-label="科技分类概览">
        <span className={s.kicker}>当前分类</span>
        <h3>{category?.name ?? "科技树"}</h3>
        <p className={s.desc}>{category?.desc ?? "选择一个分类开始研究。"}</p>
        <div className={s.overviewGrid}>
          <OverviewItem label="已投入等级" value={`Lv.${invested}`} />
          <OverviewItem label="分类上限" value={`Lv.${maxLevel}`} />
          <OverviewItem label="研究支线" value={`${TECH_BRANCHES.filter((branch) => branch.categoryId === categoryId).length} 条`} />
          <OverviewItem label="科技节点" value={`${nodes.length} 个`} />
        </div>
        <p className={s.empty}>选择中央节点查看下一级效果与研究消耗。</p>
      </aside>
    );
  }

  const level = techLevel(levels, tech.id);
  const nextLevel = Math.min(level + 1, tech.maxLevel);
  const state = techNodeState(tech, levels, loot, storage);
  const cost = techNextCost(tech, levels);
  const check = techNodeCheck(tech, levels, loot, storage);

  return (
    <>
      <aside className={s.detail} aria-label={`${tech.name}详情`}>
        <span className={s.kicker}>{TECH_BRANCHES.find((branch) => branch.id === tech.branchId)?.name ?? "研究支线"}</span>
        <h3>{tech.name}</h3>
        <p className={s.desc}>{tech.desc}</p>

        <div className={s.effect}>
          <span className={s.sectionTitle}>等级效果</span>
          <div className={s.levelFlow}>
            <strong>Lv.{level}</strong>
            <span>→</span>
            <strong>{level >= tech.maxLevel ? "已满级" : `Lv.${nextLevel}`}</strong>
          </div>
          <p>
            {effectAtLevel(tech.id, level, tech.effectPerLevel)}
            {level < tech.maxLevel && ` → ${effectAtLevel(tech.id, nextLevel, tech.effectPerLevel)}`}
          </p>
        </div>

        {cost ? (
          <div className={s.section}>
            <span className={s.sectionTitle}>下一级消耗</span>
            <div className={cx(s.costRow, !check.lootOk && state !== "maxed" && s["is-lacking"])}>
              <span>居民积分</span>
              <strong>{cost.loot}</strong>
            </div>
            <div className={s.materials}>
              {check.materials.map((material) => {
                const stack: ItemStack = {
                  uid: `tech-tree-detail-${tech.id}-${material.itemId}`,
                  itemId: material.itemId,
                  count: Math.max(material.have, 1),
                };
                const lacking = !material.ok && state !== "maxed";
                return (
                  <div
                    key={material.itemId}
                    className={cx(s.material, lacking && s["is-lacking"])}
                    onPointerEnter={(event) => setHoveredItem({ stack, point: tooltipPointFromElement(event.currentTarget) })}
                    onPointerLeave={() => setHoveredItem(null)}
                    onFocus={(event) => setHoveredItem({ stack, point: tooltipPointFromElement(event.currentTarget) })}
                    onBlur={() => setHoveredItem(null)}
                    aria-label={`${getItemDef(material.itemId).name}，持有 ${material.have}，需要 ${material.need}`}
                  >
                    <ItemSlot stack={stack} showName={false} disabled={!material.have} className={s.materialSlot} />
                    <span>×{material.need}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className={s.status} data-state={state}>
          <span className={s.sectionTitle}>节点状态</span>
          <span>{STATE_TEXT[state]}</span>
        </div>
        <button
          className={s.research}
          type="button"
          disabled={state !== "available"}
          onClick={() => onResearch(tech.id)}
        >
          {state === "maxed" ? "已满级" : `研究 Lv.${level} → Lv.${nextLevel}`}
        </button>
      </aside>
      {hoveredItem && <ItemTooltip stack={hoveredItem.stack} point={hoveredItem.point} />}
    </>
  );
}

function OverviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={s.overviewItem}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
