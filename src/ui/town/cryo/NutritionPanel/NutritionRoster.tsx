import type { CharacterState } from "@/store/townStore";
import { NutritionRosterRow } from "./NutritionRosterRow";
import type { NutritionCandidate } from "./useNutritionAssign";
import s from "./NutritionRoster.module.css";

interface Props {
  candidates: NutritionCandidate[];
  characters: Record<string, CharacterState>;
  selectedCharId: string | null;
  onSelect: (charId: string) => void;
}

export function NutritionRoster({ candidates, characters, selectedCharId, onSelect }: Props) {
  return (
    <aside className={s.roster} aria-label="待疗养队员">
      <div className={s.head}>
        <div>
          <span className={s.kicker}>疗养名单</span>
          <h3>待疗养队员</h3>
        </div>
        <strong>{candidates.length} 人</strong>
      </div>
      <div className={s.list}>
        {candidates.length ? candidates.map((candidate) => (
          <NutritionRosterRow
            key={candidate.charId}
            candidate={candidate}
            character={characters[candidate.charId]}
            selected={selectedCharId === candidate.charId}
            onSelect={() => onSelect(candidate.charId)}
          />
        )) : <div className={s.empty}>目前没有待疗养队员</div>}
      </div>
    </aside>
  );
}
