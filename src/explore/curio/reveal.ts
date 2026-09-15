import type { ExploreState } from "../types";

export function revealDungeon(s: ExploreState, threats: boolean): void {
  if (!s.dungeon) return;
  s.dungeon.layoutKnown = true;
  if (threats) s.dungeon.threatsKnown = true;
  for (const room of Object.values(s.dungeon.rooms)) room.revealed = true;
}
