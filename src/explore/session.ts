// ============================================================================
// 探索会话 —— 纯 TS, 无 React、无副作用。所有函数直接修改传入的 ExploreState,
// 由 store 层负责 structuredClone 后再调用(与 engine/battle.ts 同惯例)。
//
// 一轮的生命周期(设计文档 §1.2):
//   generateRound ─▶ generating ─finishGenerating─▶ sealed ─startReveal─▶ revealing
//                                                                          │
//     advancing ◀─chooseEntry─ choosingEntry ◀─finishReveal────────────────┘
//         │
//         └─arriveNode─▶ landed ─chooseOption─▶ resolving ─confirmNode─▶ atNode
//                                                                          │
//              ┌────────── pushOn(currentSegment < 4) ──────────────────────┤
//              ▼                                                            ▼
//          advancing                                   leaveRegion / 已走满 4 段
//                                                                          │
//                     leaving ─finishLeaving─▶ roundBattle ◀───────────────┘
//                    (还有剩余线路可走时才经过它, 见 leaveRegion)
//                                   │ engageRoundBattle
//                                   ▼
//                                inBattle ─finishBattle─▶ 下一轮 / cleared / wiped
//
// ★ generating / sealed 是「新区域的浮现仪式」那两拍: 图先花 2 秒逐段浮现(此时全锁),
//   浮现完桥接仍然遮着 —— 玩家必须主动按「探索路线」才开始限时揭示, 一轮只能按一次。
//
// ★ landed 是「已经知道落在哪个节点上, 但什么都还没发生」的那一拍: 浮层在这里给出两个分支。
//
// ★ atNode 是这套玩法的核心决策点: 继续推进(按推进段扣 3/3/4/5 粒子, 深段更贵也更不确定)
//   还是 前往下一区域。依据是玩家对自己记忆的置信度, 深段的高消耗是它的第二道刹车。
//
// ⚠ 战斗不再是路由图上的终点: 每轮线路走完后展示战斗事件, 再打推进战斗。
// ============================================================================

import { rngInt, shuffle } from "../engine/rng";
import { RULES } from "../engine/rules";
import { burdenValue } from "../engine/stats";
import type { EncounterModifier } from "../engine/types";
import {
  ROLLABLE_BOND_IDS,
  EVENT_POOLS,
  bondPool,
  getEnemyDef,
  getNpcEvent,
  getEventPool,
  equipmentDefsBySlot,
  getItemDef,
  getItemFamily,
  getMap,
  mapEquipRarities,
  makeRolledItemStack,
  makeItemStack,
} from "../data";
import { pickByQuality, rollDropTable, type DropContext } from "../items/drops";
import {
  addToContainer,
  countByItemId,
  findByUid,
  occupiedSlots,
  consumeItems,
  removeByUid,
  stackSlots,
} from "../items/inventory";
import type { ItemRarity, ItemStack } from "../items/types";
import { generateSegments, lanePath, traceSegment } from "./route";
import { rollBoons, rollEquipCrate, rollModuleCrate } from "./boons";
import { EXPLORE_RULES, ENERGY_TIERS } from "./rules";
import { closeShop, openShop } from "./shop";
import type {
  BattleTier,
  EnergyTier,
  EventChoice,
  EventOutcome,
  ExploreEffect,
  ExploreState,
  NodeEvent,
  PartySnapshot,
  PendingAction,
  RouteBoard,
  ShopState,
} from "./types";

// ---------------------------------------------------------------------------
// 能量换算 —— 唯一真相点, UI 与战斗生成共用
// ---------------------------------------------------------------------------
// ENERGY_TIERS 按 min 降序排列(80 / 60 / 40 / 20 / 0), 故第一个 min <= energy 的就是当前档。
export function energyTier(energy: number): EnergyTier {
  for (const t of ENERGY_TIERS) if (energy >= t.min) return t;
  return ENERGY_TIERS[ENERGY_TIERS.length - 1];
}

// 再掉多少点就跌入下一档; 已在末档返回 null(供 UI 决定要不要显示跨档预警)。
export function toNextTier(energy: number): number | null {
  const cur = energyTier(energy);
  const next = ENERGY_TIERS.find((t) => t.tier === cur.tier + 1);
  return next ? energy - next.min + 1 : null;
}

// 即设计文档 §5.1 的 K_energy。同时作用于经验、居民积分与实物掉落。
export function rewardMultiplier(energy: number): number {
  return energyTier(energy).rewardMultiplier;
}

// 第 seg 个推进段(1-based)的节点基础消耗 —— 分档表见 EXPLORE_RULES.energyPerNodeBySegment。
// ⚠ 段号越界(0 = 尚未起步 / 4+ = 已走满)一律取最近一档兜底, 调用方不必自己 clamp。
export function energyCostAt(seg: number): number {
  const bySeg = EXPLORE_RULES.energyPerNodeBySegment;
  const index = Math.max(1, Math.min(seg, bySeg.length)) - 1;
  return bySeg[index];
}

// 统一掉落系数 K =(K_energy + Σ挑战加成)× K_global —— **全加法合成**(设计文档 §5.1)。
// 挑战加成由战斗引擎在 finishBattle 时写入 pendingChallengeBonus。
// 挑战加成只在 finishBattle 时写入快照, 掉落结算随后立即消费。
export function dropCoefficient(s: ExploreState, challengeBonus = s.pendingChallengeBonus): number {
  return (rewardMultiplier(s.energy) + challengeBonus) * EXPLORE_RULES.drop.kGlobal;
}

// K → 品质权重(qualityBias 的右移结果)。表在 EXPLORE_RULES.drop.qualityTable。
export function qualityWeights(k: number): Record<ItemRarity, number> {
  for (const row of EXPLORE_RULES.drop.qualityTable) if (k <= row.maxK) return { ...row.w };
  const last = EXPLORE_RULES.drop.qualityTable[EXPLORE_RULES.drop.qualityTable.length - 1];
  return { ...last.w };
}

const EQUIPMENT_FAMILY_IDS = [...new Set(
  equipmentDefsBySlot()
    .map((def) => def.familyId)
    .filter((familyId): familyId is string => Boolean(familyId)),
)];

// 掉落所需的上下文。★ 唯一一处把 data 层的注册表接进物品层的地方。
export function dropContext(s: ExploreState, k = dropCoefficient(s)): DropContext {
  return {
    weights: qualityWeights(k),
    getDef: getItemDef,
    getFamily: getItemFamily,
    makeStack: (itemId, count, extra) => makeItemStack(itemId, count, extra),
    // ★ 随机羁绊词条的抽取池 —— 只含**已实装**的羁绊, 见 data/bonds.ts 的说明。
    affinityPool: ROLLABLE_BOND_IDS,
    equipmentFamilyIds: EQUIPMENT_FAMILY_IDS,
    equipRarities: mapEquipRarities(s.mapId),
  };
}

// 能量档位 → 遭遇战改造。档位只把对应的 BUFF/状态层数带入战斗。
export function encounterModifier(energy: number): EncounterModifier {
  const t = energyTier(energy);
  return {
    enemyStatuses: t.enemyStatuses.map((st) => ({ ...st })),
  };
}

// 能量档位的改造, 合并成引擎认识的那一个结构。
// 本轮推进战斗的档位。档位在 generateRound 时抽定, 后续读取不再消耗 RNG。
export function battleTierOf(s: ExploreState): BattleTier {
  return s.roundBattleTier;
}

export const BATTLE_TIER_NAME: Record<BattleTier, string> = {
  t1: "难度1",
  t2: "难度2",
  t3: "难度3",
  t4: "难度4",
  t5: "难度5 · BOSS",
};

function pickWeighted<T extends { weight: number }>(s: ExploreState, options: readonly T[]): T {
  const total = options.reduce((sum, option) => sum + Math.max(0, option.weight), 0);
  if (total <= 0) return options[0];
  let roll = rngInt(s, Math.ceil(total * 1000)) / 1000;
  for (const option of options) {
    roll -= Math.max(0, option.weight);
    if (roll < 0) return option;
  }
  return options[options.length - 1];
}

function roundBattleTier(s: ExploreState): BattleTier {
  const map = getMap(s.mapId);
  if (map.battleTierByRound?.length) {
    return map.battleTierByRound[Math.min(s.round - 1, map.battleTierByRound.length - 1)];
  }
  const rows = EXPLORE_RULES.battleTierWeights[Math.min(Math.max(s.round, 1), EXPLORE_RULES.battleTierWeights.length) - 1];
  return pickWeighted(s, rows).tier;
}

function pickNodeBattleTier(s: ExploreState): BattleTier {
  return pickWeighted(s, EXPLORE_RULES.nodeBattleTierWeights).tier;
}

function encounterForTier(s: ExploreState, tier: BattleTier): string | null {
  return shuffle(s, getMap(s.mapId).battleEncounters[tier] ?? [])[0] ?? null;
}

// ---------------------------------------------------------------------------
// 建立会话
// ---------------------------------------------------------------------------
// ★ initialBackpack 排在 seed 之后, 不是「更重要」的第三参 —— 单测按位置传 seed 的调用点
//   有好几处, 插在中间会把它们全部改坏。出发时装填的物资由出击准备界面(ui/sortie)备好。
export function createSession(
  mapId: string,
  party: PartySnapshot[],
  seed?: number,
  initialBackpack: ItemStack[] = [],
): ExploreState {
  const map = getMap(mapId);
  const s: ExploreState = {
    mapId,
    energy: map.startingEnergy,
    loot: 0,
    round: 1,
    roundCount: map.roundCount,
    roundBattleTier: "t1",
    board: null,
    party: party.map((p) => ({ ...p })),
    stats: { kills: 0, expTotal: 0, pickups: 0, energySpent: 0 },
    history: [],
    // 出发时带进来的物资(货柜买的 + 从仓库拿的)。★ 拷贝一份: 准备界面那边还持有原数组,
    // 会话开始后两边不能再互相影响。
    backpack: initialBackpack.map((st) => ({ ...st })),
    shipped: [],
    pendingPickup: [],
    auras: [],
    pendingLoot: [],
    pendingBoons: [],
    pendingCardOffer: null,
    pendingExp: {},
    pendingActions: [],
    pendingStory: [],
    shop: null,
    restNpcId: null,
    chuteOpen: false,
    entryLane: null,
    currentLane: null,
    currentSegment: 0,
    freeNodes: 0,
    pendingNotes: [],
    pendingContaminationCount: 0,
    pendingContaminationEach: 0,
    lateralShiftsLeft: 1,
    roundBattleEventId: null,
    pendingEncounterId: null,
    pendingIsBoss: false,
    pendingBattleTier: null,
    recentEventIds: [],
    battleSource: null,
    pendingChallengeBonus: 0,
    phase: "generating", // 占位: 下面的 generateRound 会重新打一次(第一轮也走完整演出)
    rngState: (seed ?? (Date.now() & 0xffffffff)) >>> 0,
    log: [],
  };

  logLine(s, `接入 ${map.name}`);
  generateRound(s);
  return s;
}

