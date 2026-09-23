import { getItemDef, SHOP_TECHS, shopTechCost, shopTechState } from "@/data";
import type { ItemStack } from "@/items/types";
import { TechnologyArtwork } from "@/ui/common/techTree/TechnologyArtwork";
import type { TechnologyCore, TechnologyNode } from "@/ui/common/techTree/TechnologyTree";

export const SHOP_TECHNOLOGY_CANVAS = { width: 1000, height: 660 };
export const SHOP_TECHNOLOGY_CORE: TechnologyCore = {
  name: "基础货架", x: 125, y: 320,
  icon: <TechnologyArtwork kind="foundation" />,
};

const NODE_PRESENTATION = {
  "refresh-1": { name: "补货效率一阶", x: 430, y: 170 },
  "refresh-2": { name: "补货效率二阶", x: 780, y: 170 },
  "slot-1": { name: "货架扩容一阶", x: 430, y: 470 },
  "slot-2": { name: "货架扩容二阶", x: 780, y: 470 },
} as const;

/** 商店规则到公共视图的适配层。展示名称使用中文，研究仍传原有科技 id。 */
export function shopTechnologyNodes(done: string[], storage: ItemStack[]): TechnologyNode[] {
  return SHOP_TECHS.map((tech): TechnologyNode => {
    const presentation = NODE_PRESENTATION[tech.id as keyof typeof NODE_PRESENTATION];
    const slot = tech.kind === "slot";
    const second = tech.requires.length > 0;
    const materials = shopTechCost(tech, storage).materials.map((material) => ({
      itemId: material.itemId,
      name: getItemDef(material.itemId).name,
      have: material.have,
      need: material.need,
    }));
    return {
      id: tech.id,
      name: presentation?.name ?? tech.name,
      x: presentation?.x ?? tech.x,
      y: presentation?.y ?? tech.y,
      requires: tech.requires,
      state: shopTechState(tech, done, storage),
      icon: <TechnologyArtwork kind={slot ? "capacity" : "supply"} />,
      category: slot ? "货架科技" : "补货科技",
      description: slot
        ? "扩建商品陈列空间，增加商店货位，让每次补货提供更多商品选择。"
        : "优化补货流程与物流调度，降低刷新货架的积分基价，提升商店补给效率。",
      prerequisite: tech.requires.map((id) => NODE_PRESENTATION[id as keyof typeof NODE_PRESENTATION]?.name ?? id).join("、") || "基础货架",
      effects: slot ? [
        { label: "商店货位数量", value: second ? "七格 → 八格" : "六格 → 七格", symbol: "↑" },
        { label: "可陈列商品", value: "+1 件", symbol: "✦" },
      ] : [
        { label: "刷新积分基价", value: second ? "90 → 80" : "100 → 90", symbol: "↓" },
        { label: "每次刷新基价", value: "减少 10 积分", symbol: "◷" },
      ],
      materials,
      costLabel: `水晶 × ${materials.reduce((sum, material) => sum + material.need, 0)}`,
    };
  }).sort((a, b) => a.y - b.y || a.x - b.x);
}
