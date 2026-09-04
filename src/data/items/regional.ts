import type { ItemDef } from "../../items/types";

// 地区材料三者同为 fine 是刻意的: 档位差别由来源与用途表达, 不由稀有度表达。
// 不经过 withBuyValue() 与水晶使用同一套隔离手法, 因此不上商店货架且不进入回收台。
export type RegionalTier = "low" | "mid" | "boss";

export const DEFAULT_REGION_ID = "neon-city";

export interface RegionalMaterialDef extends ItemDef {
  regionId: string;
  regionTier: RegionalTier;
}

export const REGIONAL_MATERIAL_DEFS: RegionalMaterialDef[] = [
  {
    id: "neon-tube",
    name: "霓虹灯管",
    category: "material",
    rarity: "fine",
    desc: "旧城灯牌上拆下的完整灯管，仍能稳定点亮，用于装备的发光与校准部件。",
    maxStack: 1,
    icon: "material",
    regionId: DEFAULT_REGION_ID,
    regionTier: "low",
  },
  {
    id: "compacted-block",
    name: "压缩废块",
    category: "material",
    rarity: "fine",
    desc: "清运机械压制的高密度方块，内部混着未被识别的完整元件。",
    maxStack: 1,
    icon: "material",
    regionId: DEFAULT_REGION_ID,
    regionTier: "mid",
  },
  {
    id: "salvage-core",
    name: "拾荒核心",
    category: "material",
    rarity: "fine",
    desc: "大型清运机械的分拣决策核心，能重新判定一件装备的取值。",
    maxStack: 1,
    icon: "material",
    regionId: DEFAULT_REGION_ID,
    regionTier: "boss",
  },
];

/** 配方、掉落表和 UI 统一从地区与档位反查材料, 不在调用点硬写 id。 */
export function regionalMaterial(regionId: string, tier: RegionalTier): RegionalMaterialDef {
  const def = REGIONAL_MATERIAL_DEFS.find(
    (material) => material.regionId === regionId && material.regionTier === tier,
  );
  if (!def) throw new Error(`未知地区材料: ${regionId}/${tier}`);
  return def;
}

/** 未标注归属的产出物首版统一回落到默认地区。 */
export function itemRegionId(def: ItemDef): string {
  return def.regionId ?? DEFAULT_REGION_ID;
}

/** 按物品 id 反查档位, 供同稀有度材料的图标兜底区分形状。 */
export function regionalTierOf(itemId: string): RegionalTier | undefined {
  return REGIONAL_MATERIAL_DEFS.find((def) => def.id === itemId)?.regionTier;
}
