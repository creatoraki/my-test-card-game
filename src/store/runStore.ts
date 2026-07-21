// Zustand store: 一次"远征"的流程编排 —— 界面路由 + 探索牌局与战斗之间的往返。
// 卡组/队伍/养成不在这里 —— 它们是城镇的持久资产, 见 townStore。
// 牌局本身也不在这里 —— 见 exploreStore; 本 store 只负责"打出遭遇卡后真的建一场战斗"这件事,
// 因为只有它同时认识 battleStore、exploreStore 与界面路由。

import { create } from "zustand";
import type { AllyInit, Ally, Card } from "../engine";
import { RULES } from "../engine";
import { getCharacter, getEncounter, getMap } from "../data";
import { encounterModifier, rewardMultiplier } from "../explore/session";
import type { PartySnapshot } from "../explore/types";
import { useBattleStore } from "./battleStore";
import { useExploreStore } from "./exploreStore";
import { deriveStats, useTownStore, type ExpGain } from "./townStore";

export type Screen =
  | "menu"
  | "town"
  | "formation"
  | "expedition"
  | "explore"
  | "battle"
  | "reward"
  | "victory"
  | "defeat";

export type RunResult = "won" | "lost" | "retreat";

interface RunStore {
  screen: Screen;
  mapId: string | null; // 当前远征的地图
  expReport: ExpGain[]; // 上一场胜利的经验结算报告(结算页展示)
  lastResult: RunResult | null;
  lastLoot: number; // 上一场战斗的残片产出(结算页展示)

  enterTown: () => void;
  openFormation: () => void;
  openExpedition: () => void;
  startExpedition: (mapId: string) => void; // 选定地图 → 进探索牌局
  enterEncounter: (routeUid: string) => void; // 打出遭遇/BOSS 卡 → 建局开打
  resolveBattle: () => void; // 战斗结束: 回填血量/结算残片与经验/推进牌局
  confirmExpReport: () => void; // 战斗小结确认 → 回牌桌, 或进通关结算
  retreat: () => void; // 打出撤退卡 → 落袋回城
  backToTown: () => void;
  backToMenu: () => void;
}

// 上阵角色 → 探索层的队伍快照。血量在整趟远征里由 exploreStore 持有并跨战斗继承。
function partySnapshot(): PartySnapshot[] {
  const { characters, party } = useTownStore.getState();
  return party.map((id) => {
    const c = getCharacter(id);
    const s = deriveStats(characters[id]);
    return { charId: id, name: c.name, emoji: c.emoji, hp: s.maxHp, maxHp: s.maxHp, alive: true };
  });
}

// 建一场战斗。
// - 战斗卡组 = 上阵角色个人卡组的集合。createBattle 直接引用传入的卡实例(不拷贝), 而个人卡组是
//   城镇的持久资产, 故必须传副本, 否则战斗中的改动会污染城镇卡组。
// - 只有存活角色参战: 本次远征内阵亡的角色不出战, 其个人卡组也一并排除。
// - 危险度经 encounterModifier 注入 —— 引擎不认识危险度, 只认识 EncounterModifier。
function launchBattle(encounterId: string, isBoss: boolean): void {
  const { characters } = useTownStore.getState();
  const session = useExploreStore.getState().session;
  if (!session) return;

  const alive = session.party.filter((p) => p.alive);
  const battleDeck: Card[] = alive.flatMap((p) => structuredClone(characters[p.charId].deck));
  const allies: AllyInit[] = alive.map((p) => {
    const c = getCharacter(p.charId);
    const s = deriveStats(characters[p.charId]);
    return {
      id: c.id,
      charId: c.id,
      name: c.name,
      emoji: c.emoji,
      maxHp: s.maxHp,
      startHp: p.hp, // ★ 血量跨战斗继承
      threat: s.threat,
      attack: s.attack,
      defense: s.defense,
    };
  });

  const mod = encounterModifier(session.danger, isBoss, getMap(session.mapId).fillerEnemyIds);
  useBattleStore.getState().init(encounterId, { allies, deck: battleDeck }, undefined, mod);
}

