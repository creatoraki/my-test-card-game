import type { DungeonRoomPlan } from "../explore/dungeon/types";

// 新手关是演示性质: 每房 1-2 个交互物, 各演示一种核心交互, 不堆奖励。
export const TUTORIAL_DUNGEON_PLAN: readonly DungeonRoomPlan[] = [
  { kind: "start", curios: ["tutorialArmory", "temporaryRelicCache"] },
  {
    kind: "battle",
    curios: ["tutorialModBench"],
    guard: { tier: "t1", encounterId: "tut-t1-intro" },
  },
  { kind: "normal", curios: ["fieldTraining"] },
  {
    kind: "battle",
    curios: ["supplyCrate"],
    guard: { tier: "t1", encounterId: "tut-t1-scout" },
  },
  // BOSS 前唯一一次回复; 新手遗物改由储备箱发放。
  { kind: "normal", curios: ["tutorialMedical", "tutorialRelicCache"] },
  {
    kind: "boss",
    curios: ["cashBox"],
    guard: { tier: "t2", encounterId: "tut-t2-crew" },
  },
];
