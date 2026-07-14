// Zustand store: 一次"跑"的流程管理 —— 持久卡组 + 遭遇战进度 + 战后奖励 + 界面切换。

import { create } from "zustand";
import type { AllyInit, Card } from "../engine";
import {
  CHARACTERS,
  RUN_SEQUENCE,
  REWARD_CARD_POOL,
  getCharacter,
  makeCard,
  upgradeCard,
} from "../data";
import { useBattleStore } from "./battleStore";

export type Screen = "menu" | "battle" | "reward" | "victory" | "defeat";

interface RunStore {
  screen: Screen;
  deck: Card[]; // 持久卡组(实例)
  roster: string[]; // 队伍角色 id
  index: number; // 当前遭遇战下标
  rewardCards: string[]; // 本次奖励可选的卡 id
  lastResult: "won" | "lost" | null;

  startRun: () => void;
  resolveBattle: () => void; // 战斗结束后调用: 判定胜负并推进
  addCard: (cardId: string) => void;
  upgradeRandom: () => void;
  skipReward: () => void;
  backToMenu: () => void;
}

function pickRewards(n: number): string[] {
  const pool = [...REWARD_CARD_POOL];
  const out: string[] = [];
  for (let i = 0; i < n && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

function alliesFor(roster: string[]): AllyInit[] {
  return roster.map((id) => {
    const c = getCharacter(id);
    return { id: c.id, charId: c.id, name: c.name, emoji: c.emoji, maxHp: c.maxHp, threat: c.threat };
  });
}

function launchBattle(index: number, deck: Card[], roster: string[]): void {
  const encounterId = RUN_SEQUENCE[index];
  useBattleStore.getState().init(encounterId, { allies: alliesFor(roster), deck });
}

export const useRunStore = create<RunStore>((set, get) => ({
  screen: "menu",
  deck: [],
  roster: [],
  index: 0,
  rewardCards: [],
  lastResult: null,

  startRun: () => {
    const roster = CHARACTERS.map((c) => c.id);
    const deck: Card[] = [];
    for (const c of CHARACTERS) for (const cid of c.startingCardIds) deck.push(makeCard(cid));
    set({ deck, roster, index: 0, rewardCards: [], lastResult: null, screen: "battle" });
    launchBattle(0, deck, roster);
  },

  resolveBattle: () => {
    const battle = useBattleStore.getState().battle;
    if (!battle) return;
    if (battle.phase === "lost") {
      set({ screen: "defeat", lastResult: "lost" });
      return;
    }
    if (battle.phase !== "won") return;

    const { index } = get();
    const isLast = index >= RUN_SEQUENCE.length - 1;
    if (isLast) {
      set({ screen: "victory", lastResult: "won" });
    } else {
      set({ screen: "reward", rewardCards: pickRewards(3), lastResult: "won" });
    }
  },

  addCard: (cardId) => {
    const deck = [...get().deck, makeCard(cardId)];
    set({ deck });
    advance(set, get);
  },

  upgradeRandom: () => {
    const deck = get().deck;
    const candidates = deck.filter((c) => !c.upgraded);
    if (candidates.length) {
      const c = candidates[Math.floor(Math.random() * candidates.length)];
      upgradeCard(c);
      set({ deck: [...deck] });
    }
    advance(set, get);
  },

  skipReward: () => advance(set, get),

  backToMenu: () => {
    useBattleStore.getState().clear();
    set({ screen: "menu", deck: [], roster: [], index: 0, rewardCards: [], lastResult: null });
  },
}));

// 进入下一场战斗
function advance(
  set: (partial: Partial<RunStore>) => void,
  get: () => RunStore,
): void {
  const { index, deck, roster } = get();
  const next = index + 1;
  set({ index: next, screen: "battle", rewardCards: [] });
  launchBattle(next, deck, roster);
}
