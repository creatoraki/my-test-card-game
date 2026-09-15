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
  { kind: "normal", curios: ["tutorialMedical", "sink"] },
  {
    kind: "boss",
    curios: ["repairPod"],
    guard: { tier: "t2", encounterId: "tut-t2-crew" },
  },
];
