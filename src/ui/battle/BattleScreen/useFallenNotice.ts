import { useEffect, useRef } from "react";
import type { Ally, BattleState } from "@/engine";
import type { DeathPhase } from "@/ui/battle/deathChoreo";
import { showBattleToast } from "@/ui/battle/battleToastStore";

interface Props {
  battle: BattleState | null;
  battleSeq: number;
  phaseOf: (id: string) => DeathPhase;
}

/** 死亡演出走完后播报永久阵亡, 与战斗结算本身保持独立。 */
export function useFallenNotice({ battle, battleSeq, phaseOf }: Props): void {
  const announcedRef = useRef(new Set<string>());

  useEffect(() => {
    announcedRef.current.clear();
  }, [battleSeq]);

  useEffect(() => {
    if (!battle) return;
    for (const id of battle.playerIds) {
      const ally = battle.combatants[id] as Ally;
      if (ally.alive || phaseOf(id) !== "dead" || announcedRef.current.has(ally.charId)) continue;
      announcedRef.current.add(ally.charId);
      showBattleToast(`${ally.name} 已阵亡 · 永久失去这名队员`);
    }
  }, [battle, battleSeq, phaseOf]);
}
