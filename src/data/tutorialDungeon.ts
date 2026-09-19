import type { DungeonRoomPlan } from "../explore/dungeon/types";

export const TUTORIAL_DUNGEON_PLAN: readonly DungeonRoomPlan[] = [
  { kind: "start", curios: ["tutorialArmory"] },
  {
    kind: "battle",
    curios: ["tutorialModBench"],
    guard: { tier: "t1", encounterId: "tut-t1-intro" },
  },
  { kind: "normal", curios: ["tutorialForge", "safe", "crystalVein"] },
  {
    kind: "battle",
    curios: ["compactor"],
    guard: { tier: "t1", encounterId: "tut-t1-scout" },
  },
  // BOSS 前唯一一次回复; 新手遗物改由储备箱发放。
  { kind: "normal", curios: ["tutorialMedical", "tutorialRelicCache"] },
  {
    kind: "boss",
    curios: ["supplyCrate"],
    guard: { tier: "t2", encounterId: "tut-t2-crew" },
  },
];