// ---------------------------------------------------------------------------
// 内部原语
// ---------------------------------------------------------------------------
function logLine(s: ExploreState, text: string): void {
  s.log.push(text);
}

function countPickup(s: ExploreState, amount: number): void {
  s.stats.pickups += Math.max(0, amount);
}

function changeEnergy(s: ExploreState, delta: number): void {
  const before = s.energy;
  s.energy = Math.max(0, Math.min(EXPLORE_RULES.energyMax, before + delta));
  s.stats.energySpent += Math.max(0, before - s.energy);
}

export function cheatChangeEnergy(s: ExploreState, delta: number): void {
  changeEnergy(s, delta);
}

// 战斗回合消耗(设计文档 §4.2): 每进行 1 个战斗回合 −1 粒子。
// ⚠ 由 store 层在 finishBattle **之后**调用 —— 掉落系数与经验倍率读的是战前能量,
//   提前扣会削掉本场自己的收益。BOSS 战不调用本函数(那一场打完即通关)。
export function spendBattleEnergy(s: ExploreState, rounds: number): void {
  const cost = Math.max(0, Math.round(rounds)) * EXPLORE_RULES.energyPerBattleRound;
  if (cost <= 0) return;
  changeEnergy(s, -cost);
}

// ---------------------------------------------------------------------------
// 背包 —— 占格、收纳与负重(设计文档 §六)
// ---------------------------------------------------------------------------
// 已占格数。★ 唯一真相点: UI 读数、开战快照、「满载」判定全部读它。
export function backpackSlots(s: ExploreState): number {
  return occupiedSlots(s.backpack, getItemDef);
}

export function backpackFree(s: ExploreState): number {
  return RULES.burden.backpackSlots - backpackSlots(s);
}

// 小队负重适应 A = Σ 上阵角色负重适应(《角色养成设计.md》)。
// ⚠ 算**全员**而不只是存活者 —— 东西是开局就背上的, 队友倒下不会让包变轻。
export function partyBurdenAdapt(s: ExploreState): number {
  return s.party.reduce((n, p) => n + (p.burdenAdapt ?? 0), 0);
}

// 当前有效负重点数。小队合计后按格抵扣，下限由 burdenValue 截到 0。
// 探索页读数与开战快照共用同一个函数。
export function burdenNow(s: ExploreState): number {
  return burdenValue(backpackSlots(s), partyBurdenAdapt(s));
}

// 尝试把一批物品收进背包。装不下的进 pendingPickup 并原样回传 ——
// 由 UI 拉起「替换模式」让玩家取舍(设计文档 §6.4), store 层不替玩家做决定。
export function addItems(
  s: ExploreState,
  stacks: ItemStack[],
): { taken: ItemStack[]; overflow: ItemStack[] } {
  const r = addToContainer(s.backpack, stacks, getItemDef, RULES.burden.backpackSlots);
  s.backpack = r.next;
  countPickup(s, r.taken.length);
  if (r.overflow.length) s.pendingPickup = [...s.pendingPickup, ...r.overflow];
  return { taken: r.taken, overflow: r.overflow };
}

export function addPendingLoot(s: ExploreState, stacks: ItemStack[]): void {
  s.pendingLoot = [...s.pendingLoot, ...stacks];
}

export function takeLoot(s: ExploreState, index: number): boolean {
  const st = s.pendingLoot[index];
  if (!st) return false;
  const result = addToContainer(s.backpack, [st], getItemDef, RULES.burden.backpackSlots);
  if (!result.taken.length) return false;
  s.backpack = result.next;
  countPickup(s, result.taken.length);
  s.pendingLoot = s.pendingLoot.filter((_, i) => i !== index);
  return true;
}

export function takeAllLoot(s: ExploreState): boolean {
  if (!s.pendingLoot.length) return false;
  let changed = false;
  for (let i = s.pendingLoot.length - 1; i >= 0; i--) {
    if (takeLoot(s, i)) changed = true;
  }
  return changed;
}

export function abandonLoot(s: ExploreState): boolean {
  if (!s.pendingLoot.length) return false;
  s.pendingLoot = [];
  return true;
}

// 丢弃一整堆。⚠ 不可撤销 —— 二次确认由 UI 负责(设计文档 §6.4), 这里只认结果。
export function discardStack(s: ExploreState, uid: string): boolean {
  const st = findByUid(s.backpack, uid);
  if (!st || getItemDef(st.itemId).undroppable) return false;
  const next = removeByUid(s.backpack, uid);
  if (next === s.backpack) return false;
  s.backpack = next;
  logLine(s, `丢弃了 ${getItemDef(st.itemId).name}`);
  return true;
}

// ---------------------------------------------------------------------------
// 远征途中换装(探索页角色档案)用的三个搬运函数。
// ⚠ 它们只搬背包与队伍快照 —— 装备到底穿在谁身上是**城镇侧**的状态, 由 runStore 编排两边。
// ---------------------------------------------------------------------------

// 按 uid 把一整堆从背包取出并交给调用方。取不到返回 null, 背包不变。
export function takeFromBackpack(s: ExploreState, uid: string): ItemStack | null {
  const st = findByUid(s.backpack, uid);
  if (!st) return null;
  const next = removeByUid(s.backpack, uid);
  if (next === s.backpack) return null;
  s.backpack = next;
  return { ...st };
}

// 把物品收进背包。★ 容量一律校验: 只要有一件装不下就**整体失败**且背包一格不动 ——
// 换装是原子操作, 不允许出现"新的穿上了、旧的没地方放"的中间态。
export function putIntoBackpack(s: ExploreState, stacks: ItemStack[]): boolean {
  const r = addToContainer(s.backpack, stacks, getItemDef, RULES.burden.backpackSlots);
  if (r.overflow.length) return false;
  s.backpack = r.next;
  return true;
}

// 换装后同步队伍快照。★ 只裁不补(产品口径): 装备变强不回血, 变弱也不会把人打死。
//   hpLimit 是"当前可治疗上限"= 生命上限减去永久损伤, 故随上限增减同步平移, 损伤本身保留。
export function syncPartyVitals(
  s: ExploreState,
  charId: string,
  maxHp: number,
  burdenAdapt: number,
): boolean {
  const member = s.party.find((p) => p.charId === charId);
  if (!member) return false;
  const nextMax = Math.max(1, Math.round(maxHp));
  const delta = nextMax - member.maxHp;
  member.maxHp = nextMax;
  member.hpLimit = Math.max(1, Math.min(nextMax, member.hpLimit + delta));
  const floor = member.alive && member.hp > 0 ? 1 : 0;
  member.hp = Math.max(floor, Math.min(member.hp, member.hpLimit));
  // 负重适应也随装备变 —— 探索页的负重读数与开战快照都读它(见 partyBurdenAdapt)。
  member.burdenAdapt = burdenAdapt;
  return true;
}

// 背包重排序 —— 背包是紧凑数组, 数组顺序 = 玩家看到的格位顺序。
// 把 uid 那一堆抽出来, 插到目标格位上(后面的整体后移), 不是两两交换。
export function reorderBackpack(s: ExploreState, uid: string, toIndex: number): boolean {
  const from = s.backpack.findIndex((st) => st.uid === uid);
  if (from < 0) return false;
  const to = Math.max(0, Math.min(s.backpack.length - 1, toIndex));
  if (from === to) return false;
  const next = s.backpack.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  s.backpack = next;
  return true;
}

// 强制丢弃若干格(「压力门夹层」)。★ 从**最不值钱**的开始丢 ——
// 让系统随机砸掉稀有装备只会让玩家觉得被针对, 而不是觉得付出了代价。
function forceDiscardSlots(s: ExploreState, slots: number): number {
  const rank = (st: ItemStack) => {
    const d = getItemDef(st.itemId);
    return RARITY_RANK[d.rarity] * 10 + (d.category === "equipment" ? 5 : 0);
  };
  const order = s.backpack
    .filter((st) => !getItemDef(st.itemId).undroppable)
    .slice()
    .sort((a, b) => rank(a) - rank(b));
  let dropped = 0;
  for (const st of order) {
    if (dropped >= slots) break;
    dropped += stackSlots(st, getItemDef(st.itemId));
    s.backpack = removeByUid(s.backpack, st.uid);
  }
  return dropped;
}

const RARITY_RANK: Record<ItemRarity, number> = {
  common: 0,
  fine: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
};

// 消耗品的可用阶段 ⊂ canOpenBackpack: 设计文档 §6.4 只点名「不限时的待决策阶段」。
// sealed 时桥接还没揭示, 这会儿喝药既没信息也没意义。
export function canUseItem(s: ExploreState): boolean {
  return (
    s.phase === "choosingEntry" ||
    s.phase === "landed" ||
    s.phase === "shopping" ||
    s.phase === "resolving" ||
    s.phase === "atNode"
  );
}

// 使用一件消耗品的结算结果。★ 污染值存在城镇侧(townStore), 探索会话是纯 TS 摸不到它,
//   故只记录「要降谁、降多少」, 由 exploreStore.useItem 转交 townStore 落地 —— 与
//   pendingActions 的 reducePollution 是同一套分工。note 是效果摘要(不含物品名),
//   完整展示文案由 store 拼「物品名 · 摘要」, 与旧口径一致。
export interface ItemUseResult {
  itemName: string;
  note: string; // 效果摘要; 污染类会被 store 按实际落地值重建
  pollution?: { charId: string; name: string; amount: number };
}

// 指定角色的效果共用: 目标必须是本次远征队伍里**存活**的成员(治疗/修复/降污染都不复活)。
function aliveTargetOf(s: ExploreState, charId: string | undefined): PartySnapshot | null {
  if (!charId) return null;
  return s.party.find((p) => p.charId === charId && p.alive) ?? null;
}

