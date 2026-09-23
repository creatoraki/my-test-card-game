import type { ExploreState } from "@/explore/types";

/** 食品可以混付；服务只影响获取门槛，不改变装备品质与完美度分布。 */
export const GROWTH_BALANCE = {
  trainingExp: 60,
  drawFood: 1,
  bondFood: 1,
  replaceFood: 3,
  perfectnessFood: 4,
} as const;

export function allowsCardRemoval(s: Pick<ExploreState, "mapId" | "difficulty">): boolean {
  return s.mapId !== "tutorial" && (s.difficulty === "hard" || s.difficulty === "abyss");
}