export const useRunStore = create<RunStore>((set, get) => ({
  screen: "menu",
  mapId: null,
  expReport: [],
  lastResult: null,
  lastLoot: 0,

  enterTown: () => {
    useTownStore.getState().ensureProfile();
    useExploreStore.getState().clear();
    set({ screen: "town" });
  },

  openFormation: () => {
    useTownStore.getState().ensureProfile();
    set({ screen: "formation" });
  },

  openExpedition: () => set({ screen: "expedition" }),

  startExpedition: (mapId) => {
    useExploreStore.getState().start(mapId, partySnapshot());
    set({ mapId, expReport: [], lastResult: null, lastLoot: 0, screen: "explore" });
  },

  enterEncounter: (routeUid) => {
    const next = useExploreStore.getState().playRouteCard(routeUid);
    if (!next?.pendingEncounterId) return;
    launchBattle(next.pendingEncounterId, next.pendingIsBoss);
    set({ screen: "battle" });
  },

  resolveBattle: () => {
    if (get().screen !== "battle") return; // 幂等护栏: 防重复触发重复发经验
    const battle = useBattleStore.getState().battle;
    const session = useExploreStore.getState().session;
    if (!battle || !session?.pendingEncounterId) return;
    if (battle.phase !== "won" && battle.phase !== "lost") return;

    const won = battle.phase === "won";
    const encounterId = session.pendingEncounterId;
    const enemyCount = getEncounter(encounterId).enemies.length;

    // 战斗单位的最终血量回填给探索层 —— 下一场以此开局
    const survivors = battle.playerIds.map((id) => {
      const a = battle.combatants[id] as Ally;
      return { charId: a.charId, hp: a.hp, alive: a.alive };
    });

    const explore = useExploreStore.getState();
    explore.settleBattle(won, survivors, enemyCount);
    const after = useExploreStore.getState().session;

    if (!won) {
      set({ screen: "defeat", lastResult: "lost", expReport: [], lastLoot: 0 });
      return;
    }

    // 经验按危险度倍率即时入账(与残片不同 —— 残片要活着回城才落袋, 经验打完就是你的)
    const town = useTownStore.getState();
    const mult = rewardMultiplier(session.danger);
    const exp = Math.round(enemyCount * RULES.progression.expPerEnemy * mult);
    const expReport = town.grantExp(
      session.party.filter((p) => p.alive).map((p) => p.charId),
      exp,
    );

    set({
      screen: "reward",
      expReport,
      lastResult: "won",
      lastLoot: (after?.loot ?? 0) - session.loot,
    });
  },

  confirmExpReport: () => {
    const session = useExploreStore.getState().session;
    if (!session) return set({ screen: "town" });

    if (session.phase === "cleared") {
      useTownStore.getState().bankLoot(session.loot);
      useBattleStore.getState().clear();
      set({ screen: "victory", lastResult: "won" });
      return;
    }
    useBattleStore.getState().clear();
    set({ screen: "explore", expReport: [] });
  },

  retreat: () => {
    const explore = useExploreStore.getState();
    explore.retreatNow();
    const session = useExploreStore.getState().session;
    if (session) useTownStore.getState().bankLoot(session.loot);
    set({ screen: "victory", lastResult: "retreat" });
  },

  backToTown: () => {
    useBattleStore.getState().clear();
    useExploreStore.getState().clear();
    set({ screen: "town", mapId: null, expReport: [], lastResult: null, lastLoot: 0 });
  },

  backToMenu: () => {
    useBattleStore.getState().clear();
    useExploreStore.getState().clear();
    set({ screen: "menu", mapId: null, expReport: [], lastResult: null, lastLoot: 0 });
  },
}));
