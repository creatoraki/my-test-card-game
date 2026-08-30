import { useMemo } from "react";
import { getCharacter } from "@/data";
import { cardCost, renderCardText, statOf, type BattleState, type Card, type CardTextStats } from "@/engine";
import { useBattleStore } from "@/store/battleStore";
import { deriveStats, useTownStore } from "@/store/townStore";

function battleStatOfOwner(
  battle: BattleState | null,
  ownerCharId: string,
  key: "attack" | "healPower" | "lowCostMastery" | "highCostMastery",
): number {
  if (!battle) return -1;
  for (const id of battle.playerIds) {
    const combatant = battle.combatants[id];
    if (combatant?.team === "player" && combatant.charId === ownerCharId) {
      return statOf(combatant, key);
    }
  }
  return -1;
}

export function useCardTextStats(ownerCharId: string): CardTextStats {
  const battleAttack = useBattleStore((state) => battleStatOfOwner(state.battle, ownerCharId, "attack"));
  const battleHealPower = useBattleStore((state) => battleStatOfOwner(state.battle, ownerCharId, "healPower"));
  const battleLowCostMastery = useBattleStore((state) => battleStatOfOwner(state.battle, ownerCharId, "lowCostMastery"));
  const battleHighCostMastery = useBattleStore((state) => battleStatOfOwner(state.battle, ownerCharId, "highCostMastery"));
  const characterState = useTownStore((state) => state.characters[ownerCharId]);
  const panelStats = useMemo(
    () => (characterState ? deriveStats(characterState) : getCharacter(ownerCharId).base),
    [characterState, ownerCharId],
  );

  return useMemo(
    () =>
      battleAttack >= 0 && battleHealPower >= 0 && battleLowCostMastery >= 0 && battleHighCostMastery >= 0
        ? {
            attack: battleAttack,
            healPower: battleHealPower,
            lowCostMastery: battleLowCostMastery,
            highCostMastery: battleHighCostMastery,
          }
        : {
            attack: panelStats.attack,
            healPower: panelStats.healPower,
            lowCostMastery: panelStats.lowCostMastery,
            highCostMastery: panelStats.highCostMastery,
          },
    [battleAttack, battleHealPower, battleLowCostMastery, battleHighCostMastery, panelStats],
  );
}

export function useCardText(card: Card): string {
  const stats = useCardTextStats(card.ownerCharId);
  const battle = useBattleStore((state) => state.battle);
  const cost = cardCost(battle, card);
  return useMemo(() => renderCardText(card, stats, cost), [card, stats, cost]);
}