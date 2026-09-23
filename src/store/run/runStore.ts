// Zustand store: 一次"远征"的流程编排 —— 界面路由 + 探索场景与战斗之间的往返。
// 卡组/队伍/养成不在这里 —— 它们是城镇的持久资产, 见 townStore。
// 探索会话本身也不在这里 —— 见 exploreStore; 本 store 只负责"会话进入 inBattle 后真的建一场战斗"
// 这类跨 store 的编排, 因为只有它同时认识 battleStore、exploreStore 与界面路由。
//
// 编排细节按职责拆在 store/run/ 下: 建局(launchBattle)、战后(battleAftermath)、
// 收尾落袋(expeditionEnd)、途中换装与待办(expeditionActions)。本文件只保留状态与路由。

import { create } from "zustand";
import type { QuirkId } from "@/engine";
import { getItemDef } from "@/data";
import type { MapDifficulty } from "@/data/maps/mapDifficulty";
import type { OfferingPick } from "@/explore/curio/offering";
import type { ExploreState } from "@/explore/types";
import type { EquipSlot, ItemStack } from "@/items/types";
import { useBattleStore } from "../battle/battleStore";
import { useExploreStore } from "../explore/exploreStore";
import { snapshotTownProfile } from "./expeditionBackup";
import { useTownStore } from "../town/townStore";
import {
  chooseCurio as chooseCurioAction,
  selectCurio as selectCurioAction,
  openMerchantShelf as openMerchantShelfAction,
  buyMerchantSlot as buyMerchantSlotAction,
} from "../explore/curioActions";
import { confirmExpReport, resolveBattle, restartBattle, retreatFromBattle } from "./battleAftermath";
import * as expeditionActions from "./expeditionActions";
import { finishExpedition } from "./expeditionEnd";
import { launchBattle } from "./launchBattle";
import { partySnapshot } from "./party";
import { CLEARED_BATTLE_REPORT, type RunState } from "./types";

export type { RunResult, Screen } from "./types";

interface RunStore extends RunState {
  enterTown: () => void;
  openFormation: () => void; // 据点全景右下「编队」→ 全屏编队页(角色详情是它内部的一种态, 不占 screen)
  openSortie: () => void; // 据点全景右下「出击」→ 全屏出击页(选地图 + 备物资)
  // 物资准备完毕 → 进探索场景。backpack = 出发时装好的物资(见 store/sortieStore)。
  startExpedition: (mapId: string, backpack?: ItemStack[], difficulty?: MapDifficulty) => void;
  beginDescent: (mapId: string, backpack?: ItemStack[], difficulty?: MapDifficulty) => void;
  beginAscent: () => void;
  finishRide: () => void;
  chooseCurio: (decisionId: string, executorId: string) => ExploreState | null;
  selectCurio: (decisionId: string, executorId: string, picks: OfferingPick[]) => ExploreState | null;
  openMerchantShelf: () => ExploreState | null;
  buyMerchantSlot: (index: number) => boolean;
  enterEncounter: () => void; // 会话已进入 inBattle → 建局开打
  resolveBattle: () => void; // 战斗结束: 回填血量/结算积分与经验/推进会话
  // ---- 战斗设置面板的两个出口(见 ui/battle/BattleSettingsPanel) ----
  restartBattle: () => void; // 重打这一场: 按进战前的队伍状态重新建局
  retreatFromBattle: () => void; // 战斗中撤退: 本场作废 + 整趟远征收尾落袋回城
  confirmExpReport: () => void; // 战斗小结确认 → 回探索场景, 或进通关结算
  // ---- 远征途中换装(探索页的角色档案 Modal) ----
  // 返回 false = 没做任何改动(阶段不允许 / 背包装不下 / 目标非法), UI 据此飘一条提示。
  equipFromBackpack: (charId: string, uid: string) => boolean;
  unequipToBackpack: (charId: string, slot: EquipSlot) => boolean;
  resolvePendingHeal: (charId: string, limit: boolean) => void;
  resolvePendingQuirk: (charId?: string, quirkId?: QuirkId) => void;
  resolvePendingPollution: (charId?: string) => void;
  resolvePendingPurification: (charId: string | undefined, uids: string[]) => void;
  startTaintedDraw: (charId: string) => void;
  retreat: () => void; // 主动撤离 → 落袋回城
  finishExpedition: () => void; // 会话自行走到终局(撤离/通关/团灭) → 结算页
  backToTown: () => void;
  backToMenu: () => void;
}

// 离开一趟远征(回城 / 回主菜单)时整组清空的结算展示数据。
const CLEARED_RUN = {
  mapId: null,
  difficulty: "normal",
  expReport: [],
  lastResult: null,
  lastLoot: 0,
  lastDrops: [],
  lastClearReward: [],
  ...CLEARED_BATTLE_REPORT,
} satisfies Partial<RunState>;

