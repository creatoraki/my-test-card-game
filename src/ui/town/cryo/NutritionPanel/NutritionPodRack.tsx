import { NUTRITION_POD_MAX } from "@/data";
import type { CharacterState, NutritionState } from "@/store/townStore";
import { NutritionPod } from "./NutritionPod";
import type { NutritionCandidate } from "./useNutritionAssign";
import s from "./NutritionPodRack.module.css";

interface Props {
  occupants: NutritionState["occupants"];
  characters: Record<string, CharacterState>;
  capacity: number;
  assigned: Record<number, string>;
  selectedCandidate: NutritionCandidate | null;
  selectedCharId: string | null;
  heal: number;
  onPlace: (slot: number) => void;
  onClear: (slot: number) => void;
}

export function NutritionPodRack({
  occupants,
  characters,
  capacity,
  assigned,
  selectedCandidate,
  selectedCharId,
  heal,
  onPlace,
  onClear,
}: Props) {
  return (
    <div className={s.rack} aria-label="疗养舱席位">
      {Array.from({ length: NUTRITION_POD_MAX }, (_, index) => {
        const occupant = occupants.find((entry) => entry.slot === index);
        return (
          <NutritionPod
            key={index}
            index={index}
            occupant={occupant}
            characterState={occupant ? characters[occupant.charId] : undefined}
            pendingCharId={assigned[index]}
            pendingCharacterState={assigned[index] ? characters[assigned[index]] : undefined}
            unlocked={index < capacity}
            selectedCandidate={selectedCandidate}
            selected={selectedCharId === assigned[index]}
            heal={heal}
            onPlace={onPlace}
            onClear={onClear}
          />
        );
      })}
    </div>
  );
}