// 使用一件消耗品。★ 不额外消耗净化粒子 —— 携带成本已由负重收过一次, 不重复收费(§6.4)。
// 需要指定目标的 ItemUse 必须带 targetCharId, 否则返回 null(物品不消耗);
// 目标状态无效(满血/无体力极限损伤)同样返回 null 且不消耗; 用不了返回 null。
export function useItem(s: ExploreState, uid: string, targetCharId?: string): ItemUseResult | null {
  if (!canUseItem(s)) return null;
  const st = findByUid(s.backpack, uid);
  if (!st) return null;
  const def = getItemDef(st.itemId);
  if (!def.use) return null;

  // ItemUse → 会话直接修改。★ 翻译表只有这一处 —— items/ 刻意不认识 ExploreState。
  // ⚠ 设计文档《消耗品》§五: 使用前先检查目标与效果是否有效, 检查失败**不消耗物品**。
  const u = def.use;
  let note: string;
  let pollution: ItemUseResult["pollution"];
  switch (u.kind) {
    case "healOne": {
      const target = aliveTargetOf(s, targetCharId);
      if (!target) return null;
      if (target.hp >= target.hpLimit) return null; // 满血无效果
      target.hp = Math.min(target.hpLimit, target.hp + Math.ceil(target.maxHp * u.percent));
      note = `${target.name} 回复 ${Math.round(u.percent * 100)}% 生命`;
      break;
    }
    case "healLimitOne": {
      const target = aliveTargetOf(s, targetCharId);
      if (!target) return null;
      if (target.hpLimit >= target.maxHp) return null; // 没有体力极限损伤(§2.2: 无合法目标)
      const amount = Math.max(0, Math.floor(u.amount));
      const before = target.hpLimit;
      target.hpLimit = Math.min(target.maxHp, target.hpLimit + amount);
      const restored = target.hpLimit - before;
      target.hp = Math.min(target.hpLimit, target.hp + restored);
      note = `${target.name} 体力极限修复 ${restored} 点，当前生命回复等值`;
      break;
    }
    case "reducePollutionOne": {
      const target = aliveTargetOf(s, targetCharId);
      if (!target) return null;
      // 污染值在城镇侧, 有效性检查(目标污染 > 0)由 exploreStore 在进会话前完成;
      // 这里只记录「要降谁、降多少」, 由 store 按实际落地值重建文案。
      pollution = { charId: target.charId, name: target.name, amount: Math.max(0, Math.floor(u.amount)) };
      note = `${target.name} 污染 −${pollution.amount}`;
      break;
    }
    case "openModuleCrate": {
      // 开箱产出走**待拾取框**而不是直接进背包: 箱子占 1 格、模组也占 1 格,
      // 直接塞背包会在背包刚好满时把开出的模组顶掉, 进拾取框玩家还能自己腾格子。
      const stack = rollModuleCrate(s, dropContext(s));
      if (!stack) return null;
      addPendingLoot(s, [stack]);
      note = `开出 ${getItemDef(stack.itemId).name}，已放入待拾取框`;
      break;
    }
    default: {
      // 无需目标的旧效果(healParty / healOneFull / gainEnergy)沿用 applyEffect 翻译。
      const effect: ExploreEffect =
        u.kind === "healParty"
          ? { type: "HEAL_PARTY", percent: u.percent }
          : u.kind === "healOneFull"
            ? { type: "HEAL_ONE_FULL", othersPercent: u.othersPercent }
            : { type: "MODIFY_ENERGY", amount: u.amount };
      note = applyEffect(s, effect);
    }
  }

  s.backpack = st.count > 1
    ? s.backpack.map((stack) => (stack.uid === uid ? { ...stack, count: stack.count - 1 } : stack))
    : removeByUid(s.backpack, uid);
  logLine(s, `使用了 ${def.name} · ${note}`);
  return { itemName: def.name, note, pollution };
}

// 替换模式: 从 pendingPickup 里取第 index 件进背包。格子不够返回 false。
export function takePending(s: ExploreState, index: number): boolean {
  const st = s.pendingPickup[index];
  if (!st) return false;
  if (stackSlots(st, getItemDef(st.itemId)) > backpackFree(s)) return false;
  const r = addToContainer(s.backpack, [st], getItemDef, RULES.burden.backpackSlots);
  if (!r.taken.length) return false;
  s.backpack = r.next;
  countPickup(s, r.taken.length);
  s.pendingPickup = s.pendingPickup.filter((_, i) => i !== index);
  return true;
}

// 放弃拾取: 指定一件, 或(省略 index)全部放弃。
export function abandonPending(s: ExploreState, index?: number): boolean {
  if (!s.pendingPickup.length) return false;
  if (index == null) {
    const next = s.pendingPickup.filter((st) => getItemDef(st.itemId).undroppable);
    if (next.length === s.pendingPickup.length) return false;
    s.pendingPickup = next;
    return true;
  }
  const st = s.pendingPickup[index];
  if (!st || getItemDef(st.itemId).undroppable) return false;
  s.pendingPickup = s.pendingPickup.filter((_, i) => i !== index);
  return true;
}

export function restEat(s: ExploreState, uid: string): boolean {
  if (s.phase !== "resting" || !s.restNpcId || !s.board) return false;
  const event = landedEvent(s);
  if (!event?.hiddenRest) return false;
  const item = findByUid(s.backpack, uid);
  if (!item || item.itemId !== event.hiddenRest.foodItemId) return false;
  s.backpack = consumeItems(s.backpack, event.hiddenRest.foodItemId, 1, uid);
  s.phase = "npcEvent";
  return true;
}

export function restSkip(s: ExploreState): boolean {
  if (s.phase !== "resting") return false;
  s.restNpcId = null;
  s.phase = "atNode";
  return true;
}

export function npcChoices(s: ExploreState): EventChoice[] {
  if (!s.restNpcId) return [];
  return getNpcEvent(s.restNpcId)?.choices ?? [];
}

export function chooseNpcOption(s: ExploreState, index: number): boolean {
  if (s.phase !== "npcEvent") return false;
  const choice = npcChoices(s)[index];
  if (!choice) return false;
  s.pendingNotes = applyChoiceEffects(s, choice, true);
  s.phase = "npcResolving";
  return true;
}

export function confirmNpc(s: ExploreState): boolean {
  if (s.phase !== "npcResolving") return false;
  if (s.pendingPickup.length || s.pendingLoot.length || s.pendingActions.length) return false;
  s.pendingStory = [];
  s.restNpcId = null;
  s.phase = "atNode";
  return true;
}

// 传送投递口(设计文档 §6.5): 把选中的物品提前寄回据点, 安全落袋, 不受后续团灭影响。
// ★ 代价按**一次寄件**收, 不按件数收 —— 否则玩家会为了省能量只寄一件, 解压阀就失效了。
export function shipHome(s: ExploreState, uids: string[]): boolean {
  if (!s.chuteOpen || !uids.length) return false;
  const picked = uids
    .map((u) => findByUid(s.backpack, u))
    .filter((x): x is ItemStack => !!x && !getItemDef(x.itemId).undroppable);
  if (!picked.length) return false;

  for (const st of picked) s.backpack = removeByUid(s.backpack, st.uid);
  s.shipped = [...s.shipped, ...picked];
  changeEnergy(s, -EXPLORE_RULES.chute.energyCost);
  s.chuteOpen = false; // 一个节点只能寄一次
  logLine(s, `投递口寄回 ${picked.length} 件 · 净化粒子 −${EXPLORE_RULES.chute.energyCost}`);
  return true;
}

function healParty(s: ExploreState, percent: number): void {
  for (const p of s.party) {
    if (!p.alive) continue; // 回血不复活阵亡者
    p.hp = Math.min(p.hpLimit, p.hp + Math.ceil(p.maxHp * percent));
  }
}

function damagePartyPercent(s: ExploreState, percent: number): void {
  for (const p of s.party) {
    if (!p.alive) continue;
    const damage = Math.max(1, Math.round(p.maxHp * percent));
    p.hpLimit = Math.max(1, p.hpLimit > p.hp ? p.hp : p.hpLimit);
    p.hp -= damage;
    if (p.hp <= 0) {
      p.hp = 0;
      p.alive = false;
      logLine(s, `${p.name} 倒下了`);
    }
  }
}

// 全队阵亡 = 团灭。事件掉血也可能触发, 故每次改动队伍后都要查。返回是否刚刚团灭。
function checkWipe(s: ExploreState): boolean {
  if (s.phase === "wiped" || s.phase === "cleared" || s.phase === "retreated") return false;
  if (!s.party.every((p) => !p.alive)) return false;
  s.phase = "wiped";
  loseEverything(s);
  logLine(s, "全队失去意识……");
  return true;
}

// 团灭惩罚的唯一真相点: 积分与背包全丢, 已寄回的(s.shipped)不受影响(设计文档 §3.2 / §6.5)。
// ★ 显式清空而不是「靠没人来入库」隐式实现 —— 后者会让 UI 在结算前还读得到一包早就没了的东西。
function loseEverything(s: ExploreState): void {
  s.loot = Math.floor(s.loot * EXPLORE_RULES.wipe.lootKept);
  if (s.backpack.length || s.pendingPickup.length || s.pendingLoot.length) {
    logLine(s, "背包连同里面的东西一起丢在了那层楼");
  }
  s.backpack = [];
  s.pendingPickup = [];
  s.pendingLoot = [];
  s.pendingBoons = [];
  s.pendingCardOffer = null;
  s.pendingExp = {};
  s.pendingActions = [];
  s.chuteOpen = false;
}

// 一批掉落 → 一句摘要, 同名合并计数(「废件 ×3 · 补焊装甲板 ×1」)。
function summarizeItems(taken: ItemStack[], overflow: ItemStack[]): string {
  const count = new Map<string, number>();
  for (const st of taken) count.set(st.itemId, (count.get(st.itemId) ?? 0) + st.count);
  const parts = [...count].map(([id, n]) => `${getItemDef(id).name} ×${n}`);
  const head = parts.length ? `拾得 ${parts.join(" · ")}` : "背包已满, 什么都拿不下";
  return overflow.length ? `${head}（${overflow.length} 件背不动了）` : head;
}

function summarizePendingItems(stacks: ItemStack[]): string {
  const count = new Map<string, number>();
  for (const st of stacks) count.set(st.itemId, (count.get(st.itemId) ?? 0) + st.count);
  const parts = [...count].map(([id, n]) => `${getItemDef(id).name} ×${n}`);
  return parts.length ? `待拾取 ${parts.join(" · ")}` : "待拾取物品";
}

