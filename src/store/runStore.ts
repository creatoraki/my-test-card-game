// Zustand store: 一次"远征"的流程编排 —— 界面路由 + 探索路由图与战斗之间的往返。
// 卡组/队伍/养成不在这里 —— 它们是城镇的持久资产, 见 townStore。
// 路由会话本身也不在这里 —— 见 exploreStore; 本 store 只负责"本轮区域走完后真的建一场推进战斗"
// 这件事, 因为只有它同时认识 battleStore、exploreStore 与界面路由。

import { create } from "zustand";
import type { AllyInit, Ally, Card, Enemy } from "../engine";
import { RULES, applyModifier } from "../engine";
import { activeBonds, getCharacter, getMap, mergeMods } from "../data";
import { battleModifier, burdenNow, rewardMultiplier } from "../explore/session";
import type { PartySnapshot } from "../explore/types";
import type { ItemStack } from "../items/types";
import { useBattleStore } from "./battleStore";
import { useExploreStore } from "./exploreStore";
import { bondCountsOf, deriveStats, useTownStore, type ExpGain } from "./townStore";

// ★ "formation"(编队) 与 "charDetail"(角色详情) 是据点的**一级全屏页**, 不是设施内浮层 ——
//   入口在大厅 bento 的「编队」砖(见 ui/TownScreen.tsx), 冬眠仓只剩「冬眠唤醒」。
//   回据点走 ScreenTransition 的默认淡出淡入; 两页之间走**原生 View Transition 的共享元素
//   过场**(ROUTE_FX 里 viewTransition: true): 被点那张卡的面板/立绘/角色名与详情页的
//   立绘栏/展示柜/大标题挂同名 view-transition-name, 浏览器自动配对形变。
//   ⚠ 「回程该给哪张卡挂共享名」由 ui/sharedPortrait.ts 单独递送 —— 纯表现层数据,
//   刻意不进本 store(会被持久化, 且订阅者要为一个只活半秒的值重渲染)。
export type Screen =
  | "menu"
  | "town"
  | "formation"
  | "charDetail"
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
  lastLoot: number; // 上一场战斗的居民积分产出(结算页展示)。⚠ 普通战斗恒为 0, 见 EXPLORE_RULES.loot
  lastDrops: ItemStack[]; // 上一场战斗掉的实物(结算页展示) —— 战斗的正经产出是这个
  // 角色详情页正在看谁。⚠ 只在 screen === "charDetail" 时有意义; 从详情返回编队时**刻意不清空**,
  // 好让退场动画期间那一页仍能渲染出内容(ScreenTransition 会把旧界面多留一个出场时长)。
  detailCharId: string | null;

  enterTown: () => void;
  openFormation: () => void; // 大厅「编队」砖 → 全屏编队页
  openCharDetail: (charId: string) => void; // 编队页点卡面 → 全屏角色详情页
  closeCharDetail: () => void; // 详情页返回编队页
  startExpedition: (mapId: string) => void; // 选定地图 → 进路由图
  enterEncounter: () => void; // 本轮的推进战斗已定 → 建局开打
  resolveBattle: () => void; // 战斗结束: 回填血量/结算积分与经验/推进会话
  confirmExpReport: () => void; // 战斗小结确认 → 回路由图, 或进通关结算
  retreat: () => void; // 主动撤离 → 落袋回城
  finishExpedition: () => void; // 会话自行走到终局(升降机/轮次走完/团灭) → 结算页
  backToTown: () => void;
  backToMenu: () => void;
}

// 上阵角色 → 探索层的队伍快照。血量在整趟远征里由 exploreStore 持有并跨战斗继承。
// ⚠ 这里的 maxHp **不含羁绊加成** —— 羁绊在 launchBattle 才叠。本期实装的 6 个羁绊都不改 maxHp,
//   所以两处口径一致; 日后一旦有加 maxHp 的羁绊, 这里必须一并叠, 否则出发时的血量会对不上。
function partySnapshot(): PartySnapshot[] {
  const { characters, party } = useTownStore.getState();
  return party.map((id) => {
    const c = getCharacter(id);
    const stats = deriveStats(characters[id]);
    const maxHp = Math.max(1, Math.round(stats.maxHp));
    return {
      charId: id,
      name: c.name,
      emoji: c.emoji,
      hp: maxHp,
      maxHp,
      alive: true,
      // ★ 负重适应随快照一起带进探索层 —— 之后算负重惩罚就不用回头来问 townStore 了。
      burdenAdapt: stats.burdenAdapt,
    };
  });
}

