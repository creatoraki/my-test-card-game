import type { EncounterModifier } from "@/engine/types";
import { mapHasDifficulty, type MapDifficulty } from "./mapDifficulty";

/** 普通保留敌人原始属性，困难与深渊有明确的战斗强度差。 */
const COMBAT_SCALE: Record<MapDifficulty, Required<Pick<EncounterModifier, "hpMultiplier" | "attackMultiplier">>> = {
  normal: { hpMultiplier: 1, attackMultiplier: 1 },
  hard: { hpMultiplier: 1.3, attackMultiplier: 1.2 },
  abyss: { hpMultiplier: 1.6, attackMultiplier: 1.4 },
};

export function mapCombatModifier(mapId: string, difficulty: MapDifficulty): EncounterModifier {
  return { ...COMBAT_SCALE[mapHasDifficulty(mapId) ? difficulty : "normal"] };
}
