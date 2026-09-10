import { getItemDef } from "../data";
import type { ItemStack } from "../items/types";
import type { ExploreState } from "./types";
import type { RelicEvent } from "../engine/types";
import { EXPLORE_RULES } from "./rules";
import { EXPLORE_RELIC_BEHAVIORS } from "./relicBehaviors";
import type { NodeEvent } from "./types";

export type ExploreRelicEvent = RelicEvent & { nodeKind?: NodeEvent["kind"] };

/** 只读取背包中的遗物；仓库里的收藏不会影响本场规则。 */
export function relicsInBackpack(s: ExploreState): ItemStack[] {
  return s.backpack.filter((stack) => getItemDef(stack.itemId).category === "relic");
}

/** 探索级遗物在这里分发声明式资源效果与探索行为注册表。 */
export function fireExploreRelic(s: ExploreState, event: ExploreRelicEvent): void {
  for (const stack of relicsInBackpack(s)) {
    const def = getItemDef(stack.itemId);
    const spec = def.relic;
    if (!spec || spec.scope !== "explore") continue;
    const triggers: readonly string[] = spec.on
      ? Array.isArray(spec.on)
        ? spec.on
        : [spec.on]
      : [];
    if (triggers.includes(event.type)) {
      for (const effect of spec.effects ?? []) {
        if (effect.type !== "GAIN_RESOURCE") continue;
        const resource = effect.resource ?? "energy";
        const amount = Math.floor(effect.amount ?? 0);
        if (!amount) continue;
        if (resource === "energy") {
          const before = s.energy;
          s.energy = Math.max(0, Math.min(EXPLORE_RULES.energyMax, before + amount));
          s.stats.energySpent += Math.max(0, before - s.energy);
          s.log.push(`${def.name}：净化粒子 ${amount > 0 ? "+" : ""}${s.energy - before}`);
        } else if (resource === "loot") {
          s.loot = Math.max(0, s.loot + amount);
          s.log.push(`${def.name}：居民积分 ${amount > 0 ? "+" : ""}${amount}`);
        }
      }
    }
    const behavior = EXPLORE_RELIC_BEHAVIORS[stack.itemId]?.[event.type];
    behavior?.({ state: s, stack, event });
  }
}
