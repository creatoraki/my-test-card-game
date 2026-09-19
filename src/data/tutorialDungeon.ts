import type { DungeonRoomPlan } from "../explore/dungeon/types";

export const TUTORIAL_DUNGEON_PLAN: readonly DungeonRoomPlan[] = [
  { kind: "start", curios: ["tutorialArmory", "temporaryRelicCache", "supplyCrate"] },
  {
    kind: "battle",
    curios: ["tutorialModBench", "bondWorkbench"],
    guard: { tier: "t1", encounterId: "tut-t1-intro" },
  },
  { kind: "normal", curios: ["fieldTraining", "cardExchange", "supplyCrate"] },
  {
    kind: "battle",
    curios: ["equipmentCache", "fieldTraining"],
    guard: { tier: "t1", encounterId: "tut-t1-scout" },
  },
  // BOSS 前唯一一次回复; 新手遗物改由储备箱发放。
  { kind: "normal", curios: ["tutorialMedical", "tutorialRelicCache"] },
  {
    kind: "boss",
    curios: ["supplyCrate", "perfectnessWorkbench"],
    guard: { tier: "t2", encounterId: "tut-t2-crew" },
  },
];
