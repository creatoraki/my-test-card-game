import type { CharacterState, NutritionState } from "@/store/townStore";
import { NutritionPodRack } from "./NutritionPodRack";
import { NutritionRoster } from "./NutritionRoster";
import type { NutritionCandidate } from "./useNutritionAssign";
import s from "./NutritionPodsPage.module.css";

interface Props {
  occupants: NutritionState["occupants"];
  characters: Record<string, CharacterState>;
  capacity: number;
  assigned: Record<number, string>;
  candidates: NutritionCandidate[];
  selectedCandidate: NutritionCandidate | null;
  selectedCharId: string | null;
  heal: number;
  level: number;
  onPlace: (slot: number) => void;
  onClear: (slot: number) => void;
  onSelect: (charId: string) => void;
  onOpenTech: () => void;
  ariaHidden: boolean;
}

export function NutritionPodsPage({
  occupants,
  characters,
  capacity,
  assigned,
  candidates,
  selectedCandidate,
  selectedCharId,
  heal,
  level,
  onPlace,
  onClear,
  onSelect,
  onOpenTech,
  ariaHidden,
}: Props) {
  return (
    <section className={s.page} aria-hidden={ariaHidden} {...(ariaHidden ? { inert: "" } : {})}>
      <div className={s.pageHead}>
        <div className={s.subhead}>
          <h2>疗养席位</h2>
          <span>四席位低温疗养舱</span>
        </div>
        <button className={s.upgradeButton} type="button" onClick={onOpenTech}>
          席位扩建 · 疗养舱 Lv.{level} ▸
        </button>
      </div>

      <div className={s.stage}>
        <NutritionPodRack
          occupants={occupants}
          characters={characters}
          capacity={capacity}
          assigned={assigned}
          selectedCandidate={selectedCandidate}
          selectedCharId={selectedCharId}
          heal={heal}
          onPlace={onPlace}
          onClear={onClear}
        />
        <NutritionRoster
          candidates={candidates}
          characters={characters}
          selectedCharId={selectedCharId}
          onSelect={onSelect}
        />
      </div>
    </section>
  );
}