// 建一场战斗。
// - 战斗卡组 = 上阵角色个人卡组的集合。createBattle 直接引用传入的卡实例(不拷贝), 而个人卡组是
//   城镇的持久资产, 故必须传副本, 否则战斗中的改动会污染城镇卡组。
// - 只有存活角色参战: 本次远征内阵亡的角色不出战, 其个人卡组也一并排除。
// - 净化粒子档位与战斗签条件经 battleModifier 注入 —— 引擎不认识能量与老虎机,
//   只认识 EncounterModifier。
function launchBattle(encounterId: string, isBoss: boolean): void {
  const { characters, party } = useTownStore.getState();
  const session = useExploreStore.getState().session;
  if (!session) return;

  // ★ 羁绊在**开战瞬间快照**, 与负重惩罚同一个范式(见 engine/stats.burdenPenalty 的注释):
  //   局外算好, 灌进面板, 引擎不认识羁绊 —— 正如它不认识装备与背包。
  //   刻意不进 deriveStats: 那是**单角色**换算点(角色详情/编队页都在用), 而羁绊是**全队**系统,
  //   塞进去会让「看某个角色的面板」凭空多出队友装备带来的加成。
  const active = activeBonds(bondCountsOf(characters, party));
  const bondMods = mergeMods(active.map((a) => a.tier.mods)); // 每人各叠一份
  const bondPartyMods = mergeMods(active.map((a) => a.tier.partyMods)); // 全队只叠一份

  const alive = session.party.filter((p) => p.alive);
  const battleDeck: Card[] = alive.flatMap((p) => structuredClone(characters[p.charId].deck));
  const allies: AllyInit[] = alive.map((p, i) => {
    const c = getCharacter(p.charId);
    // 局外第一层(角色基础 + 装备)已由 deriveStats 算完; 羁绊是叠在它之上的第二层。
    let s = applyModifier(deriveStats(characters[p.charId]), bondMods);
    // ★ 抽牌数/手牌上限是**小队合计**属性(engine/stats.partyDrawCount 按上阵角色求和),
    //   每人加一份会变成 3 人队三倍。所以这类只给队伍第一人加。
    if (i === 0) s = applyModifier(s, bondPartyMods);
    return {
      id: c.id,
      charId: c.id,
      name: c.name,
      emoji: c.emoji,
      stats: s, // ★ 局外已结算的完整面板(角色基础 + 装备 + 羁绊)
      startHp: p.hp, // ★ 血量跨战斗继承
    };
  });

  // ★ 能量档位的改造 + 本轮战斗签选中符号的改造, 由 battleModifier 一并合出来 ——
  //   这里只调它一个, 分两处各算一半必然漏掉其中一半。
  const mod = battleModifier(session, getMap(session.mapId).fillerEnemyIds);
  // ★ 负重在**开战瞬间快照**(设计文档 §6.3): 引擎不认识背包, 只收这一个百分点数。
  const burden = burdenNow(session);
  useBattleStore
    .getState()
    .init(encounterId, { allies, deck: battleDeck, burdenPenalty: burden }, undefined, mod);
}

// 远征收尾的落袋 —— 积分 + 实物一起进城镇, 只有这一个出口。
// ★ 团灭时 session.backpack 与 session.loot 已被 explore/session.loseEverything 清零,
//   所以这里**无条件**调用即可: 惩罚的真相点只在 EXPLORE_RULES.wipe 一处, 不在这里再判一次。
//   投递口寄回的 shipped 不受团灭影响, 因此照样入仓 —— 那是背包玩法唯一的保险手段(§6.5)。
function bankEverything(session: { loot: number; backpack: ItemStack[]; shipped: ItemStack[] }) {
  const town = useTownStore.getState();
  town.bankLoot(session.loot);
  town.deposit([...session.shipped, ...session.backpack]);
}

