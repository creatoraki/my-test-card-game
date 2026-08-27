// Zustand store: 一次"远征"的流程编排 —— 界面路由 + 探索路由图与战斗之间的往返。
// 卡组/队伍/养成不在这里 —— 它们是城镇的持久资产, 见 townStore。
// 路由会话本身也不在这里 —— 见 exploreStore; 本 store 只负责"本轮区域走完后真的建一场推进战斗"
// 这件事, 因为只有它同时认识 battleStore、exploreStore 与界面路由。

import { create } from "zustand";
import type { AllyInit, Ally, Card, ChallengeRun, Enemy } from "../engine";
import { RULES, applyModifier, earnedChallengeBonus } from "../engine";
import {
  BOND_DEFS,
  activeBonds,
  getCharacter,
  getEnemyDef,
  getItemDef,
  getMap,
  mergeMods,
  nextTier,
  squadModsOf,
} from "../data";
import {
  burdenNow,
  canOpenBackpack,
  dropCoefficient,
  encounterModifier,
  energyTier,
  rewardMultiplier,
} from "../explore/session";
import type { PartySnapshot } from "../explore/types";
import type { EquipSlot, ItemStack } from "../items/types";
import { useBattleStore, type BattleMeta } from "./battleStore";
import { useExploreStore } from "./exploreStore";
import {
  bondCountsOf,
  deriveStats,
  useTownStore,
  vitalsOf,
  type ContaminationHit,
  type ExpGain,
} from "./townStore";

// ★ "formation"(编队) 与 "charDetail"(角色详情) 是据点的**一级全屏页**, 不是设施内浮层 ——
//   入口在大厅 bento 的「编队」砖(见 ui/TownScreen.tsx), 冬眠仓只剩「冬眠唤醒」。
//   回据点走 ScreenTransition 的默认淡出淡入; 两页之间走**原生 View Transition 的共享元素
//   过场**(ROUTE_FX 里 viewTransition: true): 被点那张卡的面板/立绘/角色名与详情页的
//   立绘栏/展示柜/大标题挂同名 view-transition-name, 浏览器自动配对形变。
//   ⚠ 「回程该给哪张卡挂共享名」由 ui/sharedPortrait.ts 单独递送 —— 纯表现层数据,
//   刻意不进本 store(会被持久化, 且订阅者要为一个只活半秒的值重渲染)。
// ★ "sortie"(出击) 同样是据点的一级全屏页: 入口在大厅 bento 的「出击」砖, 内部分两步
//   (选地图 → 备物资, step 存在 store/sortieStore 里)。它取代了原先埋在控制终端设施内的
//   「下降舱」抽屉 —— 出击是核心动线, 不该要玩家先播 2s 进设施运镜才找得到。
export type Screen =
  | "menu"
  | "town"
  | "formation"
  | "charDetail"
  | "sortie"
  | "explore"
  | "battle"
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
  battleSettled: boolean; // 本场战斗已完成结算, 但胜利面板仍留在战斗画布内
  lastDropK: number; // 本场掉落使用的最终倍率
  lastDropTier: { tier: number; name: string; color: string; rewardMultiplier: number } | null;
  lastChallengeBonus: number;
  lastChallenges: ChallengeRun[];
  // 角色详情页正在看谁。⚠ 只在 screen === "charDetail" 时有意义; 从详情返回编队时**刻意不清空**,
  // 好让退场动画期间那一页仍能渲染出内容(ScreenTransition 会把旧界面多留一个出场时长)。
  detailCharId: string | null;

  enterTown: () => void;
  openFormation: () => void; // 大厅「编队」砖 → 全屏编队页
  openCharDetail: (charId: string) => void; // 编队页点卡面 → 全屏角色详情页
  closeCharDetail: () => void; // 详情页返回编队页
  openSortie: () => void; // 大厅「出击」砖 → 全屏出击页(选地图 + 备物资)
  // 物资准备完毕 → 进路由图。backpack = 出发时装好的物资(见 store/sortieStore)。
  startExpedition: (mapId: string, backpack?: ItemStack[]) => void;
  chooseEventOption: (index: number) => import("../explore/types").ExploreState | null;
  enterEncounter: () => void; // 本轮的推进战斗已定 → 建局开打
  resolveBattle: () => void; // 战斗结束: 回填血量/结算积分与经验/推进会话
  confirmExpReport: () => void; // 战斗小结确认 → 回路由图, 或进通关结算
  // ---- 远征途中换装(探索页的角色档案 Modal) ----
  // 装备槽在城镇侧、背包在探索侧, 两边只有本 store 同时认识 —— 故编排放在这里。
  // 返回 false = 没做任何改动(阶段不允许 / 背包装不下 / 目标非法), UI 据此飘一条提示。
  equipFromBackpack: (charId: string, uid: string) => boolean;
  unequipToBackpack: (charId: string, slot: EquipSlot) => boolean;
  retreat: () => void; // 主动撤离 → 落袋回城
  finishExpedition: () => void; // 会话自行走到终局(升降机/轮次走完/团灭) → 结算页
  backToTown: () => void;
  backToMenu: () => void;
}