// 单条效果 → 一句结算摘要(写进节点记录与结算浮层)。
// ⚠ RETREAT 与 END_REGION 会改变阶段, 由 chooseOption 单独处理, 不走这里。
function rollOutcome(s: ExploreState, outcomes: EventOutcome[]): EventOutcome | null {
  if (!outcomes.length) return null;
  const total = outcomes.reduce((sum, item) => sum + Math.max(0, item.weight ?? 1), 0);
  if (total <= 0) return outcomes[0];
  let roll = rngInt(s, Math.ceil(total * 1000)) / 1000;
  for (const item of outcomes) {
    roll -= Math.max(0, item.weight ?? 1);
    if (roll < 0) return item;
  }
  return outcomes[outcomes.length - 1];
}

function rollEquipOffers(s: ExploreState, count: number, slot?: import("../items/types").EquipSlot): ItemStack[] {
  const familyIds = [
    ...new Set(
      equipmentDefsBySlot(slot)
        .map((def) => def.familyId)
        .filter((familyId): familyId is string => Boolean(familyId)),
    ),
  ];
  const allowedRarities = mapEquipRarities(s.mapId);
  const weights = qualityWeights(dropCoefficient(s));
  return shuffle(s, familyIds)
    .slice(0, Math.max(0, count))
    .map((familyId) => {
      const family = getItemFamily(familyId);
      const eligible = family.filter((def) => allowedRarities.includes(def.rarity));
      const def = pickByQuality(s, eligible.length ? eligible : family, weights);
      return makeRolledItemStack(s, def.id, 1);
    });
}

function deferEffectLoot(s: ExploreState, stacks: ItemStack[]): string {
  addPendingLoot(s, stacks);
  return `发现 ${summarizeItems(stacks, [])}，等待拾取`;
}

export function applyEffect(s: ExploreState, e: ExploreEffect, defer = false): string {
  switch (e.type) {
    case "HEAL_PARTY":
      healParty(s, e.percent);
      return `全队回复 ${Math.round(e.percent * 100)}% 生命`;
    case "HEAL_ONE_FULL": {
      const alive = s.party.filter((p) => p.alive);
      if (!alive.length) return "无人可治疗";
      // 优先治疗伤得最重的那个 —— 随机指定只会让玩家觉得系统在跟自己作对
      const target = alive.reduce((a, b) => (a.hp / a.maxHp <= b.hp / b.maxHp ? a : b));
      target.hp = target.hpLimit;
      for (const p of alive) {
        if (p === target) continue;
        p.hp = Math.min(p.hpLimit, p.hp + Math.ceil(p.maxHp * e.othersPercent));
      }
      return `${target.name} 回满, 其余回复 ${Math.round(e.othersPercent * 100)}%`;
    }
    case "DAMAGE_PARTY_PERCENT":
      damagePartyPercent(s, e.percent);
      return `全队损失 ${Math.round(e.percent * 100)}% 生命`;
    case "GAIN_LOOT": {
      const gain = Math.round(e.amount * rewardMultiplier(s.energy));
      s.loot += gain;
      return `居民积分 +${gain}`;
    }
    case "GAIN_ITEM": {
      // 指名实物 ⇒ **不**吃掉落系数: 事件写死给几件就是几件, K 只作用于随机掉落表。
      const count = Math.max(1, e.count ?? 1);
      const def = getItemDef(e.itemId);
      const made = Array.from({ length: count }, () => makeRolledItemStack(s, e.itemId, 1));
      if (defer) return deferEffectLoot(s, made);
      const { taken, overflow } = addItems(s, made);
      return overflow.length
        ? `拾得 ${def.name} ×${taken.length}（${overflow.length} 件背不动了）`
        : `拾得 ${def.name} ×${taken.length}`;
    }
    case "FORCE_ITEM": {
      const count = Math.max(1, e.count ?? 1);
      const def = getItemDef(e.itemId);
      const made = Array.from({ length: count }, () => makeRolledItemStack(s, e.itemId, 1));
      const { taken, overflow } = addItems(s, made);
      return overflow.length
        ? `强制拾取 ${def.name} ×${count}（背包已满, 必须腾出 ${overflow.length} 格）`
        : `强制拾取 ${def.name} ×${taken.length}`;
    }
    case "GRANT_EQUIP": {
      const stack = rollEquipCrate(s, dropContext(s));
      if (!stack) return "装备库存为空";
      addPendingLoot(s, [stack]);
      return `获得随机装备「${getItemDef(stack.itemId).name}」，已放入待拾取框`;
    }
    case "GRANT_MODULE": {
      const stack = rollModuleCrate(s, dropContext(s));
      if (!stack) return "模组库存为空";
      addPendingLoot(s, [stack]);
      return `获得随机模组「${getItemDef(stack.itemId).name}」，已放入待拾取框`;
    }
    case "ROLL_DROP": {
      const rolled = rollDropTable(s, e.table, dropCoefficient(s), dropContext(s));
      if (!rolled.length) return "什么也没找到";
      if (defer) return deferEffectLoot(s, rolled);
      const { taken, overflow } = addItems(s, rolled);
      return summarizeItems(taken, overflow);
    }
    case "DISCARD_SLOTS": {
      const dropped = forceDiscardSlots(s, e.slots);
      return dropped > 0 ? `被迫丢弃 ${dropped} 格物资` : "背包本来就是空的";
    }
    case "OPEN_CHUTE":
      s.chuteOpen = true;
      return `投递口已开启（寄回一批物资 · 净化粒子 −${EXPLORE_RULES.chute.energyCost}）`;
    case "MODIFY_ENERGY":
      changeEnergy(s, e.amount);
      return `净化粒子 ${e.amount > 0 ? "+" : ""}${e.amount}`;
    case "SKIP_NODE_COST":
      s.freeNodes += e.nodes;
      return `接下来 ${e.nodes} 个节点不消耗净化粒子`;
    case "CONTAMINATE_CARDS": {
      const count = Math.max(1, Math.floor(e.count ?? 1));
      if (e.each) {
        s.pendingContaminationEach += count;
        return `每名角色的牌组各有 ${count} 张卡牌被污染`;
      }
      s.pendingContaminationCount += count;
      return `${count} 张卡牌被污染`;
    }
    case "HEAL_ONE":
      s.pendingActions.push({ kind: "healOne", percent: e.percent, full: e.full ?? false });
      return e.full ? "获得一次指定角色生命回满" : `获得一次指定角色治疗 ${Math.round(e.percent * 100)}%`;
    case "HEAL_LIMIT_PARTY": {
      for (const p of s.party) {
        if (!p.alive) continue;
        p.hpLimit = Math.min(p.maxHp, p.hpLimit + Math.ceil(p.maxHp * e.percent));
      }
      return `全队体力极限恢复 ${Math.round(e.percent * 100)}%`;
    }
    case "HEAL_LIMIT_ONE":
      s.pendingActions.push({
        kind: "healLimitOne",
        percent: e.percent ?? 0,
        full: e.full ?? false,
      });
      return e.full ? "获得一次指定角色体力极限全恢复" : `获得一次指定角色体力极限修复 ${Math.round((e.percent ?? 0) * 100)}%`;
    case "CURE_QUIRK":
      s.pendingActions.push({ kind: "cureQuirk", scope: e.scope, count: Math.max(1, e.count ?? 1) });
      return e.scope === "party" ? `获得全队各治疗 ${Math.max(1, e.count ?? 1)} 个怪癖` : "获得一次指定角色怪癖治疗";
    case "REDUCE_POLLUTION":
      s.pendingActions.push({ kind: "reducePollution", scope: e.scope, amount: Math.max(0, e.amount) });
      return e.scope === "party" ? `获得全队污染值降低 ${Math.max(0, e.amount)}` : `获得一次指定角色污染值降低 ${Math.max(0, e.amount)}`;
    case "PURIFY_CARDS":
      s.pendingActions.push({ kind: "purifyCards", scope: e.scope, count: Math.max(1, e.count ?? 1) });
      return e.scope === "party" ? `获得全队各净化 ${Math.max(1, e.count ?? 1)} 张污染卡` : "获得一次指定角色污染卡净化";
    case "GRANT_AURA":
      if (!s.auras.some((aura) => aura.id === e.aura.id)) s.auras.push({ ...e.aura });
      return `获得远征光环「${e.aura.name}」`;
    case "GAIN_EXP_PARTY": {
      let count = 0;
      for (const p of s.party) {
        if (!p.alive) continue;
        s.pendingExp[p.charId] = (s.pendingExp[p.charId] ?? 0) + e.amount;
        count += 1;
      }
      return `存活角色各获得经验 +${e.amount}（${count} 人）`;
    }
    case "GAIN_EXP_ONE":
      s.pendingActions.push({ kind: "expOne", amount: e.amount });
      return `获得一次指定角色经验 +${e.amount}`;
    case "FORGE_DRAW":
      s.pendingActions.push({ kind: "forgeDraw" });
      return "获得一次免费角色卡组锻造";
    case "FORGE_REMOVE":
      s.pendingActions.push({ kind: "forgeRemove" });
      return "获得一次免费角色删卡机会";
    case "EQUIP_OFFER": {
      const offers = rollEquipOffers(s, e.count, e.slot);
      if (offers.length) {
        s.pendingActions.push({ kind: "equipOffer", offers });
        return `公开 ${offers.length} 件装备候选`;
      }
      return "装备库存为空";
    }
    case "REFORGE_BOND":
      s.pendingActions.push({ kind: "reforge", bias: e.bias });
      return "获得一次免费装备羁绊重铸";
    case "START_NODE_BATTLE":
      return `进入${BATTLE_TIER_NAME[e.tier]}`;
    case "OPEN_SHOP":
      return "打开交易终端";
    // 这两个由 chooseOption 拦截, 走不到这里; 列出来让 switch 保持穷尽
    case "END_REGION":
    case "RETREAT":
      return "";
  }
}

// 由 store 层消费一次, 纯探索层不接触 townStore。
export interface PendingContamination {
  total: number;
  each: number;
}

export function takePendingContamination(s: ExploreState): PendingContamination {
  const result = { total: s.pendingContaminationCount, each: s.pendingContaminationEach };
  s.pendingContaminationCount = 0;
  s.pendingContaminationEach = 0;
  return result;
}

export function grantExpTo(s: ExploreState, charId: string): boolean {
  const action = s.pendingActions[0];
  if (!action || action.kind !== "expOne") return false;
  const target = s.party.find((p) => p.charId === charId && p.alive);
  if (!target) return false;
  s.pendingExp[charId] = (s.pendingExp[charId] ?? 0) + action.amount;
  return true;
}

