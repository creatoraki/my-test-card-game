import type { ItemDef, ItemRarity, RelicPolarity, RelicSpec } from "@/items/types";

/**
 * 一件遗物的标准书写格式。字段顺序固定为:
 *   id → name → scope → channel(仅渠道限定时写) → desc → 声明式机制(on / every / effects / mods / squadMods / purifyTo)
 * 极性与稀有度不逐条写, 由所在文件调用 defineRelics 时统一给出 —— 文件名即稀有度。
 */
export interface RelicEntry extends Omit<RelicSpec, "polarity"> {
  id: `relic-${string}`;
  name: string;
  /** 只写效果本身, 以「。」结尾。获取途径、是否一次性等信息不写进来。 */
  desc: string;
}

export function defineRelics(
  polarity: RelicPolarity,
  rarity: ItemRarity,
  entries: readonly RelicEntry[],
): ItemDef[] {
  return entries.map(({ id, name, desc, ...spec }) => ({
    id,
    name,
    category: "relic",
    rarity,
    desc,
    maxStack: 1,
    relic: { polarity, ...spec },
  }));
}
