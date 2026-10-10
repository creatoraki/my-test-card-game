// ============================================================================
// 月光传送盆投放 —— 每张随机地图按概率放一对，两座分在不同房间且尽量相隔够远。
// 起点房与首领房不放；没有满足最小距离的房间对时，退而取距离最远的几对。
// ============================================================================

import { WAYSTONE_RULES } from "@/data/curios/rules/serviceBalance";
import { rngFloat, rngPick } from "@/engine/core/rng";
import type { CurioKind } from "../corridor/types";
import type { ExploreState } from "../types";
import type { RoomNode } from "./types";

/** 从 fromId 出发到其余房间的最短步数。 */
function distancesFrom(rooms: Record<string, RoomNode>, fromId: string): Record<string, number> {
  const dist: Record<string, number> = { [fromId]: 0 };
  const queue = [fromId];
  while (queue.length) {
    const id = queue.shift() as string;
    for (const next of Object.values(rooms[id]?.exits ?? {})) {
      if (next in dist) continue;
      dist[next] = dist[id] + 1;
      queue.push(next);
    }
  }
  return dist;
}

export function placeWaystones(
  s: ExploreState,
  rooms: Record<string, RoomNode>,
  order: string[],
  plan: Record<string, CurioKind[]>,
): void {
  if (rngFloat(s) >= WAYSTONE_RULES.spawnChance) return;
  const candidates = order.filter((id) => rooms[id].kind !== "start" && rooms[id].kind !== "boss");
  const pairs: { a: string; b: string; d: number }[] = [];
  for (const [index, a] of candidates.entries()) {
    const dist = distancesFrom(rooms, a);
    for (const b of candidates.slice(index + 1)) {
      if (dist[b] !== undefined) pairs.push({ a, b, d: dist[b] });
    }
  }
  if (!pairs.length) return;
  const far = pairs.filter((pair) => pair.d >= WAYSTONE_RULES.minDistance);
  const longest = Math.max(...pairs.map((pair) => pair.d));
  const pool = far.length ? far : pairs.filter((pair) => pair.d === longest);
  const pair = rngPick(s, pool);
  plan[pair.a].push("waystone");
  plan[pair.b].push("waystone");
}