export const useRunStore = create<RunStore>((set, get) => ({
  screen: "menu",
  mapId: null,
  expReport: [],
  lastResult: null,
  lastLoot: 0,
  lastDrops: [],
  detailCharId: null,

  enterTown: () => {
    useTownStore.getState().ensureProfile();
    useExploreStore.getState().clear();
    set({ screen: "town" });
  },

  // ★ 编队/详情是纯查看与编成, 不碰探索层, 故这三个 action 只切 screen ——
  //   不要在这里 clear() 任何东西, 否则从据点绕一圈编队回来会莫名重置。
  openFormation: () => set({ screen: "formation" }),
  openCharDetail: (charId) => set({ screen: "charDetail", detailCharId: charId }),
  closeCharDetail: () => set({ screen: "formation" }),

  startExpedition: (mapId) => {
    useExploreStore.getState().start(mapId, partySnapshot());
    set({
      mapId,
      expReport: [],
      lastResult: null,
      lastLoot: 0,
      lastDrops: [],
      screen: "explore",
    });
  },

  // 本轮线路披露完 → 建局开打(设计文档 §3.1 的固定档位表)。
  // ⚠ 会话的推进不在这里: startRoundBattle 已经把 phase 打成 inBattle 并写下 pendingEncounterId,
  //   本函数只负责「照着它建一场战斗并切页」。没有待打的战斗就什么都不做(幂等护栏)。
  //   ★ 老虎机战斗签接上之后, 变的只是 pendingEncounterId 怎么定, 这条路径不动。
  enterEncounter: () => {
    const s = useExploreStore.getState().session;
    if (!s?.pendingEncounterId) return;
    launchBattle(s.pendingEncounterId, s.pendingIsBoss);
    set({ screen: "battle" });
  },

  resolveBattle: () => {
    if (get().screen !== "battle") return; // 幂等护栏: 防重复触发重复发经验
    const battle = useBattleStore.getState().battle;
    const session = useExploreStore.getState().session;
    if (!battle || !session?.pendingEncounterId) return;
    if (battle.phase !== "won" && battle.phase !== "lost") return;

    const won = battle.phase === "won";
    // ★ 从战斗单位而非遭遇战定义里取敌人 defId —— 能量档位追加进来的敌人也该掉东西,
    //   而 EncounterDef.enemies 里没有它们。数量仍是 .length, 与旧口径一致。
    const enemyDefIds = battle.enemyIds.map((id) => (battle.combatants[id] as Enemy).enemyDefId);
    const enemyCount = enemyDefIds.length;

    // 战斗单位的最终血量回填给探索层 —— 下一场以此开局
    const survivors = battle.playerIds.map((id) => {
      const a = battle.combatants[id] as Ally;
      return { charId: a.charId, hp: a.hp, alive: a.alive };
    });

    const explore = useExploreStore.getState();
    explore.settleBattle(won, survivors, enemyDefIds);
    const after = useExploreStore.getState().session;

    if (!won) {
      // 战败即团灭。背包已在 settleBattle 里丢干净, 这里只把寄回的落袋。
      if (after) bankEverything(after);
      set({ screen: "defeat", lastResult: "lost", expReport: [], lastLoot: 0, lastDrops: [] });
      return;
    }

    // 经验按能量档位倍率即时入账(与积分不同 —— 积分要活着回城才落袋, 经验打完就是你的)
    const town = useTownStore.getState();
    const mult = rewardMultiplier(session.energy);
    const exp = Math.round(enemyCount * RULES.progression.expPerEnemy * mult);
    const expReport = town.grantExp(
      session.party.filter((p) => p.alive).map((p) => p.charId),
      exp,
    );

    // 本场掉了什么: 拿战斗前后的背包做差(uid 唯一, 所以差集就是新进来的那些)。
    // ⚠ 还要算上 pendingPickup —— 背包满时掉落会落在那里, 玩家仍然「掉到了」它们。
    const before = new Set(session.backpack.map((s) => s.uid));
    const lastDrops = [...(after?.backpack ?? []), ...(after?.pendingPickup ?? [])].filter(
      (s) => !before.has(s.uid),
    );

    set({
      screen: "reward",
      expReport,
      lastResult: "won",
      lastLoot: (after?.loot ?? 0) - session.loot,
      lastDrops,
    });
  },

  confirmExpReport: () => {
    const session = useExploreStore.getState().session;
    if (!session) return set({ screen: "town" });

    if (session.phase === "cleared") {
      bankEverything(session);
      useBattleStore.getState().clear();
      set({ screen: "victory", lastResult: "won" });
      return;
    }
    useBattleStore.getState().clear();
    set({ screen: "explore", expReport: [] });
  },

  retreat: () => {
    useExploreStore.getState().retreatNow();
    get().finishExpedition();
  },

  // 会话自己走到了终局(坐上撤离升降机 / 主动撤离 / 事件掉血团灭)时由 ExploreScreen 调用。
  // 撤离与通关一样落袋; 团灭时 session.loot 已被 finishBattle/checkWipe 清零, 这里照样 bank 即可,
  // 不必再判一次 —— 惩罚的真相点只有 EXPLORE_RULES.wipe 一处。
  finishExpedition: () => {
    if (get().screen !== "explore") return; // 幂等护栏: 同一趟只结算一次
    const session = useExploreStore.getState().session;
    if (!session) return set({ screen: "town" });

    if (session.phase === "wiped") {
      // 团灭: session.backpack 已被 loseEverything 清空, 但**投递口寄回的仍然算数**(§6.5)。
      bankEverything(session);
      set({ screen: "defeat", lastResult: "lost", expReport: [], lastLoot: 0, lastDrops: [] });
      return;
    }
    if (session.phase !== "retreated" && session.phase !== "cleared") return;

    bankEverything(session);
    set({
      screen: "victory",
      lastResult: session.phase === "cleared" ? "won" : "retreat",
    });
  },

  backToTown: () => {
    useBattleStore.getState().clear();
    useExploreStore.getState().clear();
    set({ screen: "town", mapId: null, expReport: [], lastResult: null, lastLoot: 0, lastDrops: [] });
  },

  backToMenu: () => {
    useBattleStore.getState().clear();
    useExploreStore.getState().clear();
    set({ screen: "menu", mapId: null, expReport: [], lastResult: null, lastLoot: 0, lastDrops: [] });
  },
}));