export const useRunStore = create<RunStore>((set, get) => ({
  screen: "menu",
  ...CLEARED_RUN,
  elevatorRide: null,

  enterTown: () => {
    useTownStore.getState().ensureProfile();
    useExploreStore.getState().clear();
    set({ screen: "town" });
  },

  // ★ 编队是纯查看与编成, 不碰探索层, 故这个 action 只切 screen ——
  //   不要在这里 clear() 任何东西, 否则从据点绕一圈编队回来会莫名重置。
  openFormation: () => set({ screen: "formation" }),
  // ⚠ 会话本身由 ui/sortie 那边 open() —— 这里只切页, 与 openFormation 保持同一粒度。
  openSortie: () => set({ screen: "sortie" }),

  beginDescent: (mapId, backpack = [], difficulty = "normal") => {
    set({ elevatorRide: { dir: "down", mapId, backpack, difficulty }, screen: "elevator" });
  },

  beginAscent: () => {
    const screen = get().screen;
    if (screen !== "victory" && screen !== "defeat") return;
    set({ elevatorRide: { dir: "up" }, screen: "elevator" });
  },

  startExpedition: (mapId, backpack = [], difficulty = "normal") => {
    // 探索期 townStore 的散点写入统一由出击快照兜底, 中途刷新时整档回滚。
    snapshotTownProfile();
    const town = useTownStore.getState();
    const ownedRelicIds = [...town.storage, ...backpack]
      .filter((stack) => getItemDef(stack.itemId).category === "relic")
      .map((stack) => stack.itemId);
    useExploreStore.getState().start(mapId, partySnapshot(), undefined, backpack, ownedRelicIds, difficulty);
    set({ ...CLEARED_RUN, mapId, difficulty, screen: "explore" });
  },

  finishRide: () => {
    if (get().screen !== "elevator") return;
    const ride = get().elevatorRide;
    set({ elevatorRide: null });
    if (!ride) return get().enterTown();
    if (ride.dir === "up") return get().backToTown();
    get().startExpedition(ride.mapId, ride.backpack, ride.difficulty);
  },

  chooseCurio: (decisionId, executorId) => chooseCurioAction(decisionId, executorId),
  selectCurio: (decisionId, executorId, picks) => selectCurioAction(decisionId, executorId, picks),
  openMerchantShelf: () => openMerchantShelfAction(),
  buyMerchantSlot: (index) => buyMerchantSlotAction(index),

  // ⚠ 会话的推进不在这里: 开战入口已经把 phase 打成 inBattle 并写下 pendingEncounterId,
  //   本函数只负责「照着它建一场战斗并切页」。没有待打的战斗就什么都不做(幂等护栏)。
  enterEncounter: () => {
    if (get().screen !== "explore") return;
    const s = useExploreStore.getState().session;
    if (!s?.pendingEncounterId) return;
    launchBattle(s.pendingEncounterId);
    set({ screen: "battle" });
  },

  resolveBattle: () => resolveBattle(get, set),
  restartBattle: () => restartBattle(get),
  retreatFromBattle: () => retreatFromBattle(get, set),
  confirmExpReport: () => confirmExpReport(set),

  equipFromBackpack: expeditionActions.equipFromBackpack,
  unequipToBackpack: expeditionActions.unequipToBackpack,
  resolvePendingHeal: expeditionActions.resolvePendingHeal,
  startTaintedDraw: expeditionActions.startTaintedDraw,
  resolvePendingQuirk: expeditionActions.resolvePendingQuirk,
  resolvePendingPollution: expeditionActions.resolvePendingPollution,
  resolvePendingPurification: expeditionActions.resolvePendingPurification,

  retreat: () => {
    useExploreStore.getState().retreatNow();
    get().finishExpedition();
  },

  finishExpedition: () => finishExpedition(get, set),

  // ★ 一趟出击的收尾 = **时间推进一日**(据点商店的主刷新机制就靠它)。
  // ⚠ 只在这里推进: enterTown 是从主菜单进据点(没出击过), finishExpedition 只是切到
  //   结算页(玩家还没回到据点), 两处都不该 +1 天。
  backToTown: () => {
    useBattleStore.getState().clear();
    useExploreStore.getState().clear();
    useTownStore.getState().advanceDay();
    set({ screen: "town", ...CLEARED_RUN });
  },

  backToMenu: () => {
    useBattleStore.getState().clear();
    useExploreStore.getState().clear();
    set({ screen: "menu", ...CLEARED_RUN });
  },
}));