// 上阵角色 → 探索层的队伍快照。血量在整趟远征里由 exploreStore 持有并跨战斗继承。
// ★ 出发时**不回满**: 当前 HP 与体力极限直接读城镇存档(vitalsOf) —— 上一趟远征留下的
//   是永久损伤, 跨日传承。据点暂无治疗手段, 唯一的恢复途径是远征途中的消耗品与生存事件。
// ⚠ 这里的 maxHp **不含羁绊加成** —— 羁绊在 launchBattle 才叠。本期实装的 6 个羁绊都不改 maxHp,
//   所以两处口径一致; 日后一旦有加 maxHp 的羁绊, 这里必须一并叠, 否则出发时的血量会对不上。
function partySnapshot(): PartySnapshot[] {
  const { characters, party, squadTalent } = useTownStore.getState();
  return party.map((id) => {
    const c = getCharacter(id);
    const stats = deriveStats(characters[id]);
    const vitals = vitalsOf(characters[id]);
    return {
      charId: id,
      name: c.name,
      emoji: c.emoji,
      hp: vitals.hp,
      hpLimit: vitals.hpLimit,
      maxHp: vitals.maxHp,
      alive: true,
      // ★ 负重适应随快照一起带进探索层 —— 之后算负重惩罚就不用回头来问 townStore 了。
      burdenAdapt: stats.burdenAdapt,
      tradeEligibility: {
        deckSize: characters[id].deck.length,
        minDeckSize: characters[id].minDeckSize,
        contaminatedCards: characters[id].deck.filter((card) => card.contaminated).length,
        quirkCount: characters[id].quirks.length,
      },
    };
  });
}

// 换装之后把这名角色的快照对齐到新的面板值。
// ★ 只裁不补(见 explore/session.syncPartyVitals): 上限跟着装备走, 当前血量不因换装回复。
// ⚠ 口径必须与 partySnapshot() 一致(同样是 deriveStats 的局外值、同样不含羁绊), 否则
//   出击时算一套、途中换装又算另一套, 血量上限会在开战瞬间跳一下。
function syncMemberStats(charId: string): void {
  const cs = useTownStore.getState().characters[charId];
  if (!cs) return;
  const stats = deriveStats(cs);
  useExploreStore.getState().syncPartyVitals(charId, stats.maxHp, stats.burdenAdapt);
}

function applyPendingContamination(charIds: string[]): ContaminationHit[] {
  const request = useExploreStore.getState().consumePendingContamination();
  const town = useTownStore.getState();
  const hits: ContaminationHit[] = [];
  if (request.total > 0) hits.push(...town.contaminateCards(charIds, request.total));
  if (request.each > 0) hits.push(...town.contaminateCards(charIds, request.each, true));
  return hits;
}

function alivePartyIds(): string[] {
  return (
    useExploreStore
      .getState()
      .session?.party.filter((member) => member.alive)
      .map((member) => member.charId) ?? []
  );
}

function battleMeta(characters: Record<string, any>, party: string[]): BattleMeta {
  const counts = bondCountsOf(characters, party);
  const active = new Map(activeBonds(counts).map((entry) => [entry.def.id, entry.tier]));
  return {
    bonds: Object.values(BOND_DEFS).map((def) => {
      const count = counts[def.id] ?? 0;
      return { def, count, tier: active.get(def.id) ?? null, next: nextTier(def, count) };
    }),
  };
}

