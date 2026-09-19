import { getItemDef, makeItemStack } from "@/data";
import { BLESSING_RELIC_DEFS, PICNIC_RELIC_DEFS } from "@/data/items/relics";
import { rngPick } from "@/engine/rng";
import { addPendingLoot } from "../session";
import type { ExploreState } from "../types";

export function grantTemporaryRelic(s: ExploreState): string {
  // 只排除本趟已携带或待领取的同款，不因据点收藏齐全而让起始房失去奖励。
  const held = new Set([...s.backpack, ...s.pendingLoot, ...s.pendingPickup].map(stack => stack.itemId));
  const pool = [...BLESSING_RELIC_DEFS.filter(def => def.rarity === "common"), ...PICNIC_RELIC_DEFS]
    .filter(def => !held.has(def.id));
  if (!pool.length) return "本次探索已拥有全部可用的临时祝福";
  const def = rngPick(s, pool);
  addPendingLoot(s, [makeItemStack(def.id, 1, { disposable: true })]);
  return `获得一次性遗物「${getItemDef(def.id).name}」，仅本次探索生效，已放入待拾取框`;
}
