import type { Enemy } from "@/engine";
import { useBattleStore } from "../battle/battleStore";
import { useExploreStore } from "../explore/exploreStore";
import { useTownStore } from "./townStore";

let installed = false;
/** 上次收集时各来源的引用。行走中的会话提交(暗雷检定、扣粒子)不换这些引用, 直接跳过整轮遍历。 */
let lastSources: readonly unknown[] = [];

export function collectNow(): void {
  const town = useTownStore.getState();
  const explore = useExploreStore.getState().session;
  const battle = useBattleStore.getState().battle;
  const sources = [town.storage, town.characters, explore?.backpack, explore?.shipped, battle];
  if (sources.every((source, index) => source === lastSources[index])) return;
  lastSources = sources;
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