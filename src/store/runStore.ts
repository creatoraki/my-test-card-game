// Zustand store: 一次"远征"的流程编排 —— 界面路由 + 探索路由图与战斗之间的往返。
// 卡组/队伍/养成不在这里 —— 它们是城镇的持久资产, 见 townStore。
// 路由会话本身也不在这里 —— 见 exploreStore; 本 store 只负责"本轮区域走完后真的建一场推进战斗"
// 这件事, 因为只有它同时认识 battleStore、exploreStore 与界面路由。

import { create } from "zustand";
import type { AllyInit, Ally, BattleState, Card, ChallengeRun, Enemy, QuirkId } from "../engine";
import { RULES, applyModifier, earnedChallengeBonus, getStatus } from "../engine";
import {
  BOND_DEFS,
  ASSEMBLE_REWARD_POOLS,
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
import { commitTownBackup, snapshotTownProfile } from "./expeditionBackup";
import { SORTIE_RELIC_LIMIT } from "./sortieStore";
import {
  bondCountsOf,
  deriveStats,
  useTownStore,
  vitalsOf,
  type ContaminationHit,
  type ExpGain,
} from "./townStore";

// ★ "formation"(编队) 是据点的**一级全屏页**, 不是设施内浮层 ——
//   入口是据点全景右下的「编队」按钮(见 ui/town/TownScreen), 医疗室提供「复苏舱」。
//   回据点走 ScreenTransition 的默认淡出淡入。
//   ⚠⚠ **角色详情不是一个 screen**: 它是编队页内部的第二种态, 点卡不跳页, 由
//   ui/character/FormationScreen/formationMorph 做一次同页元素重组。旧版曾经是
//   screen === "charDetail" + 原生 View Transition 共享元素过场, 已随那次改版整体删除 ——
//   本 store 因此不该再出现 detailCharId 之类的表现层字段。
// ★ "sortie"(出击) 同样是据点的一级全屏页: 入口是据点全景右下的「出击」按钮, 内部分两步
//   (选地图 → 备物资, step 存在 store/sortieStore 里)。它取代了原先埋在控制终端设施内的
//   「下降舱」抽屉 —— 出击是核心动线, 不该要玩家先播一段进设施换场才找得到。
// ★ "elevator" 是纯演出中转页, 没有任何交互与规则; 下行进探索、上行回据点, 探索会话要等下行演出结束后才建立。
export type Screen =
  | "menu"
  | "town"
  | "formation"
  | "sortie"
  | "elevator"
  | "explore"
  | "battle"
  | "victory"
  | "defeat";

export type RunResult = "won" | "lost" | "retreat";

type ElevatorRide =
  | { dir: "down"; mapId: string; backpack: ItemStack[] }
  | { dir: "up" };

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
  lastBountyBonus: number;
  lastChallenges: ChallengeRun[];

  enterTown: () => void;
  openFormation: () => void; // 据点全景右下「编队」→ 全屏编队页(角色详情是它内部的一种态, 不占 screen)
  openSortie: () => void; // 据点全景右下「出击」→ 全屏出击页(选地图 + 备物资)
  // 物资准备完毕 → 进路由图。backpack = 出发时装好的物资(见 store/sortieStore)。
  startExpedition: (mapId: string, backpack?: ItemStack[]) => void;
  elevatorRide: ElevatorRide | null;
  beginDescent: (mapId: string, backpack?: ItemStack[]) => void;
  beginAscent: () => void;
  finishRide: () => void;
  chooseEventOption: (index: number) => import("../explore/types").ExploreState | null;
  enterEncounter: () => void; // 本轮的推进战斗已定 → 建局开打
  resolveBattle: () => void; // 战斗结束: 回填血量/结算积分与经验/推进会话
  // ---- 战斗设置面板的两个出口(见 ui/battle/BattleSettingsPanel) ----
  restartBattle: () => void; // 重打这一场: 按进战前的队伍状态重新建局
  retreatFromBattle: () => void; // 战斗中撤退: 本场作废 + 整趟远征收尾落袋回城
  confirmExpReport: () => void; // 战斗小结确认 → 回路由图, 或进通关结算
  // ---- 远征途中换装(探索页的角色档案 Modal) ----
  // 装备槽在城镇侧、背包在探索侧, 两边只有本 store 同时认识 —— 故编排放在这里。
  // 返回 false = 没做任何改动(阶段不允许 / 背包装不下 / 目标非法), UI 据此飘一条提示。
  equipFromBackpack: (charId: string, uid: string) => boolean;
  unequipToBackpack: (charId: string, slot: EquipSlot) => boolean;
  resolvePendingHeal: (charId: string, limit: boolean) => void;
  resolvePendingQuirk: (charId?: string, quirkId?: QuirkId) => void;
  resolvePendingPollution: (charId?: string) => void;
  resolvePendingPurification: (charId: string | undefined, uids: string[]) => void;
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
  // 背包遗物与挑战契约的属性修正走同一条合成 —— 引擎不认识物品容器,
  // 它只收一份算好的面板。★ 一处合成即同时覆盖推进战斗与节点战斗。
  // ⚠ 这一份修正对**每一名角色各叠一次** ⇒ 挑战 mods 里绝不能出现 drawCount / handLimit /
  //   burdenAdapt 这类「小队合计」属性(会被叠成人数倍), 见 data/exploreTrials.ts 抬头。
  const relicMods = mergeMods([
    ...session.backpack
      .map((stack) => getItemDef(stack.itemId).relic?.mods)
      .filter((mods): mods is NonNullable<typeof mods> => Boolean(mods)),
    ...session.trials.map((trial) => trial.mods),
  ]);
  const relicIds = session.backpack
    .filter((stack) => getItemDef(stack.itemId).category === "relic")
    .map((stack) => stack.itemId);

  const alive = session.party.filter((p) => p.alive);
  const battleDeck: Card[] = alive.flatMap((p) => structuredClone(characters[p.charId].deck));
  const allies: AllyInit[] = alive.map((p, i) => {
    const c = getCharacter(p.charId);
    // 局外第一层(角色基础 + 装备)已由 deriveStats 算完; 羁绊是叠在它之上的第二层。
    let s = applyModifier(deriveStats(characters[p.charId]), bondMods);
    s = applyModifier(s, relicMods);
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
      { allies, deck: battleDeck, burden, squadMods, squadBuffRewardPools: ASSEMBLE_REWARD_POOLS, relics: relicIds },
      undefined,
      mod,
      meta,
    );
}

// 战斗单位的最终三段生命 → 探索层的回填口径。
// ★ 正常结算(resolveBattle)与战斗中撤退(retreatFromBattle)共用 —— 两处各抄一份迟早对不上。
function survivorsFrom(
  battle: BattleState,
  session: { party: { charId: string; hpLimit: number }[] },
) {
  return battle.playerIds.map((id) => {
    const a = battle.combatants[id] as Ally;
    const previous = session.party.find((member) => member.charId === a.charId);
    return {
      charId: a.charId,
      hp: a.hp,
      hpLimit: a.hpLimit,
      limitLoss: Math.max(0, (previous?.hpLimit ?? a.hpLimit) - a.hpLimit),
      alive: a.alive,
    };
  });
}

// 战斗单位的污染/生病/怪癖 → 城镇存档。回填口径同样由结算与撤退共用。
function syncConditionsFrom(battle: BattleState): void {
  useTownStore.getState().syncBattleConditions(
    battle.playerIds.map((id) => {
      const a = battle.combatants[id] as Ally;
      return { charId: a.charId, pollution: a.pollution, sick: a.sick, quirks: a.quirks };
    }),
  );
}

// 阵亡装备只从城镇槽位原子取出一次, 并并入本趟战利品盘。
// 团灭时战利品盘已经由 loseEverything 清空, 阵亡装备随之丢失。
function settleFallenGear(): void {
  const ids = useExploreStore.getState().takeUnsettledFallen();
  if (!ids.length) return;

  const town = useTownStore.getState();
  const dropped = ids.flatMap((charId) =>
    (["weapon", "armor", "trinket"] as EquipSlot[])
      .map((slot) => town.takeOffStack(charId, slot))
      .filter((stack): stack is ItemStack => Boolean(stack)),
  );
  const session = useExploreStore.getState().session;
  if (dropped.length && session && session.phase !== "wiped") {
    useExploreStore.getState().addFallenGear(dropped);
  }
}

// 远征收尾的落袋 —— 积分 + 实物一起进城镇, 只有这一个出口。
// ★ 团灭时 session.backpack 与 session.loot 已被 explore/session.loseEverything 清零,
//   所以这里**无条件**调用即可: 惩罚的真相点只在 EXPLORE_RULES.wipe 一处, 不在这里再判一次。
//   投递口寄回的 shipped 不受团灭影响, 因此照样入仓 —— 那是背包玩法唯一的保险手段(§6.5)。
// ★ 生命三段的前两段一并落档: 撤离/通关/团灭都走这里, 所以「打掉的血与体力极限跨日传承」
//   这条规则只有这一个出口。阵亡成员不再回填, 由 markFallen 接管。
function bankEverything(session: {
  loot: number;
  backpack: ItemStack[];
  shipped: ItemStack[];
  party: { charId: string; hp: number; hpLimit: number; alive: boolean }[];
}) {
  const town = useTownStore.getState();
  town.syncExpeditionStatus(
    session.party.filter((member) => member.alive).map((member) => ({
      charId: member.charId,
      hp: member.hp,
      hpLimit: member.hpLimit,
      // 污染值始终由城镇侧即时维护，这里在回城时和最终 HP 一起明确落档。
      pollution: town.characters[member.charId]?.pollution ?? 0,
    })),
  );
  const fallenIds = session.party.filter((member) => !member.alive).map((member) => member.charId);
  if (fallenIds.length) town.markFallen(fallenIds);
  town.bankLoot(session.loot);
  town.recordSortieRelics(
    session.backpack
      .filter((stack) => getItemDef(stack.itemId).category === "relic")
      .map((stack) => stack.itemId)
      .slice(0, SORTIE_RELIC_LIMIT),
  );
  town.deposit([...session.shipped, ...session.backpack]);
  const exp = town.grantExpEach(useExploreStore.getState().consumePendingExp());
  useExploreStore.getState().recordExpGain(exp.reduce((total, gain) => total + gain.gained, 0));
  if (exp.length) {
    useRunStore.setState({ expReport: exp });
  }
  // 探索期对 townStore 的散点写入到这里才正式落袋, 同时提交出击快照。
  commitTownBackup();
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
  lastBountyBonus: 0,
  lastChallenges: [],
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

  beginDescent: (mapId, backpack = []) => {
    set({ elevatorRide: { dir: "down", mapId, backpack }, screen: "elevator" });
  },

  beginAscent: () => {
    const screen = get().screen;
    if (screen !== "victory" && screen !== "defeat") return;
    set({ elevatorRide: { dir: "up" }, screen: "elevator" });
  },

  startExpedition: (mapId, backpack = []) => {
    // 探索期 townStore 的散点写入统一由出击快照兜底, 中途刷新时整档回滚。
    snapshotTownProfile();
    const town = useTownStore.getState();
    const ownedRelicIds = [
      ...town.storage,
      ...backpack,
    ]
      .filter((stack) => getItemDef(stack.itemId).category === "relic")
      .map((stack) => stack.itemId);
    useExploreStore.getState().start(mapId, partySnapshot(), undefined, backpack, ownedRelicIds);
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
      lastBountyBonus: 0,
      lastChallenges: [],
      screen: "explore",
    });
  },

  finishRide: () => {
    if (get().screen !== "elevator") return;
    const ride = get().elevatorRide;
    set({ elevatorRide: null });
    if (!ride) return get().enterTown();
    if (ride.dir === "up") return get().backToTown();
    get().startExpedition(ride.mapId, ride.backpack);
  },

  chooseEventOption: (index) => {
    const explore = useExploreStore.getState();
    const result = explore.pickOption(index);
    if (!result) return null;
    settleFallenGear();
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
    const bountyHunterStacks = battle.playerIds.reduce((total, id) => {
      const status = getStatus(battle.combatants[id], "bountyHunter");
      return total + (status?.stacks ?? 0);
    }, 0);
    const bountyBonus = won ? bountyHunterStacks * 0.3 : 0;
    const lastDropK = dropCoefficient(session, challengeBonus, bountyBonus);
    const lastDropTier = energyTier(session.energy);
    const lastChallenges = battle.challenges.map((run) => ({ ...run }));
    // ★ 从战斗单位而非遭遇战定义里取敌人 defId —— 遭遇战改造器(EncounterModifier.extraEnemies)
    //   追加进来的敌人不在 EncounterDef.enemies 里, 也要计入经验与掉落。
    //   ⚠ 当前能量档位只注入敌方状态(过载层数, 见 explore/session.ts encounterModifier),
    //   并没有使用 extraEnemies 追加敌人; 这条取值逻辑是给动态难度机制预留的通用路径。
    const enemyDefIds = battle.enemyIds
      .filter((id) => !(battle.combatants[id] as Enemy).fled)
      .map((id) => (battle.combatants[id] as Enemy).enemyDefId);

    // 战斗单位的最终血量回填给探索层 —— 下一场以此开局
    const survivors = survivorsFrom(battle, session);

    syncConditionsFrom(battle);

    const explore = useExploreStore.getState();
    explore.settleBattle(won, survivors, enemyDefIds, challengeBonus, bountyBonus);
    settleFallenGear();
    for (const id of battle.playerIds) {
      syncMemberStats((battle.combatants[id] as Ally).charId);
    }
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
        lastBountyBonus: 0,
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
    useExploreStore.getState().recordExpGain(
      expReport.reduce((total, gain) => total + gain.gained, 0),
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
      lastBountyBonus: bountyBonus,
      lastChallenges,
    });
  },

  // 重新开始这场战斗。战果只在 resolveBattle 才回填探索层, 所以此刻 session.party 仍是
  // **进战前**的三段生命 —— 直接照它重新建局即可, 不需要任何回滚。
  // ⚠ launchBattle 里的 applyPendingContamination 在首次建局时已把待结算污染消费干净,
  //   这里拿到的是空请求, 不会重复污染卡组。
  // ⓘ battleStore.init 会把 seq +1, BattleScreen 的 [battleSeq] effect 随即取消在途 timeline、
  //   清定时器并重置全部分镜/手牌状态 —— 与「换一场战斗」同一条路径, 故演出播放中重开也安全。
  restartBattle: () => {
    if (get().screen !== "battle" || get().battleSettled) return;
    const battle = useBattleStore.getState().battle;
    if (!battle || battle.phase === "won" || battle.phase === "lost") return;
    const session = useExploreStore.getState().session;
    if (!session?.pendingEncounterId) return;
    launchBattle(session.pendingEncounterId, session.pendingIsBoss);
  },

  // 战斗中撤退 = 本场作废 + 整趟远征就此收尾。落袋与结算走的是和探索页撤离**完全相同**
  // 的那条路(bankEverything → victory 页 + lastResult: "retreat"), 只是入口不同。
  retreatFromBattle: () => {
    if (get().screen !== "battle" || get().battleSettled) return;
    const battle = useBattleStore.getState().battle;
    if (!battle || battle.phase === "won" || battle.phase === "lost") return;
    const session = useExploreStore.getState().session;
    if (!session) return;

    syncConditionsFrom(battle);
    useExploreStore.getState().retreatFromBattle(survivorsFrom(battle, session));
    settleFallenGear();
    for (const id of battle.playerIds) {
      syncMemberStats((battle.combatants[id] as Ally).charId);
    }

    const after = useExploreStore.getState().session;
    if (after) bankEverything(after);
    useBattleStore.getState().clear();
    // ⚠ 这里**刻意不写 expReport** —— bankEverything 刚用 setState 把本趟的经验结算写进来,
    //   在这个 set 里带上 expReport: [] 会当场清掉它。finishExpedition 的撤离分支同此口径。
    set({
      screen: "victory",
      lastResult: "retreat",
      battleSettled: false,
      lastDropK: 0,
      lastDropTier: null,
      lastChallengeBonus: 0,
      lastBountyBonus: 0,
      lastChallenges: [],
    });
  },

  confirmExpReport: () => {
    const session = useExploreStore.getState().session;
    if (!session) return set({ screen: "town" });
    if (session.pendingLoot.length || session.pendingBoons.length || session.pendingCardOffer) return;

    if (session.phase === "cleared") {
      bankEverything(session);
      useTownStore.getState().markMapCleared(session.mapId);
      useBattleStore.getState().clear();
      set({
        screen: "victory",
        lastResult: "won",
        battleSettled: false,
        lastDropK: 0,
        lastDropTier: null,
        lastChallengeBonus: 0,
        lastBountyBonus: 0,
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
      lastBountyBonus: 0,
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
    settleFallenGear();
    const settledSession = useExploreStore.getState().session;
    if (!settledSession) return set({ screen: "town" });

    if (settledSession.phase === "wiped") {
      // 团灭: session.backpack 已被 loseEverything 清空, 但**投递口寄回的仍然算数**(§6.5)。
      bankEverything(settledSession);
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
    bankEverything(settledSession);
    if (settledSession.phase === "cleared") {
      useTownStore.getState().markMapCleared(settledSession.mapId);
    }
    set({
      screen: "victory",
      lastResult: settledSession.phase === "cleared" ? "won" : "retreat",
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
      syncMemberStats(id);
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
      lastBountyBonus: 0,
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
