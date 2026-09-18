// 疗养舱科技 → 公共科技板(TechnologyBoard)的适配层, 与商店 shopTechnologyView 同构。
// 规则仍读 data/nutritionPod.ts; 这里只负责展示坐标、图标与文案。
import { getItemDef, NUTRITION_TECHS, nutritionTechCost, nutritionTechState } from "@/data";
import type { ItemStack } from "@/items/types";
import { TechnologyArtwork } from "@/ui/common/techTree/TechnologyArtwork";
import type { TechnologyCore, TechnologyNode } from "@/ui/common/techTree/TechnologyTree";

export const NUTRITION_TECHNOLOGY_CANVAS = { width: 1000, height: 660 };
export const NUTRITION_TECHNOLOGY_CORE: TechnologyCore = {
  name: "基础疗养舱", x: 125, y: 320,
  icon: <TechnologyArtwork kind="foundation" />,
};

/** 三阶横向排开: 上排席位扩建, 下排疗养液配比。 */
const TIER_X = [360, 600, 840];
const ROW_Y = { capacity: 170, potency: 470 } as const;

const techName = (id: string) => NUTRITION_TECHS.find((tech) => tech.id === id)?.name ?? id;

/** 研究阶数 = 前置链长度, 决定节点落在第几列。 */
function tierOf(id: string, depth = 0): number {
  const tech = NUTRITION_TECHS.find((item) => item.id === id);
  if (!tech || !tech.requires.length) return depth;
  return tierOf(tech.requires[0], depth + 1);
}

export function nutritionTechnologyNodes(done: string[], storage: ItemStack[]): TechnologyNode[] {
  return NUTRITION_TECHS.map((tech): TechnologyNode => {
    const capacity = tech.kind === "capacity";
    const materials = nutritionTechCost(tech, storage).materials.map((material) => ({
      itemId: material.itemId,
      name: getItemDef(material.itemId).name,
      have: material.have,
      need: material.need,
    }));
    return {
      id: tech.id,
      name: tech.name,
      x: TIER_X[Math.min(tierOf(tech.id), TIER_X.length - 1)],
      y: ROW_Y[tech.kind],
      requires: tech.requires,
      state: nutritionTechState(tech, done, storage),
      icon: <TechnologyArtwork kind={capacity ? "capacity" : "supply"} />,
      category: capacity ? "席位科技" : "疗养液科技",
      description: capacity
        ? "扩建低温疗养舱位，让更多队员能在同一日接受体力疗养。"
        : "优化疗养液配比，提高每次疗养恢复的体力上限。",
      prerequisite: tech.requires.map(techName).join("、") || "基础疗养舱",
      effects: [
        {
          label: capacity ? "疗养席位" : "单次治疗",
          value: tech.desc.replace(/^(席位|单次治疗)\s*/, ""),
          symbol: "↑",
        },
      ],
      materials,
      costLabel: `水晶 × ${materials.reduce((sum, material) => sum + material.need, 0)}`,
    };
  }).sort((a, b) => a.y - b.y || a.x - b.x);
}
