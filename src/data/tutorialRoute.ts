import type { RouteBoardPlan } from "../explore/types";

export const TUTORIAL_ROUND_PLANS: readonly RouteBoardPlan[] = [
  {
    laneCount: 1,
    revealMs: 320,
    bridges: [[], []],
    nodes: [["tut-equip-locker"], ["tut-module-bench"]],
  },
  {
    laneCount: 2,
    bridges: [[], [{ row: 1, leftLane: 0 }]],
    nodes: [
      ["tut-heal-station", "tut-supply-crate"],
      ["tut-trade-terminal", "tut-hazard-vent"],
    ],
  },
  {
    laneCount: 3,
    bridges: [
      [{ row: 1, leftLane: 0 }],
      [{ row: 2, leftLane: 1 }],
      [
        { row: 0, leftLane: 0 },
        { row: 2, leftLane: 1 },
      ],
    ],
    nodes: [
      ["tut-energy-tap", "tut-scrap-pile", "tut-empty-corridor"],
      ["tut-exp-console", "tut-medbay", "tut-hazard-duct"],
      ["tut-forge-bench", "tut-market", "tut-battle-drone"],
    ],
  },
];
