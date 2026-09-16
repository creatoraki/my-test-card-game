// 全局科技树规则 → 公共科技板视图的适配层。
// ★ 只做「数据翻译 + 展示坐标」, 研究规则仍在 data/techTree 与 townStore.researchTech。
import {
  TECH_BRANCHES,
  TECH_NODES,
  branchOf,
  categoryOf,
  getItemDef,
  techLevel,
  techNextCost,
  techNodeCheck,
  techNodeState,
  type TechNodeDef,
  type TechTreeState,
} from "@/data";
import type { ItemStack } from "@/items/types";
import { TechnologyArtwork } from "@/ui/common/techTree/TechnologyArtwork";
import type { TechnologyCore, TechnologyNode } from "@/ui/common/techTree/TechnologyTree";

export const RESEARCH_TECHNOLOGY_CANVAS = { width: 980, height: 540 };

/** 每个分类一个核心桩, 名称取分类下第一条分支。 */
export function researchTechnologyCore(categoryId: string): TechnologyCore {
  const branch = TECH_BRANCHES.find((entry) => entry.categoryId === categoryId);
  return {
    name: branch?.name ?? categoryOf(categoryId)?.name ?? "研究核心",
    x: 150,
    y: 250,
    icon: <TechnologyArtwork kind="foundation" />,
  };
}

/** 节点展示坐标: 每分类节点不多, 按加入顺序横向铺开。 */
const NODE_ORIGIN = { x: 520, y: 250 };
const NODE_STEP = { x: 350, y: 230 };

const NODE_ARTWORK: Record<string, "supply" | "capacity"> = {
  "training-points": "supply",
  "scrap-price": "capacity",
};

function stateLabelOf(node: TechNodeDef, level: number, state: ReturnType<typeof techNodeState>): string {
  if (state === "maxed") return "已满级";
  if (state === "locked") return "前置未完成";
  if (state === "lacking") return "资源不足";
  return level > 0 ? `可升至 Lv.${level + 1}` : "可研究";
}

function stateDescriptionOf(node: TechNodeDef, level: number, state: ReturnType<typeof techNodeState>): string {
  switch (state) {
    case "maxed": return `已达上限 Lv.${node.maxLevel}，该节点效果全部生效。`;
    case "locked": return "完成前置节点后开放此节点。";
    case "lacking": return "居民积分或水晶不足，补齐后即可研究下一级。";
    default: return `投入资源即可把该节点提升到 Lv.${level + 1}。`;
  }
}

/** 把一个分类下的科技节点翻译成公共科技板节点。 */
export function researchTechnologyNodes(
  categoryId: string,
  levels: TechTreeState["levels"],
  loot: number,
  storage: ItemStack[],
): TechnologyNode[] {
  return TECH_NODES.filter((node) => node.categoryId === categoryId).map((node, index): TechnologyNode => {
    const level = techLevel(levels, node.id);
    const state = techNodeState(node, levels, loot, storage);
    const check = techNodeCheck(node, levels, loot, storage);
    const next = techNextCost(node, levels);
    const materials = check.materials.map((material) => ({
      itemId: material.itemId,
      name: getItemDef(material.itemId).name,
      have: material.have,
      need: material.need,
    }));
    const prerequisite = node.requires
      .map((id) => TECH_NODES.find((entry) => entry.id === id)?.name ?? id)
      .join("、") || (branchOf(node.branchId)?.name ?? "研究核心");
    return {
      id: node.id,
      name: node.name,
      x: NODE_ORIGIN.x + Math.floor(index / 2) * NODE_STEP.x,
      y: NODE_ORIGIN.y + (index % 2 === 0 ? 0 : NODE_STEP.y),
      requires: node.requires,
      // 公共科技板的四态: 满级记为已解锁, 其余同名。
      state: state === "maxed" ? "done" : state,
      icon: <TechnologyArtwork kind={NODE_ARTWORK[node.id] ?? "supply"} />,
      category: branchOf(node.branchId)?.name ?? "研究分支",
      description: node.desc,
      prerequisite,
      effects: [
        { label: "每级效果", value: node.effectPerLevel, symbol: "↑" },
        { label: "等级上限", value: `Lv.${node.maxLevel}`, symbol: "✦" },
      ],
      materials,
      costLabel: next
        ? [`积分 ${next.loot.toLocaleString()}`, ...next.materials.map((material) => `${getItemDef(material.itemId).name} × ${material.count}`)].join(" ＋ ")
        : "无需继续投入",
      level,
      maxLevel: node.maxLevel,
      stateLabel: stateLabelOf(node, level, state),
      stateDescription: stateDescriptionOf(node, level, state),
      actionLabel: state === "maxed"
        ? "已满级"
        : state === "locked"
          ? "前置未完成"
          : state === "lacking"
            ? "资源不足"
            : `研究 Lv.${level + 1}`,
    };
  });
}

/** 分类页签上的「已投入等级」角标。 */
export function researchCategoryLevel(categoryId: string, levels: TechTreeState["levels"]): number {
  return TECH_NODES.filter((node) => node.categoryId === categoryId)
    .reduce((sum, node) => sum + techLevel(levels, node.id), 0);
}