// 建一场战斗。
// - 战斗卡组 = 上阵角色个人卡组的集合。createBattle 直接引用传入的卡实例(不拷贝), 而个人卡组是
//   城镇的持久资产, 故必须传副本, 否则战斗中的改动会污染城镇卡组。
// - 只有存活角色参战: 本次远征内阵亡的角色不出战, 其个人卡组也一并排除。
// - 净化粒子档位经 encounterModifier 注入 —— 引擎不认识能量,
//   只认识 EncounterModifier。
function launchBattle(encounterId: string, isBoss: boolean): void {
  const session = useExploreStore.getState().session;
  if (!session) return;

  applyPendingContamination(session.party.map((p) => p.charId));
  const { characters, party, squadTalent } = useTownStore.getState();

  // ★ 羁绊在**开战瞬间快照**, 与负重同一个范式(见 engine/stats.burdenValue 的注释):
  //   局外算好, 灌进面板, 引擎不认识羁绊 —— 正如它不认识装备与背包。
  //   刻意不进 deriveStats: 那是**单角色**换算点(角色详情/编队页都在用), 而羁绊是**全队**系统,
  //   塞进去会让「看某个角色的面板」凭空多出队友装备带来的加成。
  const active = activeBonds(bondCountsOf(characters, party));
  const bondMods = mergeMods(active.map((a) => a.tier.mods)); // 每人各叠一份
  const bondPartyMods = mergeMods(active.map((a) => a.tier.partyMods)); // 全队只叠一份
  const auraMods = mergeMods(session.auras.map((aura) => aura.mods));

  const alive = session.party.filter((p) => p.alive);
  const battleDeck: Card[] = alive.flatMap((p) => structuredClone(characters[p.charId].deck));
  const allies: AllyInit[] = alive.map((p, i) => {
    const c = getCharacter(p.charId);
    // 局外第一层(角色基础 + 装备)已由 deriveStats 算完; 羁绊是叠在它之上的第二层。
    let s = applyModifier(deriveStats(characters[p.charId]), bondMods);
    s = applyModifier(s, auraMods);
    // ★ 抽牌数/手牌上限是**小队合计**属性(engine/stats.partyDrawCount 按上阵角色求和),
    //   每人加一份会变成 3 人队三倍。所以这类只给队伍第一人加。
    if (i === 0) s = applyModifier(s, bondPartyMods);
    const characterState = characters[p.charId];
    return {
      id: c.id,
      charId: c.id,
      name: c.name,
      emoji: c.emoji,
      stats: s, // ★ 局外已结算的完整面板(角色基础 + 装备 + 羁绊)
      startHp: p.hp, // ★ 血量跨战斗继承
      startHpLimit: p.hpLimit,
      pollution: characterState.pollution,
      sick: characterState.sick,
      quirks: [...characterState.quirks],
    };
  });

  const mod = encounterModifier(session.energy);
  const meta = battleMeta(characters, party);
  // ★ 负重在**开战瞬间快照**(设计文档 §6.3): 引擎不认识背包, 只收这一个有效负重点数。
  const burden = burdenNow(session);
  const squadMods = squadModsOf(squadTalent.badgeId, squadTalent.nodes);
  useBattleStore
    .getState()
    .init(
      encounterId,
      { allies, deck: battleDeck, burden, squadMods },
      undefined,
      mod,
      meta,
    );
}

// 远征收尾的落袋 —— 积分 + 实物一起进城镇, 只有这一个出口。
// ★ 团灭时 session.backpack 与 session.loot 已被 explore/session.loseEverything 清零,
//   所以这里**无条件**调用即可: 惩罚的真相点只在 EXPLORE_RULES.wipe 一处, 不在这里再判一次。
//   投递口寄回的 shipped 不受团灭影响, 因此照样入仓 —— 那是背包玩法唯一的保险手段(§6.5)。
// ★ 生命三段的前两段一并落档: 撤离/通关/团灭都走这里, 所以「打掉的血与体力极限跨日传承」
//   这条规则只有这一个出口。阵亡成员按 1/1 保底(夹取在 townStore.syncExpeditionStatus)。
function bankEverything(session: {
  loot: number;
  backpack: ItemStack[];
  shipped: ItemStack[];
  party: { charId: string; hp: number; hpLimit: number; alive: boolean }[];
}) {
  const town = useTownStore.getState();
  town.syncExpeditionStatus(
    session.party.map((member) => ({
      charId: member.charId,
      hp: member.alive ? member.hp : 1,
      hpLimit: member.alive ? member.hpLimit : 1,
      // 污染值始终由城镇侧即时维护，这里在回城时和最终 HP 一起明确落档。
      pollution: town.characters[member.charId]?.pollution ?? 0,
    })),
  );
  town.bankLoot(session.loot);
  town.deposit([...session.shipped, ...session.backpack]);
  const exp = town.grantExpEach(useExploreStore.getState().consumePendingExp());
  if (exp.length) {
    useRunStore.setState({ expReport: exp });
  }
}

