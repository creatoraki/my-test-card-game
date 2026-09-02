import type { Enemy } from "@/engine";
import { useBattleStore } from "@/store/battleStore";
import { useExploreStore } from "@/store/exploreStore";
import { useTownStore } from "@/store/townStore";

let installed = false;

export function collectNow(): void {
  const town = useTownStore.getState();
  const explore = useExploreStore.getState().session;
  const battle = useBattleStore.getState().battle;
  const items = new Set<string>();
  const cards = new Set<string>();
  const enemies = new Set<string>();

  for (const stack of town.storage) items.add(stack.itemId);
  for (const character of Object.values(town.characters)) {
    for (const stack of Object.values(character.equipped ?? {})) {
      if (stack) items.add(stack.itemId);
    }
    for (const card of character.deck) {
      cards.add(card.id);
      if (card.cardModule) items.add(card.cardModule.itemId);
    }
  }
  for (const stack of explore?.backpack ?? []) items.add(stack.itemId);
  for (const stack of explore?.shipped ?? []) items.add(stack.itemId);
  for (const id of battle?.enemyIds ?? []) {
    const combatant = battle?.combatants[id];
    if (combatant?.team === "enemy") enemies.add((combatant as Enemy).enemyDefId);
  }

  town.recordCodex({
    items: [...items],
    cards: [...cards],
    enemies: [...enemies],
  });
}

export function installCodexCollector(): void {
  if (installed) return;
  installed = true;
  collectNow();
  useTownStore.subscribe(collectNow);
  useExploreStore.subscribe(collectNow);
  useBattleStore.subscribe(collectNow);
}