export function recordExpGain(s: ExploreState, amount: number): boolean {
  const gained = Math.max(0, Math.floor(amount));
  if (!gained) return false;
  s.stats.expTotal += gained;
  return true;
}

export function takePendingExp(s: ExploreState): Record<string, number> {
  const exp = { ...s.pendingExp };
  s.pendingExp = {};
  return exp;
}

export function resolvePendingAction(s: ExploreState): boolean {
  if (!s.pendingActions.length) return false;
  s.pendingActions.shift();
  return true;
}

export function resolvePendingHealing(s: ExploreState, charId: string, limit: boolean): boolean {
  const action = s.pendingActions[0];
  if (!action) return false;
  const target = s.party.find((p) => p.charId === charId && p.alive);
  if (!target) return false;
  if (limit) {
    if (action.kind !== "healLimitOne") return false;
    target.hpLimit = action.full
      ? target.maxHp
      : Math.min(target.maxHp, target.hpLimit + Math.ceil(target.maxHp * action.percent));
  } else {
    if (action.kind !== "healOne") return false;
    target.hp = Math.min(
      target.hpLimit,
      action.full ? target.hpLimit : target.hp + Math.ceil(target.maxHp * action.percent),
    );
  }
  s.pendingActions.shift();
  return true;
}

export function reforgeBackpackItem(s: ExploreState, uid: string): boolean {
  const action = s.pendingActions[0];
  if (!action || action.kind !== "reforge") return false;
  const item = findByUid(s.backpack, uid);
  if (!item || getItemDef(item.itemId).category !== "equipment") return false;
  const pool = bondPool(action.bias);
  if (!pool.length) return false;
  item.affinity = pool[rngInt(s, pool.length)];
  return true;
}

export function acceptEquipOffer(s: ExploreState, index: number): boolean {
  const action = s.pendingActions[0];
  if (!action || action.kind !== "equipOffer") return false;
  const offer = action.offers[index];
  if (!offer) return false;
  addPendingLoot(s, [{ ...offer }]);
  return true;
}

// ---------------------------------------------------------------------------
// 一轮的生成
// ---------------------------------------------------------------------------
// 轮次 → 揭示时长与额外桥接数(设计文档 §2.2)。
function roundStageOf(round: number) {
  const r = EXPLORE_RULES.rounds;
  if (round <= r.early.untilRound) return r.early;
  if (round <= r.mid.untilRound) return r.mid;
  return r.late;
}

const SEGMENTS = EXPLORE_RULES.segmentsPerRound;
const LANES = EXPLORE_RULES.laneCount;
const segCountOf = (s: ExploreState) => s.board?.segments.length ?? SEGMENTS;

// 事件允许出现在第 seg 个推进段(0-based)吗 —— depth 是 1-based 的闭区间。
function fitsDepth(e: NodeEvent, seg: number): boolean {
  const [lo, hi] = e.depth ?? [1, SEGMENTS];
  return seg + 1 >= lo && seg + 1 <= hi;
}

// 全图节点生成(设计文档 §2.3.2 / §9.3)。
//
// ★ 风险事件**不限制推进段**: 与普通事件一起参与逐段随机填充, 位置完全随机,
//   第 1 段也可能出风险。填充顺序从第 4 段往第 1 段走只影响落位时机, 不影响概率。
//
// 保底(范围是**整张图**而不是每段 —— 单个推进段允许全是坑或全是宝):
//   · 至少 2 个生存/低风险节点, 其中至少 1 个在第 1-2 段;
//   · 至少 3 个成长节点;
//   · 全图至少 minCount 个风险事件(位置不限, 缺了才补);
//   · 告急档(第 4 档)起传送投递口必现; 枯竭档(第 5 档)起撤离升降机必现于第 1-2 段。
// ★ 收尾的最终布局计算: 同一行(推进段)内, 同类型(kind)事件最多 2 个(见 finalizeRowKinds)。
function pickNodes(s: ExploreState, poolId: string): NodeEvent[][] {
  const pool = getEventPool(poolId);
  const tier = energyTier(s.energy).tier;

  const all = [
    ...pool.survival,
    ...pool.growth,
    ...pool.economy,
    ...pool.route,
    ...pool.energy,
    ...pool.hazard,
    ...pool.endgame,
  ].filter((e) => !e.disabled && (e.minRound ?? 1) <= s.round);

  const grid: (NodeEvent | null)[][] = Array.from({ length: SEGMENTS }, () =>
    Array.from({ length: LANES }, () => null),
  );

  const onBoard = (id: string) => grid.some((row) => row.some((e) => e?.id === id));
  const inSegment = (seg: number, id: string) => grid[seg].some((e) => e?.id === id);
  const place = (seg: number, e: NodeEvent): boolean => {
    const free = grid[seg].map((x, i) => (x ? -1 : i)).filter((i) => i >= 0);
    if (!free.length || inSegment(seg, e.id)) return false;
    grid[seg][free[rngInt(s, free.length)]] = e;
    return true;
  };
  // ★ 风险事件**不限制推进段**: 与普通事件一样参与逐段随机填充, 位置全图完全随机
  // (数量下限由③的保底统一兜底, 见 EXPLORE_RULES.eventPool.hazard.minCount)。

  const locked = new Set<string>();
  const key = (seg: number, lane: number) => `${seg}:${lane}`;

  // ① 档位保底(设计文档 §4.2)。撤离升降机的枯竭档保护**无视 minRound** ——
  //    时限是压力不是死刑, 玩家永远要有把背包带回去的机会。
  if (tier >= 5) {
    const lift = all.find((e) => e.id === "evac-lift") ?? pool.endgame.find((e) => e.id === "evac-lift" && !e.disabled);
    if (lift) place(rngInt(s, 2), lift); // 第 1-2 段
  }
  if (tier >= 4) {
    const chute = all.find((e) => e.id === "dispatch-chute");
    if (chute) place(rngInt(s, SEGMENTS), chute);
  }

  // 战斗节点是独立保底, 不进入普通池随机填格, 且锁在不同深段避免连续相邻出现。
  const battleDepth = EXPLORE_RULES.eventPool.battleNodes.depth;
  const battleSegments = shuffle(
    s,
    Array.from({ length: SEGMENTS }, (_, seg) => seg).filter(
      (seg) => seg + 1 >= battleDepth[0] && seg + 1 <= battleDepth[1],
    ),
  );
  const battleEvents = shuffle(
    s,
    pool.battle.filter((e) => !e.disabled && (e.minRound ?? 1) <= s.round),
  );
  for (let i = 0; i < Math.min(EXPLORE_RULES.eventPool.battleNodes.count, battleEvents.length); i++) {
    const seg = battleSegments[i];
    if (seg == null || !place(seg, battleEvents[i])) continue;
    const lane = grid[seg].findIndex((e) => e?.id === battleEvents[i].id);
    if (lane >= 0) locked.add(`${seg}:${lane}`);
  }

  // 空节点(设计: 每张图固定 emptyNodes.count 个, 见 rules.ts)——
  // 与战斗节点同理是独立保底: 不进入普通池随机填格, 且锁在不同深段避免挤在一段。
  // ⚠ 必须上锁: 否则③的保底修复会把它们当成可牺牲的填充节点换掉, 「每图恰好 N 个」就破了。
  const emptySegments = shuffle(
    s,
    Array.from({ length: SEGMENTS }, (_, seg) => seg),
  );
  const emptyEvents = shuffle(
    s,
    pool.empty.filter((e) => !e.disabled && (e.minRound ?? 1) <= s.round),
  );
  for (let i = 0; i < Math.min(EXPLORE_RULES.eventPool.emptyNodes.count, emptyEvents.length); i++) {
    const seg = emptySegments[i];
    if (seg == null || !place(seg, emptyEvents[i])) continue;
    const lane = grid[seg].findIndex((e) => e?.id === emptyEvents[i].id);
    if (lane >= 0) locked.add(`${seg}:${lane}`);
  }

  // ② 逐段填满 —— 从最深的一段开始
  for (let seg = SEGMENTS - 1; seg >= 0; seg--) {
    while (grid[seg].some((x) => !x)) {
      const cooled = shuffle(
        s,
        all.filter(
          (e) =>
            fitsDepth(e, seg) &&
            !onBoard(e.id) &&
            !s.recentEventIds.includes(e.id),
        ),
      );
      const avail = cooled.length
        ? cooled
        : shuffle(s, all.filter((e) => fitsDepth(e, seg) && !inSegment(seg, e.id)));
      if (!avail.length) break; // 池子撑不满这一段: 少几个节点也不该卡死生成
      place(seg, avail[0]);
    }
  }

  // ③ 保底修复。★ 替换而不是回溯: 挑一个可牺牲的填充节点换掉即可(§9.3 不要求回溯)。
  //
  // ⚠ 已经为某条保底补进去的格子必须**上锁**: 否则后一条保底(比如「至少 3 个成长」)会
  //   把前一条刚补进去的生存节点当成填充物换掉, 两条保底互相拆台, 谁最后跑谁生效。
  // 档位必现项同样上锁 —— 它们是硬保底, 不许被任何修复挤掉。
  grid.forEach((row, seg) =>
    row.forEach((e, lane) => {
      if (e && (e.id === "evac-lift" || e.id === "dispatch-chute")) locked.add(key(seg, lane));
    }),
  );

  const replaceIn = (segs: number[], want: (e: NodeEvent) => boolean): boolean => {
    const pick = shuffle(
      s,
      all.filter((e) => want(e)),
    );
    for (const cand of pick) {
      for (const seg of segs) {
        if (!fitsDepth(cand, seg) || onBoard(cand.id)) continue;
        // 牺牲品: 同段里既不是保底目标、也没上锁的那一个
        const victimLane = grid[seg].findIndex(
          (e, lane) => e && !want(e) && !locked.has(key(seg, lane)),
        );
        if (victimLane < 0) continue;
        const victim = grid[seg][victimLane]!;
        grid[seg][victimLane] = cand;
        locked.add(key(seg, victimLane));
        return true;
      }
    }
    return false;
  };

  const isSafe = (e: NodeEvent) => e.category === "survival" || (!e.risk && e.category !== "hazard");
  const isGrowth = (e: NodeEvent) => e.category === "growth";

  // ⚠ 天然就满足某条保底的格子也要先上锁: 否则后一条保底会把它当填充物换走, 前一条当场失效。
  //   `n` = 这条保底还需要几个, 上锁到额度为止, 不足的部分才走 replaceIn 去补。
  const lockExisting = (segs: number[], want: (e: NodeEvent) => boolean, n: number): number => {
    let got = 0;
    for (const seg of segs) {
      grid[seg].forEach((e, lane) => {
        if (got >= n || !e || !want(e) || locked.has(key(seg, lane))) return;
        locked.add(key(seg, lane));
        got += 1;
      });
    }
    return got;
  };
  const guarantee = (segs: number[], want: (e: NodeEvent) => boolean, n: number): void => {
    let have = lockExisting(segs, want, n);
    let guard = 0;
    while (have < n && guard++ < n + 2) {
      if (!replaceIn(segs, want)) break; // 池子给不出更多了: 少一个也不该卡死生成
      have += 1;
    }
  };

  // 风险保底: 全图至少 minCount 个风险事件(位置不限, 缺了才从任意段换一个补上)。
  // ⚠ 只兜底**数量**, 不兜底位置 —— 位置完全由②的随机填充决定, 第 1 段也可能出风险。
  guarantee(
    [0, 1, 2, 3],
    (e) => e.category === "hazard",
    EXPLORE_RULES.eventPool.hazard.minCount,
  );
  // 「第 1-2 段至少 1 个生存节点」—— 浅停必须是有价值的巩固打法(§1.4)
  guarantee([0, 1], (e) => e.category === "survival", 1);
  // 全图至少 2 个生存/低风险
  guarantee([0, 1, 2, 3], isSafe, 2);
  // 全图至少 3 个成长
  guarantee([0, 1, 2, 3], isGrowth, 3);

  // 池子实在填不满时先找全图未出现的事件, 再退回同段复制, 保证结构完整(20 格全满)。
  const finalGrid = grid.map((row, seg) => {
    const filled = row.filter((e): e is NodeEvent => !!e);
    return row.map(
      (e, lane) => {
        if (e) return e;
        const fresh = shuffle(s, all.filter((x) => fitsDepth(x, seg) && !onBoard(x.id)))[0];
        if (fresh) {
          grid[seg][lane] = fresh;
          return fresh;
        }
        return filled[lane % Math.max(1, filled.length)] ?? all.find((x) => fitsDepth(x, seg))!;
      },
    );
  });

  // ★ 最终布局计算: 同一推进段内, 同类型(kind)事件最多 2 个 —— 收尾前最后一道修正。
  finalizeRowKinds(s, finalGrid, all, locked);
  return finalGrid;
}

