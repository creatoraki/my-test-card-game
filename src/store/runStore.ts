// Zustand store: 一次"远征"的流程管理 —— 地图进度 + 战后经验结算 + 界面切换。
// 卡组/队伍/养成不在这里 —— 它们是城镇的持久资产, 见 townStore。

import { create } from "zustand";
import type { AllyInit, Card } from "../engine";
import { RULES } from "../engine";
import { getCharacter, getEncounter, getMap } from "../data";
import { useBattleStore } from "./battleStore";
import { deriveStats, useTownStore, type ExpGain } from "./townStore";

export type Screen =
  | "menu"
  | "town"
  | "formation"
  | "expedition"
  | "battle"
  | "reward"
  | "victory"
  | "defeat";

interface RunStore {
  screen: Screen;
  mapId: string | null; // 当前远征的地图
  index: number; // 当前遭遇战下标(在地图 sequence 内)
  expReport: ExpGain[]; // 上一场胜利的经验结算报告(结算页/胜利页展示)
  lastResult: "won" | "lost" | null;

  enterTown: () => void; // 主菜单 → 城镇(顺带建档)
  openFormation: () => void; // 城镇 → 编队
  openExpedition: () => void; // 城镇 → 远征选图
  startExpedition: (mapId: string) => void; // 选定地图 → 开打
  resolveBattle: () => void; // 战斗结束后调用: 判定胜负、发经验并推进
  confirmExpReport: () => void; // 结算页确认 → 下一场
  backToTown: () => void;
  backToMenu: () => void;
}

// 战斗卡组 = 上阵角色个人卡组的集合; 我方单位数值 = 基础值 + 属性点收益。
// createBattle 会直接引用传入的卡实例(不拷贝), 而个人卡组是城镇的持久资产 ——
// 故必须传副本, 否则战斗中的改动会污染城镇卡组。
function launchBattle(mapId: string, index: number): void {
  const { characters, party } = useTownStore.getState();
  const encounterId = getMap(mapId).sequence[index];
  const battleDeck: Card[] = party.flatMap((id) => structuredClone(characters[id].deck));
  const allies: AllyInit[] = party.map((id) => {
    const c = getCharacter(id);
    const s = deriveStats(characters[id]);
    return {
      id: c.id,
      charId: c.id,
      name: c.name,
      emoji: c.emoji,
      maxHp: s.maxHp,
      threat: s.threat,
      attack: s.attack,
      defense: s.defense,
    };
  });
  useBattleStore.getState().init(encounterId, { allies, deck: battleDeck });
}

export const useRunStore = create<RunStore>((set, get) => ({
  screen: "menu",
  mapId: null,
  index: 0,
  expReport: [],
  lastResult: null,

  enterTown: () => {
    useTownStore.getState().ensureProfile();
    set({ screen: "town" });
  },

  openFormation: () => {
    useTownStore.getState().ensureProfile();
    set({ screen: "formation" });
  },

  openExpedition: () => set({ screen: "expedition" }),

  startExpedition: (mapId) => {
    set({ mapId, index: 0, expReport: [], lastResult: null, screen: "battle" });
    launchBattle(mapId, 0);
  },

  resolveBattle: () => {
    if (get().screen !== "battle") return; // 幂等护栏: 防重复触发重复发经验
    const battle = useBattleStore.getState().battle;
    if (!battle) return;
    if (battle.phase === "lost") {
      set({ screen: "defeat", lastResult: "lost" });
      return;
    }
    if (battle.phase !== "won") return;

    const { index, mapId } = get();
    if (!mapId) return;

    // 胜利即发经验(含最终战), 战斗无卡牌奖励 —— 卡只能在编队里花属性点抽。
    const town = useTownStore.getState();
    const encounterId = getMap(mapId).sequence[index];
    const exp = getEncounter(encounterId).enemies.length * RULES.progression.expPerEnemy;
    const expReport = town.grantExp(town.party, exp);

    const isLast = index >= getMap(mapId).sequence.length - 1;
    set({ screen: isLast ? "victory" : "reward", expReport, lastResult: "won" });
  },

  confirmExpReport: () => {
    const { index, mapId } = get();
    if (!mapId) return;
    const next = index + 1;
    set({ index: next, screen: "battle", expReport: [] });
    launchBattle(mapId, next);
  },

  backToTown: () => {
    useBattleStore.getState().clear();
    set({ screen: "town", mapId: null, index: 0, expReport: [], lastResult: null });
  },

  backToMenu: () => {
    useBattleStore.getState().clear();
    set({ screen: "menu", mapId: null, index: 0, expReport: [], lastResult: null });
  },
}));
