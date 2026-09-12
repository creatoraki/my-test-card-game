import type {
  Ally,
  BattleState,
  Card,
  Combatant,
  EncounterModifier,
  Enemy,
  SquadBuffRewardPools,
  SquadResourceMods,
  StatBlock,
} from "./types";
import type { QuirkId } from "./quirks";
import { makeStats } from "./stats";
import { shuffle } from "./rng";
import { applyStatus, log } from "./ops";
import { rollChallenges } from "./challenges";
import { getEncounter, getEnemyDef, slotDefId } from "../data";

const isTest = import.meta.env.isTest === "true";

export interface AllyInit {
  id: string;
  charId: string;
  name: string;
  emoji: string;
  stats: StatBlock;
  startHp?: number;
  startHpLimit?: number;
  pollution?: number;
  sick?: boolean;
  quirks?: QuirkId[];
}

export interface BattleSetup {
  allies: AllyInit[];
  deck: Card[];
  burden?: number;
  squadMods?: SquadResourceMods;
  squadBuffRewardPools?: SquadBuffRewardPools;
  relics?: string[];
}

export function createBattleState(
  encounterId: string,
  setup: BattleSetup,
  seed?: number,
  mod?: EncounterModifier,
): BattleState {
  const enc = getEncounter(encounterId);
  const combatants: Record<string, Combatant> = {};
  const playerIds: string[] = [];
  const enemyIds: string[] = [];

  for (const a of setup.allies) {
    const maxHp = Math.max(1, Math.round(a.stats.maxHp));
    const hpLimit = Math.max(1, Math.min(maxHp, Math.round(a.startHpLimit ?? maxHp)));
    const ally: Ally = {
      id: a.id,
      charId: a.charId,
      name: a.name,
      emoji: a.emoji,
      team: "player",
      hp: Math.max(0, Math.min(maxHp, a.startHp ?? maxHp)),
      hpLimit,
      maxHp,
      shield: 0,
      stats: a.stats,
      mods: {},
      statuses: [],
      alive: true,
      tempo: 0,
      pollution: Math.max(0, Math.min(99, Math.round(a.pollution ?? 0))),
      sick: a.sick ?? false,
      quirks: [...(a.quirks ?? [])],
    };
    combatants[a.id] = ally;
    playerIds.push(a.id);
  }

  const defIds = [...enc.enemies.map(slotDefId), ...(mod?.extraEnemies ?? [])];
  const hpMul = mod?.hpMultiplier ?? 1;
  const defCounts: Record<string, number> = {};
  for (const defId of defIds) defCounts[defId] = (defCounts[defId] ?? 0) + 1;
  const defSeen: Record<string, number> = {};

  defIds.forEach((defId, i) => {
    const def = getEnemyDef(defId);
    const id = `${defId}#${i}`;
    const suffix = defCounts[defId] > 1 ? ` ${String.fromCharCode(65 + (defSeen[defId] ?? 0))}` : "";
    defSeen[defId] = (defSeen[defId] ?? 0) + 1;
    const maxHp = isTest ? 1 : Math.max(1, Math.round(def.maxHp * hpMul));
    const enemy: Enemy = {
      id,
      enemyDefId: defId,
      name: def.name + suffix,
      emoji: def.emoji,
      team: "enemy",
      hp: maxHp,
      hpLimit: maxHp,
      maxHp,
      shield: 0,
      stats: makeStats({ ...def.stats, maxHp }),
      mods: {},
      statuses: [],
      alive: true,
      tempo: 0,
      moveDelayDelta: mod?.moveDelayDelta ?? 0,
      nextActTick: null,
      actsPerRound: Math.max(1, def.actsPerRound ?? 1),
      actsThisRound: 0,
      intent: { moveId: "", name: "", emoji: "", kind: "special" },
    };
    combatants[id] = enemy;
    enemyIds.push(id);
  });

  const cards: Record<string, Card> = {};
  for (const card of setup.deck) cards[card.uid] = card;

  const state: BattleState = {
    encounterId,
    round: 0,
    tick: 0,
    phase: "player",
    combatants,
    playerIds,
    enemyIds,
    cards,
    relics: [...new Set(setup.relics ?? [])].map((id) => ({ id, counter: 0 })),
    draw: [],
    hand: [],
    discard: [],
    exhaust: [],
    redrawsThisRound: 0,
    waitsThisRound: 0,
    discardsThisRound: 0,
    playedThisRound: [],
    lastPlayedCard: null,
    discardResolving: [],
    resources: {},
    burden: Math.max(0, setup.burden ?? 0),
    squadMods: {
      openingHand: 0,
      drawCount: 0,
      redraws: 0,
      waits: 0,
      mana: 0,
      handLimit: 0,
      ...(setup.squadMods ?? {}),
    },
    challenges: [],
    challengeKillRound: null,
    challengeFocusTargetId: null,
    challengeEnemyActRound: null,
    attackedThisRound: [],
    echoGainedThisRound: false,
    rngState: (seed ?? (Date.now() & 0xffffffff)) >>> 0,
    log: [],
    lastDiscardBatch: 0,
    discardsThisBattle: 0,
    lastDiscardBatchFast: 0,
    lastRecoverBatchFast: 0,
    pendingChoice: null,
    pendingDiscardPicks: [],
    pendingAutoPlays: [],
    waterfallPlay: false,
    playValueBonusPct: 0,
    playStatMods: [],
    activeCardCost: null,
    activeCardStarSpent: 0,
    activeCardStacks: 0,
    activeCardResonance: 0,
    lastAimConsumed: 0,
    activeCardUid: null,
    markTransferSourceUid: null,
    chosenCardCost: 0,
    lastStrippedMarks: 0,
    autoPlaySuppress: false,
    passiveEventCardUid: null,
    passiveEventTargetStatuses: null,
    lastDiscardBatchCost: 0,
    lastConvertBatch: 0,
    squadBuffs: [],
    squadBuffRewardPools: {
      attack: [...(setup.squadBuffRewardPools?.attack ?? [])],
      defense: [...(setup.squadBuffRewardPools?.defense ?? [])],
      support: [...(setup.squadBuffRewardPools?.support ?? [])],
      passive: [...(setup.squadBuffRewardPools?.passive ?? [])],
    },
    lastSquadBuffConsumed: 0,
    lastConsumedStatusStacks: 0,
    lastRemovedStatusCount: 0,
  };

  state.draw = shuffle(state, Object.keys(cards));
  state.challenges = rollChallenges(state);
  log(state, `⚔️ 遭遇战: ${enc.name}`);
  for (const status of mod?.enemyStatuses ?? []) {
    for (const id of enemyIds) applyStatus(state, id, status.id, status.stacks, status.duration);
  }
  return state;
}