// ★ 最终布局计算: 把每一行(推进段)里超过 2 个的同类型(kind)事件换掉。
//
// 为什么是**收尾修正**而不是填充时过滤: 填充阶段的候选过滤要兼顾冷却/保底/锁定,
// 再加一条「同行同 kind ≤ 2」会把候选池反复掏空, 保底与随机性互相打架; 而生成完毕后
// 一行 5 格里同 kind 超额(3+)只可能是随机填充造成的, 换掉超额的格子即可, 不回溯。
//
// ⚠ 只换**未锁定**的格子: 战斗/空节点/档位必现/保底修复锁定的格子在生成期不许动
//   (它们各自有「恰好 N 个」的硬约束, 见 pickNodes 的 locked)。锁定格本身不会造成
//   超额 —— 战斗同行 ≤2、空节点同行 ≤1、保底每类锁定的格子 ≤ 该保底的额度 ——
//   所以换掉未锁定的超额格, 就能把每行每类压到 ≤2, 不会修不干净。
// ⚠ 候选只从「该段可放(fitsDepth)且全图未出现」的事件里挑, 保持「20 格全图不重复」;
//   池子给不出候选时跳过这一格 —— 不破坏 20 格全满, 也不破坏全图唯一。
function finalizeRowKinds(
  s: ExploreState,
  grid: (NodeEvent | null)[][],
  all: NodeEvent[],
  locked: Set<string>,
): void {
  for (let seg = 0; seg < grid.length; seg++) {
    const row = grid[seg];
    const countOf = (kind: string) => row.filter((e) => e?.kind === kind).length;
    for (let lane = 0; lane < row.length; lane++) {
      const e = row[lane];
      if (!e || countOf(e.kind) <= 2 || locked.has(`${seg}:${lane}`)) continue;
      const cand = shuffle(
        s,
        all.filter(
          (x) =>
            fitsDepth(x, seg) &&
            !grid.some((r) => r.some((y) => y?.id === x.id)) &&
            countOf(x.kind) < 2,
        ),
      )[0];
      if (!cand) continue; // 池子给不出: 这一格保留原样, 不破坏其他约束
      row[lane] = cand;
      // 换入后旧 kind 计数 −1、新 kind 计数 +1 ⇒ 后续格子重新 countOf 时自然落在新分布上。
    }
  }
}

export function generateRound(s: ExploreState): void {
  const map = getMap(s.mapId);
  const stage = roundStageOf(s.round);
  const plan = map.roundPlans?.[s.round - 1];
  let laneCount = LANES;
  let rowsPerSegment = EXPLORE_RULES.rowsPerSegment;
  let nodes: NodeEvent[][];
  let segments: RouteBoard["segments"];
  let hiddenNodes: RouteBoard["hiddenNodes"];
  let revealDurationMs = stage.revealMs;

  if (plan) {
    laneCount = plan.laneCount;
    rowsPerSegment = plan.rowsPerSegment ?? EXPLORE_RULES.rowsPerSegment;
    if (plan.nodes.length !== plan.bridges.length) {
      throw new Error(`地图 ${map.id} 第 ${s.round} 轮蓝图的节点段数与桥接段数不一致`);
    }
    const pool = getEventPool(map.eventPoolId);
    const eventIndex = new Map(Object.values(pool).flat().map((event) => [event.id, event]));
    nodes = plan.nodes.map((row, seg) => {
      if (row.length !== laneCount) {
        throw new Error(`地图 ${map.id} 第 ${s.round} 轮蓝图第 ${seg + 1} 段通道数不一致`);
      }
      return row.map((eventId) => {
        const event = eventIndex.get(eventId);
        if (!event) throw new Error(`地图 ${map.id} 蓝图引用了未知事件: ${eventId}`);
        return event;
      });
    });
    segments = plan.bridges.map((bridges, index) => ({ index, bridges: bridges.map((bridge) => ({ ...bridge })) }));
    hiddenNodes = [];
    revealDurationMs = plan.revealMs ?? stage.revealMs;
    s.roundBattleTier = plan.battleTier ?? roundBattleTier(s);
    s.recentEventIds = [...s.recentEventIds];
  } else {
    s.roundBattleTier = roundBattleTier(s);
    // 每段桥接数在本轮次给定的区间里各掷一次 —— 递增曲线由区间表本身保证(rules.rounds)
    const counts = stage.bridges.map(([lo, hi]) => lo + rngInt(s, hi - lo + 1));

    nodes = pickNodes(s, map.eventPoolId);
    segments = generateSegments(s, LANES, EXPLORE_RULES.rowsPerSegment, counts);
    // 每张图固定隐藏 N 个节点(全图随机抽坐标, 真实事件仍留在 nodes 里)。
    // ⚠ 抽取放在 nodes/segments 之后: 不改变既有生成序列, 只追加一段随机消耗;
    //   用洗牌取前 N 个 ⇒ 天然不重复。UI 在走到之前一律按未知节点渲染。
    const hiddenCount = Math.min(EXPLORE_RULES.hiddenNodesPerBoard, SEGMENTS * LANES);
    hiddenNodes = shuffle(
      s,
      Array.from({ length: SEGMENTS * LANES }, (_, i) => ({
        seg: Math.floor(i / LANES),
        lane: i % LANES,
      })),
    ).slice(0, hiddenCount);
  }
  const board: RouteBoard = {
    round: s.round,
    laneCount,
    rowsPerSegment,
    segments,
    nodes,
    revealDurationMs,
    blockedLanes: [],
    hiddenNodes,
  };

  s.board = board;
  if (!plan) {
    const recentWindow = Math.max(0, EXPLORE_RULES.eventPool.recentWindowRounds);
    const recent = [...s.recentEventIds, ...nodes.flat().map((event) => event.id)];
    s.recentEventIds = recentWindow
      ? recent.slice(-recentWindow * SEGMENTS * LANES)
      : [];
  }
  s.entryLane = null;
  s.currentLane = null;
  s.currentSegment = 0;
  s.freeNodes = 0;
  s.shop = null;
  s.pendingNotes = [];
  s.pendingBattleTier = null;
  s.battleSource = null;
  s.chuteOpen = false;
  // ★ 新图不是立刻可看的: 先播 2 秒逐段浮现(generating), 再停在遮蔽态(sealed)等玩家主动揭示。
  s.phase = "generating";
}

// ---------------------------------------------------------------------------
// 一轮的推进
// ---------------------------------------------------------------------------
// 生成演出播完 —— 由 UI 侧的定时器触发(时长见 RouteBoard.GENERATE_MS)。
// 图这时已经完整画在屏幕上了, 但桥接仍然遮蔽 —— 只是从「锁死」变成「等玩家出手」。
export function finishGenerating(s: ExploreState): boolean {
  if (s.phase !== "generating") return false;
  s.phase = "sealed";
  return true;
}

// 玩家按下「探索路线」—— 唯一进入 revealing 的入口。
// ★ 一轮只能看一次: 阶段单向流转 sealed → revealing → choosingEntry, 再也回不到 sealed,
//   所以「限次」不需要额外的计数字段, 拿 phase 卡住就够了。
export function startReveal(s: ExploreState): boolean {
  if (s.phase !== "sealed") return false;
  s.phase = "revealing";
  return true;
}

// 揭示计时结束 —— 由 UI 侧的定时器触发(时长取 board.revealDurationMs)。
export function finishReveal(s: ExploreState): boolean {
  if (s.phase !== "revealing") return false;
  s.phase = "choosingEntry";
  return true;
}

// 选入口通道 —— **全轮唯一一次自由选择**, 写入后不可再改(设计文档 §9.2)。
export function chooseEntry(s: ExploreState, lane: number): boolean {
  if (s.phase !== "choosingEntry" || !s.board) return false;
  if (lane < 0 || lane >= s.board.laneCount) return false;
  if (s.board.blockedLanes.includes(lane)) return false;
  s.entryLane = lane;
  s.currentLane = lane;
  s.phase = "advancing";
  return true;
}

