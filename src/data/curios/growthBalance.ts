import type { EventChoice, ExploreState } from "@/explore/types";

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

export function growthChoices(s: ExploreState, choices: EventChoice[]): EventChoice[] {
  if (allowsCardRemoval(s)) return choices;
  const available = choices.filter(choice => ![
    ...(choice.effects ?? []), ...(choice.outcomes?.flatMap(outcome => outcome.effects) ?? []),
  ].some(effect => effect.type === "FORGE_REMOVE"));
  return available.length || !choices.length ? available : [{
    id: "leave-unavailable-service", label: "继续探索", desc: "当前难度未开放此服务。", energyDelta: 0, effects: [],
  }];
}
