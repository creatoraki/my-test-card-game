import type { DungeonRoomPlan } from "../explore/dungeon/types";

export const TUTORIAL_DUNGEON_PLAN: readonly DungeonRoomPlan[] = [
  { kind: "start", curios: ["dispatch", "tutorialArmory"] },
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
  { kind: "boss", curios: ["repairPod"] },
];