// 推进动画播完 —— **只落点, 不结算**。效果要等玩家在浮层里挑完分支才生效(见 chooseOption)。
export function arriveNode(s: ExploreState): boolean {
  if (s.phase !== "advancing" || !s.board || s.currentLane == null) return false;
  if (s.currentSegment >= segCountOf(s)) return false;
  const seg = s.board.segments[s.currentSegment];
  s.currentLane = traceSegment(seg, s.currentLane, s.board.rowsPerSegment).laneOut;
  s.currentSegment += 1;
  s.pendingNotes = [];
  s.pendingStory = [];
  s.phase = "landed";
  return true;
}

// 落点分支的可选项。事件没写 choices 时退化成「只有主选项」。
export function landedChoices(s: ExploreState): EventChoice[] {
  const ev = landedEvent(s);
  if (!ev) return [];
  if (ev.choices?.length) return ev.choices;
  return [
    {
      id: "proceed",
      label: "继续",
      desc: "按事件本身的结果处理",
      energyDelta: ev.energyDelta,
      effects: ev.effects,
    },
  ];
}

// 这一支点下去会不会直接进战斗。随机结果只有每一支都进战斗时才算确定。
export function choiceStartsBattle(s: ExploreState, index: number): boolean {
  const ev = landedEvent(s);
  const choice = landedChoices(s)[index];
  if (!ev || !choice) return false;
  if (choice.outcomes?.length) {
    return choice.outcomes.every((outcome) =>
      (outcome.effects ?? []).some((effect) => effect.type === "START_NODE_BATTLE"),
    );
  }
  const effects = choice.effects ?? ev.effects ?? [];
  return effects.some((effect) => effect.type === "START_NODE_BATTLE");
}

function resolveEventOutcome(s: ExploreState, choice: EventChoice): EventOutcome | null {
  return choice.outcomes?.length ? rollOutcome(s, choice.outcomes) : null;
}

function applyChoiceEffects(s: ExploreState, choice: EventChoice, defer: boolean): string[] {
  const outcome = resolveEventOutcome(s, choice);
  const notes: string[] = [];
  const effects = outcome?.effects ?? choice.effects ?? [];
  if (choice.story) s.pendingStory.push(choice.story);
  if (outcome?.text) s.pendingStory.push(outcome.text);
  for (const e of effects) {
    if (e.type === "RETREAT" || e.type === "END_REGION") continue;
    const note = applyEffect(s, e, defer);
    if (note) notes.push(note);
  }
  return notes;
}

export function resolveChoice(s: ExploreState, choice: EventChoice, defer = true): string[] {
  return applyChoiceEffects(s, choice, defer);
}

// 玩家在落点浮层里选了一支 —— 这里才真的扣粒子、跑效果、写记录。
// ★ 粒子消耗 = 每节点固定 −3(freeNodes 可免) + 该分支自己的 energyDelta(设计文档 §4.2)。
export function chooseOption(s: ExploreState, index: number): boolean {
  if (s.phase !== "landed" || !s.board || s.currentLane == null || s.currentSegment < 1) {
    console.warn("[explore] 选项未被接受：当前阶段或落点无效", {
      index,
      phase: s.phase,
      hasBoard: Boolean(s.board),
      currentLane: s.currentLane,
      currentSegment: s.currentSegment,
    });
    return false;
  }

  const ev = landedEvent(s);
  const choice = landedChoices(s)[index];
  if (!ev || !choice) {
    console.warn("[explore] 选项未被接受：事件或选项不存在", { index, eventId: ev?.id });
    return false;
  }

  if (choice.cost) {
    const count = Math.max(1, Math.floor(choice.cost.count));
    if (countByItemId(s.backpack, choice.cost.itemId) < count) {
      console.warn("[explore] 选项未被接受：消耗品不足", {
        index,
        itemId: choice.cost.itemId,
        required: count,
      });
      return false;
    }
    s.backpack = consumeItems(s.backpack, choice.cost.itemId, count);
  }

  const notes: string[] = [];
  const historyNotes: string[] = [];

  // ① 节点的基础消耗(按推进段分档, 见 energyCostAt)。「隐匿通道」这类效果免的就是这一份。
  const segCost = energyCostAt(s.currentSegment);
  if (s.freeNodes > 0) {
    s.freeNodes -= 1;
  } else {
    changeEnergy(s, -segCost);
  }

  // ② 分支自己的额外增减
  if (choice.energyDelta !== 0) {
    changeEnergy(s, choice.energyDelta);
    const note = `净化粒子 ${choice.energyDelta > 0 ? "+" : ""}${choice.energyDelta}`;
    notes.push(note);
  }

  let leaving = false;
  let endRegion = false;
  let openTerminal = false;
  let nodeBattleTier: BattleTier | null = null;
  const outcome = resolveEventOutcome(s, choice);
  const effects = outcome?.effects ?? choice.effects ?? ev.effects ?? [];
  if (choice.story) s.pendingStory.push(choice.story);
  if (outcome?.text) s.pendingStory.push(outcome.text);
  for (const e of effects) {
    if (e.type === "RETREAT") {
      leaving = true;
      continue;
    }
    if (e.type === "END_REGION") {
      endRegion = true;
      continue;
    }
    if (e.type === "OPEN_SHOP") {
      openTerminal = true;
      continue;
    }
    if (e.type === "START_NODE_BATTLE") {
      nodeBattleTier = e.tier ?? pickNodeBattleTier(s);
      continue;
    }
    try {
      const note = applyEffect(s, e, true);
      if (note) {
        notes.push(note);
        if (e.type !== "MODIFY_ENERGY" && e.type !== "SKIP_NODE_COST" && e.type !== "OPEN_CHUTE") {
          historyNotes.push(note);
        }
      }
    } catch (err) {
      console.error("[explore] 事件效果异常（已跳过）", { effectType: e.type, error: err });
      notes.push("事件效果异常（已跳过）");
    }
  }

  s.pendingNotes = notes;
  // 记录里带上所选分支 —— 结算页回顾整趟远征时, 玩家要读得出自己当时做了什么决定。
  s.history.push({
    slot: "node",
    round: s.round,
    segment: s.currentSegment - 1,
    lane: s.currentLane,
    eventId: ev.id,
    eventTitle: ev.title,
    eventKind: ev.kind,
    choiceIndex: index,
    choiceLabel: choice.label,
    notes: historyNotes,
  });
  logLine(s, `第 ${s.round} 轮 · 第 ${s.currentSegment} 段: ${ev.title} · ${choice.label}`);

  if (checkWipe(s)) return true;

  if (leaving) {
    s.phase = "retreated";
    logLine(s, "搭上撤离升降机");
    return true;
  }

  if (nodeBattleTier) {
    s.pendingBattleTier = nodeBattleTier;
    s.pendingEncounterId = encounterForTier(s, nodeBattleTier);
    if (!s.pendingEncounterId) return false;
    s.pendingIsBoss = false;
    s.battleSource = "node";
    s.phase = "inBattle";
    return true;
  }

  // 「逆流净化机」: 立即结束本轮推进。把 currentSegment 直接推到走满, atNode 因此
  // 只剩「前往下一区域」一个出口 —— 不需要为它单开一个状态位。
  if (endRegion) {
    s.currentSegment = segCountOf(s);
    s.pendingNotes = [...notes, "本轮推进到此为止"];
  }

  if (openTerminal && ev.services?.length) {
    openShop(s, ev);
    s.phase = "shopping";
    return true;
  }

  s.phase = "resolving";
  return true;
}

// 结算浮层点「确认」→ 进入节点决策。
// ⚠ 背包满时不许推进 —— pendingPickup 是必须当场处理完的取舍(设计文档 §6.4)。
export function confirmNode(s: ExploreState): boolean {
  if (s.phase !== "resolving") return false;
  if (s.pendingPickup.length || s.pendingLoot.length || s.pendingActions.length) return false;
  s.pendingStory = [];
  s.chuteOpen = false; // 投递口只在开启它的那个节点有效
  const event = landedEvent(s);
  if (event?.hiddenRest) {
    s.restNpcId = event.hiddenRest.npcId;
    s.phase = "resting";
  } else {
    s.phase = "atNode";
  }
  return true;
}

export function closeShopping(s: ExploreState): boolean {
  if (s.phase !== "shopping") return false;
  if (s.pendingPickup.length || s.pendingLoot.length || s.pendingActions.length) return false;
  const notes = closeShop(s);
  if (notes.length) {
    s.pendingNotes = [...s.pendingNotes, ...notes];
    const last = s.history[s.history.length - 1];
    if (last?.slot === "node") last.notes.push(...notes);
    logLine(s, `交易终端: ${notes.join(" · ")}`);
  }
  s.pendingStory = [];
  s.chuteOpen = false;
  const event = landedEvent(s);
  if (event?.hiddenRest) {
    s.restNpcId = event.hiddenRest.npcId;
    s.phase = "resting";
  } else {
    s.phase = "atNode";
  }
  return true;
}

// 还能不能继续推进 —— currentSegment === 4 时 atNode **不得**提供「继续推进」(设计文档 §9.2)。
export function canPushOn(s: ExploreState): boolean {
  return s.phase === "atNode" && s.currentSegment < segCountOf(s);
}

// 「继续推进」: 信号进入下一个推进段。
export function pushOn(s: ExploreState): boolean {
  if (!canPushOn(s)) return false;
  s.phase = "advancing";
  return true;
}

// 「前往下一区域」: 放弃本轮剩余节点, 走完离场演出后打本轮的推进战斗。
// choosingEntry 阶段也允许 —— 那就是设计文档 §1.2 说的「本轮 0 个节点」直推。
//
// ★ 中间多一相 leaving: 玩家**不该被瞬间挪到战斗里** —— 棋子要沿本轮剩下的那条线路一路走完,
//   走到第 4 段终点才弹披露页(它本来就要把整条路径描出来, 现在这条线是被人「走」出来的)。
//   ⚠ 两种情况没有线路可走, 直接落 roundBattle, 不要为了「统一」硬塞一相空演出:
//     ① choosingEntry 直推 —— 连入口都没选, 本轮压根没有路径;
//     ② 已走满 4 段 —— 剩余路线长度为 0。
export function leaveRegion(s: ExploreState): boolean {
  if (s.phase !== "atNode" && s.phase !== "choosingEntry") return false;
  const hasWalk = s.phase === "atNode" && s.entryLane != null && s.currentSegment < segCountOf(s);
  s.phase = hasWalk ? "leaving" : "roundBattle";
  if (!hasWalk) pickRoundBattleEvent(s);
  return true;
}

