import { rngPick, shuffle } from "@/engine/core/rng";
import type { ExploreState } from "../types";
import type { NearMapVariant, RoomNode } from "./types";

/** 把一组近景随机分配到房间；房间足够时首轮覆盖全部变体，不足时随机选取，额外房间继续随机抽取。 */
export function assignNearMapVariants(
  state: ExploreState,
  rooms: Record<string, RoomNode>,
  order: readonly string[],
  availableVariants: readonly NearMapVariant[],
): void {
  if (!order.length || !availableVariants.length) return;

  const randomizedRooms = shuffle(state, [...order]);
  const variants = shuffle<NearMapVariant>(state, [...availableVariants]);
  for (const [index, id] of randomizedRooms.entries()) {
    rooms[id].nearMapVariant = variants[index] ?? rngPick(state, variants);
  }
}
