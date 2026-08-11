import { useMemo } from "react";
import { getCharacter } from "@/data";
import { renderCardText, statOf, type BattleState, type Card, type CardTextStats } from "@/engine";
import { useBattleStore } from "@/store/battleStore";
import { deriveStats, useTownStore } from "@/store/townStore";

function battleStatOfOwner(
  battle: BattleState | null,
  ownerCharId: string,
  key: "attack" | "healPower",
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
  const characterState = useTownStore((state) => state.characters[ownerCharId]);
  const panelStats = useMemo(
    () => (characterState ? deriveStats(characterState) : getCharacter(ownerCharId).base),
    [characterState, ownerCharId],
  );

  return useMemo(
    () =>
      battleAttack >= 0 && battleHealPower >= 0
        ? { attack: battleAttack, healPower: battleHealPower }
        : { attack: panelStats.attack, healPower: panelStats.healPower },
    [battleAttack, battleHealPower, panelStats],
  );
}

export function useCardText(card: Card): string {
  const stats = useCardTextStats(card.ownerCharId);
  return useMemo(() => renderCardText(card, stats), [card, stats]);
}