// 离场行走演出播完(由 RouteBoard 的动画计时器调) → 战斗事件。
// ⚠ 只认 leaving: 演出期间玩家若已被别的路径(团灭/撤离)带走, 这里不能把阶段拽回来。
export function finishLeaving(s: ExploreState): boolean {
  if (s.phase !== "leaving") return false;
  s.phase = "roundBattle";
  pickRoundBattleEvent(s);
  return true;
}

// 本轮剩余没走的节点数 —— atNode 的「前往下一区域」按钮要拿它做后果预告(§11.2)。
export function remainingNodes(s: ExploreState): number {
  return Math.max(0, segCountOf(s) - s.currentSegment);
}

// ---------------------------------------------------------------------------
// 轮次战斗事件
// ---------------------------------------------------------------------------
function pickRoundBattleEvent(s: ExploreState): void {
  const pool = EVENT_POOLS[getMap(s.mapId).eventPoolId]?.battle.filter((event) => !event.disabled) ?? [];
  s.roundBattleEventId = shuffle(s, pool)[0]?.id ?? null;
}

export function roundBattleEvent(s: ExploreState): NodeEvent | null {
  if (!s.roundBattleEventId) return null;
  return EVENT_POOLS[getMap(s.mapId).eventPoolId]?.battle.find(
    (event) => event.id === s.roundBattleEventId,
  ) ?? null;
}

export function engageRoundBattle(s: ExploreState): boolean {
  if (s.phase !== "roundBattle") return false;
  const tier = battleTierOf(s);
  const encounterId = encounterForTier(s, tier);
  if (!encounterId) return false;
  const eventTitle = roundBattleEvent(s)?.title ?? BATTLE_TIER_NAME[tier];

  s.history.push({
    slot: "battle",
    round: s.round,
    segment: -1,
    lane: -1,
    eventId: s.roundBattleEventId ?? "",
    eventTitle,
    eventKind: "battle",
    choiceIndex: -1,
    choiceLabel: "",
    notes: [],
  });
  s.pendingBattleTier = tier;
  s.pendingEncounterId = encounterId;
  s.pendingIsBoss = tier === "t5";
  s.battleSource = "round";
  s.phase = "inBattle";
  s.roundBattleEventId = null;
  logLine(s, `迎战「${eventTitle}」→ ${BATTLE_TIER_NAME[tier]}`);
  return true;
}

// 撤离远征的阶段白名单 = 全部「不限时、等玩家操作」的阶段 ——
// 此时撤离不逃避任何代价; generating 演出期与 revealing 两个限时期一律不许。
// ★ 独立导出是给 UI 用的: 按钮的禁用条件必须与这里同源, 各写一份迟早对不上。
export function canRetreat(s: ExploreState): boolean {
  return (
    s.phase === "sealed" ||
    s.phase === "choosingEntry" ||
    s.phase === "resolving" ||
    s.phase === "resting" ||
    s.phase === "npcEvent" ||
    s.phase === "npcResolving" ||
    s.phase === "atNode" ||
    s.phase === "roundBattle"
  );
}

export function retreat(s: ExploreState): boolean {
  if (!canRetreat(s)) return false;
  s.phase = "retreated";
  logLine(s, "主动撤离了这片区域");
  return true;
}

// ---------------------------------------------------------------------------
// 战斗回填 —— 由 store 层在战斗结束后调用
// ---------------------------------------------------------------------------
// ⚠ 第四参是**敌人 defId 列表**而不是数量: 掉落要查每个敌人自己的 dropTable。
//   数量仍可由 .length 取到, 所以旧口径没有丢失。
export function finishBattle(
  s: ExploreState,
  won: boolean,
  survivors: { charId: string; hp: number; hpLimit?: number; alive: boolean; limitLoss: number }[],
  enemyDefIds: string[],
  challengeBonus = 0,
): { loot: number; items: ItemStack[]; overflow: ItemStack[] } {
  const empty = { loot: 0, items: [], overflow: [] };
  if (s.phase !== "inBattle") return empty;
  s.pendingChallengeBonus = won ? challengeBonus : 0;

  // 血量跨轮与跨战斗继承 —— 这是整套设计的地基
  for (const p of s.party) {
    const found = survivors.find((x) => x.charId === p.charId);
    if (!found) continue;
    p.hpLimit = Math.max(1, Math.min(p.maxHp, p.hpLimit - Math.max(0, Math.round(found.limitLoss))));
    p.hp = Math.max(0, Math.min(p.hpLimit, Math.round(found.hp)));
    p.alive = found.alive;
  }

  if (!won) {
    if (s.battleSource === "round") {
      const last = s.history[s.history.length - 1];
      if (last?.slot === "battle") {
        last.battleResult = "lose";
        last.notes = ["战斗失利 · 远征中断"];
      }
    }
    s.phase = "wiped";
    loseEverything(s);
    s.pendingEncounterId = null;
    s.pendingIsBoss = false;
    s.pendingBattleTier = null;
    s.battleSource = null;
    s.pendingChallengeBonus = 0;
    s.roundBattleEventId = null;
    logLine(s, "推进战斗失利, 远征中断");
    return empty;
  }

  s.stats.kills += enemyDefIds.length;
  const wasBoss = s.pendingIsBoss;
  const wasRoundBattle = s.battleSource === "round";
  const wasNodeBattle = s.battleSource === "node";
  const mult = rewardMultiplier(s.energy);
  // ⚠ 设计文档 §6.1: 战斗胜利**只掉物品**。perEnemy 已归零, 这里只剩 BOSS 的通关奖励。
  let loot = Math.round(enemyDefIds.length * EXPLORE_RULES.loot.perEnemy * mult);
  if (wasBoss) loot += Math.round(EXPLORE_RULES.loot.bossBonus * mult);
  s.loot += loot;

  // 实物掉落: 每个敌人各掷自己的表, 走同一条种子链 ⇒ 同种子的一趟远征掉的东西逐件一致。
  const k = dropCoefficient(s);
  const ctx = dropContext(s);
  const rolled = enemyDefIds.flatMap((id) => rollDropTable(s, getEnemyDef(id).dropTable, k, ctx));
  addPendingLoot(s, rolled);
  s.pendingBoons = rollBoons(s, enemyDefIds.map((id) => getEnemyDef(id).boonTable), k);

  // ⚠ 必须在上面的 dropCoefficient / rollDropTable 之后才清挑战加成。
  s.pendingEncounterId = null;
  s.pendingIsBoss = false;
  s.pendingBattleTier = null;
  s.pendingChallengeBonus = 0;
  s.roundBattleEventId = null;

  const notes: string[] = [];
  if (loot > 0) notes.push(`居民积分 +${loot}`);
  if (rolled.length) notes.push(summarizePendingItems(rolled));
  if (s.pendingBoons.length) notes.push(`额外奖励 ×${s.pendingBoons.length}`);
  s.pendingNotes = [["战斗胜利", ...notes].join(" · ")];

  const last = s.history[s.history.length - 1];
  if (wasRoundBattle) {
    if (last?.slot === "battle") {
      last.battleResult = "win";
      last.notes = ["战斗胜利"];
    }
  } else if (wasNodeBattle && last?.slot === "node" && notes.length) {
    last.notes.push(...notes);
  }

  if (wasNodeBattle) {
    s.battleSource = null;
    s.phase = "atNode";
    return { loot, items: rolled, overflow: [] };
  }

  if (wasBoss || s.round >= s.roundCount) {
    // BOSS 轮胜利 = 通关。轮次走满但不是 BOSS(理论上不会发生)也按通关收尾。
    s.phase = "cleared";
    logLine(s, "回收总控已停机");
    return { loot, items: rolled, overflow: [] };
  }

  // 下一轮: 新区域, 新的一张路由图
  s.round += 1;
  generateRound(s);
  return { loot, items: rolled, overflow: [] };
}

// ---------------------------------------------------------------------------
// 查询辅助(UI 用)
// ---------------------------------------------------------------------------
// ⚠ 背包开放时机是**硬约束**(设计文档 §6.3): 揭示桥接时开背包等于无限延长观察时间,
//   直接废掉核心机制。故必须在这里拦截, 不能只靠 UI 隐藏按钮。
//   推进途中(advancing)与浮现演出(generating)同样锁死 —— 那两拍不接受输入。
//   ★ 老虎机同理: slotSpinning 是本作第二个限时操作, 开背包等于给转轮按暂停(§6.3);
//     slotChoosing 则允许 —— 「打哪场」本来就要看当前状态与背包。
export function canOpenBackpack(s: ExploreState): boolean {
  return (
    s.phase === "sealed" ||
    s.phase === "choosingEntry" ||
    s.phase === "landed" ||
    s.phase === "shopping" ||
    s.phase === "resolving" ||
    s.phase === "resting" ||
    s.phase === "npcEvent" ||
    s.phase === "npcResolving" ||
    s.phase === "atNode" ||
    s.phase === "roundBattle"
  );
}

// 当前落点的节点事件(尚未抵达任何节点时返回 null)。
export function landedEvent(s: ExploreState): NodeEvent | null {
  if (!s.board || s.currentLane == null || s.currentSegment < 1) return null;
  return s.board.nodes[s.currentSegment - 1]?.[s.currentLane] ?? null;
}

export function landedShop(s: ExploreState): ShopState | null {
  return s.phase === "shopping" ? s.shop : null;
}

// 「再推进一个节点, 能量会掉到哪」—— 供 atNode 的后果预告与跨档预警用(§11.2)。
// ⚠ 预告的是**下一个**节点: 已走完 currentSegment 段, 下一节点是第 currentSegment + 1 段
//   (energyCostAt 对越界段号自行 clamp 到最后一档, 走满时显示的就是第 4 段的价)。
export function projectedEnergy(s: ExploreState): number {
  const cost = s.freeNodes > 0 ? 0 : energyCostAt(s.currentSegment + 1);
  return Math.max(0, s.energy - cost);
}

// 本轮玩家的实际推进路径(入口 + 每段落点)。★ 只有 roundBattle 与结算页可以读 ——
// 其余阶段读它等于把答案画在屏幕上(设计文档 §9.3)。
export function tracedPath(s: ExploreState): number[] {
  if (!s.board || s.entryLane == null) return [];
  return [s.entryLane, ...lanePath(s.board, s.entryLane)];
}