export const useRunStore = create<RunStore>((set, get) => ({
  screen: "menu",
  mapId: null,
  expReport: [],
  lastResult: null,
  lastLoot: 0,
  lastDrops: [],
  battleSettled: false,
  lastDropK: 0,
  lastDropTier: null,
  lastChallengeBonus: 0,
  lastChallenges: [],
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
  // ⚠ 会话本身由 ui/sortie 那边 open() —— 这里只切页, 与 openFormation 保持同一粒度。
  openSortie: () => set({ screen: "sortie" }),

  startExpedition: (mapId, backpack = []) => {
    useExploreStore.getState().start(mapId, partySnapshot(), undefined, backpack);
    set({
      mapId,
      expReport: [],
      lastResult: null,
      lastLoot: 0,
      lastDrops: [],
      battleSettled: false,
      lastDropK: 0,
      lastDropTier: null,
      lastChallengeBonus: 0,
      lastChallenges: [],
      screen: "explore",
    });
  },

  chooseEventOption: (index) => {
    const explore = useExploreStore.getState();
    const result = explore.pickOption(index);
    if (!result) return null;
    const session = useExploreStore.getState().session;
    if (!session) return result;
    const hits = applyPendingContamination(session.party.map((p) => p.charId));
    if (hits.length) useExploreStore.getState().fillStoryPlaceholders(hits);
    return result;
  },

  // 本轮线路披露完 → 建局开打(设计文档 §3.1 的固定档位表)。
  // ⚠ 会话的推进不在这里: startRoundBattle 已经把 phase 打成 inBattle 并写下 pendingEncounterId,
  //   本函数只负责「照着它建一场战斗并切页」。没有待打的战斗就什么都不做(幂等护栏)。
  //   ★ 老虎机战斗签接上之后, 变的只是 pendingEncounterId 怎么定, 这条路径不动。
  enterEncounter: () => {
      if (get().screen !== "explore") return;
    const s = useExploreStore.getState().session;
    if (!s?.pendingEncounterId) return;
    launchBattle(s.pendingEncounterId, s.pendingIsBoss);
    set({ screen: "battle" });
  },

  resolveBattle: () => {
    if (get().screen !== "battle") return; // 幂等护栏: 防重复触发重复发经验
    if (get().battleSettled) return;
    const battle = useBattleStore.getState().battle;
    const session = useExploreStore.getState().session;
    if (!battle || !session?.pendingEncounterId) return;
    if (battle.phase !== "won" && battle.phase !== "lost") return;

    const won = battle.phase === "won";
    const challengeBonus = won ? earnedChallengeBonus(battle) : 0;
    const lastDropK = dropCoefficient(session, challengeBonus);
    const lastDropTier = energyTier(session.energy);
    const lastChallenges = battle.challenges.map((run) => ({ ...run }));
    // ★ 从战斗单位而非遭遇战定义里取敌人 defId —— 遭遇战改造器(EncounterModifier.extraEnemies)
    //   追加进来的敌人不在 EncounterDef.enemies 里, 也要计入经验与掉落。
    //   ⚠ 当前能量档位只注入敌方状态(过载层数, 见 explore/session.ts encounterModifier),
    //   并没有使用 extraEnemies 追加敌人; 这条取值逻辑是给动态难度机制预留的通用路径。
    const enemyDefIds = battle.enemyIds.map((id) => (battle.combatants[id] as Enemy).enemyDefId);

    // 战斗单位的最终血量回填给探索层 —— 下一场以此开局
    const survivors = battle.playerIds.map((id) => {
      const a = battle.combatants[id] as Ally;
      return {
        charId: a.charId,
        hp: a.hp,
        hpLimit: a.hpLimit,
        maxHp: a.maxHp,
        alive: a.alive,
      };
    });

    useTownStore.getState().syncBattleConditions(
      battle.playerIds.map((id) => {
        const a = battle.combatants[id] as Ally;
        return { charId: a.charId, pollution: a.pollution, sick: a.sick, quirks: a.quirks };
      }),
    );

    const explore = useExploreStore.getState();
    explore.settleBattle(won, survivors, enemyDefIds, challengeBonus);
    // 战斗回合消耗(explore/rules.ts energyPerBattleRound): 打得越久, 粒子掉得越多。
    // ★ 必须在 settleBattle 之后 —— 掉落系数/经验倍率读的是战前能量, 提前扣会削掉本场收益。
    // ★ BOSS 战豁免(胜负均不扣): 那一场打完远征就结束了。isBoss 只能读 settleBattle
    //   **之前**的快照 —— finishBattle 会把 pendingIsBoss 清成 false。
    if (!session.pendingIsBoss) explore.spendBattleEnergy(battle.round);
    const after = useExploreStore.getState().session;

    if (!won) {
      // 战败即团灭。背包已在 settleBattle 里丢干净, 这里只把寄回的落袋。
      if (after) bankEverything(after);
      set({
        screen: "defeat",
        lastResult: "lost",
        expReport: [],
        lastLoot: 0,
        lastDrops: [],
        battleSettled: false,
        lastDropK: 0,
        lastDropTier: null,
        lastChallengeBonus: 0,
        lastChallenges: [],
      });
      return;
    }

    // 经验按能量档位倍率即时入账(与积分不同 —— 积分要活着回城才落袋, 经验打完就是你的)
    const town = useTownStore.getState();
    const mult = rewardMultiplier(session.energy);
    const baseExp = enemyDefIds.reduce((sum, id) => sum + getEnemyDef(id).exp, 0);
    const exp = Math.round(baseExp * mult);
    const expReport = town.grantExp(
      session.party.filter((p) => p.alive).map((p) => p.charId),
      exp,
    );

    const lastDrops = after?.pendingLoot ?? [];

    set({
      screen: "battle",
      battleSettled: true,
      expReport,
      lastResult: "won",
      lastLoot: (after?.loot ?? 0) - session.loot,
      lastDrops,
      lastDropK,
      lastDropTier: {
        tier: lastDropTier.tier,
        name: lastDropTier.name,
        color: lastDropTier.color,
        rewardMultiplier: lastDropTier.rewardMultiplier,
      },
      lastChallengeBonus: challengeBonus,
      lastChallenges,
    });
  },

  confirmExpReport: () => {
    const session = useExploreStore.getState().session;
    if (!session) return set({ screen: "town" });
    if (session.pendingLoot.length || session.pendingBoons.length || session.pendingCardOffer) return;

    if (session.phase === "cleared") {
      bankEverything(session);
      useBattleStore.getState().clear();
      set({
        screen: "victory",
        lastResult: "won",
        battleSettled: false,
        lastDropK: 0,
        lastDropTier: null,
        lastChallengeBonus: 0,
        lastChallenges: [],
      });
      return;
    }
    useBattleStore.getState().clear();
    set({
      screen: "explore",
      expReport: [],
      battleSettled: false,
      lastDropK: 0,
      lastDropTier: null,
      lastChallengeBonus: 0,
      lastChallenges: [],
    });
  },

  // 背包 → 装备槽。★ 顺序是刻意的: **先**把新件从背包取走再校验旧件放不放得下 ——
  // 同类装备互换时净占格为 0, 反过来先放旧件会在满包时误判为"装不下"。
  // 任何一步失败都把背包恢复原状(新件刚腾出的格子必然还在, 放回必成)。
  equipFromBackpack: (charId, uid) => {
    const explore = useExploreStore.getState();
    const session = explore.session;
    if (!session || !canOpenBackpack(session)) return false;
    if (!session.party.some((p) => p.charId === charId)) return false;
    const stack = session.backpack.find((st) => st.uid === uid);
    if (!stack) return false;
    const def = getItemDef(stack.itemId);
    if (def.category !== "equipment" || !def.slot) return false;

    const taken = explore.takeBackpackItem(uid);
    if (!taken) return false;
    const town = useTownStore.getState();
    const old = town.characters[charId]?.equipped?.[def.slot] ?? null;
    if (old && !useExploreStore.getState().putBackpackItems([old])) {
      useExploreStore.getState().putBackpackItems([taken]); // 回滚
      return false;
    }
    town.wearStack(charId, taken);
    syncMemberStats(charId);
    return true;
  },

  // 装备槽 → 背包。★ 先校验容量再卸 —— 满包时不能出现"卸下来了但没地方放"的中间态。
  unequipToBackpack: (charId, slot) => {
    const explore = useExploreStore.getState();
    const session = explore.session;
    if (!session || !canOpenBackpack(session)) return false;
    if (!session.party.some((p) => p.charId === charId)) return false;
    const town = useTownStore.getState();
    const stack = town.characters[charId]?.equipped?.[slot];
    if (!stack) return false;
    if (!explore.putBackpackItems([stack])) return false;
    town.takeOffStack(charId, slot);
    syncMemberStats(charId);
    return true;
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

    if (
      session.phase !== "wiped" &&
      session.phase !== "retreated" &&
      session.phase !== "cleared"
    ) {
      return;
    }

    applyPendingContamination(session.party.map((p) => p.charId));

    if (session.phase === "wiped") {
      // 团灭: session.backpack 已被 loseEverything 清空, 但**投递口寄回的仍然算数**(§6.5)。
      bankEverything(session);
      set({
        screen: "defeat",
        lastResult: "lost",
        expReport: [],
        lastLoot: 0,
        lastDrops: [],
        battleSettled: false,
        lastDropK: 0,
        lastDropTier: null,
        lastChallengeBonus: 0,
        lastChallenges: [],
      });
      return;
    }
    bankEverything(session);
    set({
      screen: "victory",
      lastResult: session.phase === "cleared" ? "won" : "retreat",
    });
  },

  resolvePendingHeal: (charId, limit) => {
    const action = useExploreStore.getState().session?.pendingActions[0];
    if (!action || (limit ? action.kind !== "healLimitOne" : action.kind !== "healOne")) return;
    useExploreStore.getState().resolvePendingHealing(charId, limit);
  },

  resolvePendingQuirk: (charId, quirkId) => {
    const action = useExploreStore.getState().session?.pendingActions[0];
    if (!action || action.kind !== "cureQuirk") return;
    const ids = action.scope === "party" ? alivePartyIds() : charId ? [charId] : [];
    if (!ids.length) return;
    const town = useTownStore.getState();
    for (const id of ids) {
      for (let i = 0; i < action.count; i++) {
        town.cureQuirk(id, id === charId ? quirkId : undefined);
      }
    }
    useExploreStore.getState().resolvePendingAction();
  },

  resolvePendingPollution: (charId) => {
    const action = useExploreStore.getState().session?.pendingActions[0];
    if (!action || action.kind !== "reducePollution") return;
    const ids = action.scope === "party" ? alivePartyIds() : charId ? [charId] : [];
    if (!ids.length) return;
    const town = useTownStore.getState();
    for (const id of ids) town.reducePollution(id, action.amount);
    useExploreStore.getState().resolvePendingAction();
  },

  resolvePendingPurification: (charId, uids) => {
    const action = useExploreStore.getState().session?.pendingActions[0];
    if (!action || action.kind !== "purifyCards") return;
    const ids = action.scope === "party" ? alivePartyIds() : charId ? [charId] : [];
    if (!ids.length) return;
    const town = useTownStore.getState();
    for (const id of ids) {
      town.purifyCards(id, action.count, id === charId ? uids : undefined);
    }
    useExploreStore.getState().resolvePendingAction();
  },

  // ★ 一趟出击的收尾 = **时间推进一日**(据点商店的主刷新机制就靠它)。
  // ⚠ 只在这里推进: enterTown 是从主菜单进据点(没出击过), finishExpedition 只是切到
  //   结算页(玩家还没回到据点), 两处都不该 +1 天。
  backToTown: () => {
    useBattleStore.getState().clear();
    useExploreStore.getState().clear();
    useTownStore.getState().advanceDay();
    set({
      screen: "town",
      mapId: null,
      expReport: [],
      lastResult: null,
      lastLoot: 0,
      lastDrops: [],
      battleSettled: false,
      lastDropK: 0,
      lastDropTier: null,
      lastChallengeBonus: 0,
      lastChallenges: [],
    });
  },

  backToMenu: () => {
    useBattleStore.getState().clear();
    useExploreStore.getState().clear();
    set({
      screen: "menu",
      mapId: null,
      expReport: [],
      lastResult: null,
      lastLoot: 0,
      lastDrops: [],
      battleSettled: false,
      lastDropK: 0,
      lastDropTier: null,
      lastChallengeBonus: 0,
      lastChallenges: [],
    });
  },
}));
