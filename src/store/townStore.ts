// Zustand store: 城镇档案 —— 跨远征持久的玩家资产(个人卡组 / 编队 / 经验 / 居民积分)。
// 与 runStore 的分工: 这里存"永久拥有的东西", runStore 只存"这趟远征的进度"。
// 依赖方向: runStore → townStore(单向); 本 store 不认识 runStore。
// 已接 persist 中间件(localStorage), 刷新页面进度保留;「重置存档」清回初始档。
//
// ★ 角色**不设等级、不加属性点**(《角色养成设计.md》第一章)。
//   角色面板固定, 经验的唯一去处是锻造个人卡组: 升卡组等级 / 抽卡 / 删卡 / 降低最小卡组下限。

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Card, QuirkId, Rarity, StatBlock } from "../engine";
import {
  POLLUTION_RULES,
  QUIRK_DEFS,
  RULES,
  SICK_MOD,
  addStats,
  deckRarityWeights,
  deckUpgradeCost,
  drawCostToday,
  lowerMinSizeCost,
  removeCostToday,
  quirkIdsOf,
} from "../engine";
import {
  CHARACTERS,
  bondPool,
  getBondDef,
  getCardDef,
  getCharacter,
  getItemDef,
  makeCard,
  makeItemStack,
  canEquipModule,
  recomputeCardModule,
  craftCheck,
  getModuleRecipe,
  canActivate,
  canRefund,
  getBadge,
  getNode,
  spentPoints,
  type CharacterDef,
  isTechAvailable,
  nutritionHeal,
  nutritionPods,
  nutritionTechCheck,
  NUTRITION_TECHS,
  NUTRITION_TREAT_COST,
} from "../data";
import {
  DEFAULT_SHOP_LEVEL,
  rollShopStock,
  shopRefreshCost,
  type ShopSlot,
} from "../data/shop";
import { consumeItems, removeByUid } from "../items/inventory";
import { rollToFlat } from "../items/equipRoll";
import type { EquipSlot, ItemStack } from "../items/types";
import type { BondBias } from "../explore/types";

// 装备修正层。★ 不再是占位 —— 它由 equipModsOf() 从 CharacterState.equipped 现算,
// 不单独持久化(存两份必然对不上)。deriveStats 仍是局外面板的唯一换算点。
export interface EquipmentMods {
  flat?: Partial<StatBlock>;
  pct?: Partial<StatBlock>;
}

// 三个装备槽(《物品设计.md》第二章), 均在开局开放。
export const EQUIP_SLOTS: EquipSlot[] = ["weapon", "armor", "trinket"];

export interface CharacterState {
  charId: string;
  // ★ 生命三段中的前两段是**持久资产**: 远征打掉的血与体力极限都是永久损伤, 跨日传承。
  //   第三段 maxHp 不存 —— 它由 deriveStats(角色基础 + 装备)现算, 存两份必然对不上。
  hp: number; // 上次远征回城时记录的当前 HP
  hpLimit: number; // 上次远征回城时记录的体力极限(hp ≤ hpLimit ≤ deriveStats().maxHp)
  exp: number; // ★ 可用经验池(不再有等级, 也不再回落); 锻造直接从这里扣
  expEarned: number; // 累计获得的经验(纯展示用)
  deck: Card[]; // 个人卡组(实例); 战斗卡组 = 上阵角色个人卡组的集合
  deckLevel: number; // 卡组等级, 从 0 起, 满级 RULES.deck.levelMax; 只影响抽卡时的稀有度权重
  minDeckSize: number; // 当前最小卡组下限, 删卡不能把卡组删到它以下
  // 已穿戴的三件装备(物品实例本身, 不是修正层)。★ 穿在身上的**不占背包/仓库格**。
  equipped: Record<EquipSlot, ItemStack | null>;
  pendingDraw: string[] | null; // 抽卡进行中的候选 defId; 持久化 => 刷新也躲不掉 3 选 1
  forgeDay: number; // 上次锻造发生在第几日, 与 TownStore.day 比对
  drawUsedToday: number; // 今日已扩充次数
  removeUsedToday: number; // 今日已精简次数
  pollution: number; // 个人污染值, 达到阈值后归零
  sick: boolean; // 是否已经进入永久生病状态
  quirks: QuirkId[]; // 永久怪癖, 最多 POLLUTION_RULES.maxQuirks 个
}

// ---------------------------------------------------------------------------
// 商店(据点设施 shop)
// ---------------------------------------------------------------------------
// 货架是**存档的一部分**: 关掉页面再回来, 今天挑剩下的还是今天那批货。
// 「隔日重置」的唯一真相点是 advanceDay() —— UI 不再判一次日期。
export interface ShopState {
  level: number; // 设施等级, 默认 1; 提升入口本期不开放
  day: number; // 这批货是哪一天上的(与 TownStore.day 比对, 只作护栏与展示)
  refreshes: number; // 今日已花积分刷新的次数 → 决定下次刷新价(隔日归 0)
  slots: ShopSlot[];
}

export interface NutritionState {
  techs: string[];
  occupants: { charId: string; heal: number; day: number }[];
}

function freshShop(day: number, level = DEFAULT_SHOP_LEVEL): ShopState {
  return { level, day, refreshes: 0, slots: rollShopStock(level) };
}

// 战后经验结算报告条目(交给结算/胜利界面展示)
export interface ExpGain {
  charId: string;
  gained: number;
  expAfter: number; // 结算后的可用经验池
}

export interface ContaminationHit {
  charId: string;
  charName: string;
  cardName: string;
}

export interface SquadTalentState {
  badgeId: string | null;
  nodes: string[]; // 已激活的节点 id(天赋树按前置依赖逐颗点亮)
}

export interface CodexState {
  items: string[];
  cards: string[];
  enemies: string[];
}

interface TownStore {
  characters: Record<string, CharacterState>;
  // ★ 已唤醒(已解锁)的角色 id, 按唤醒先后。CHARACTERS 里不在这张名单上的都还躺在冬眠仓里。
  // ⚠ characters 仍是**全量**建档(见 freshProfile) —— 「有没有解锁」只看这里, 各处取
  //   characters[id] 才不必判空。上阵资格 = 在这张名单上。
  awakened: string[];
  clearedMaps: string[]; // 已通关的地图 id
  party: string[]; // 上阵角色 id, 1 ≤ length ≤ RULES.progression.partySize, 且必须 ⊆ awakened
  loot: number; // 居民积分余额 —— 主要来自废料出售; 团灭时本趟的产出全丢
  // ★ 物资中转仓: **不设上限**(与背包的 24 格形成对照)。远征活着回来才有东西进来。
  storage: ItemStack[];
  day: number; // 生存天数, 从第 1 日起。★ 只由 advanceDay() 推进(出击后返回据点算一日)
  shop: ShopState;
  nutrition: NutritionState;
  squadTalent: SquadTalentState;
  codex: CodexState;
  initialized: boolean;

  ensureProfile: () => void; // 幂等: 首次进城镇时建档
  markMapCleared: (mapId: string) => void; // 记录通关地图, 已记录则保持不变
  recordCodex: (patch: Partial<CodexState>) => void;
  bankLoot: (amount: number) => void; // 远征结束落袋
  deposit: (stacks: ItemStack[]) => void; // 远征结束: 背包 + 已寄回的整批入仓
  discardStored: (uid: string) => void; // 仓库里丢弃(二次确认在 UI)
  withdraw: (uid: string) => ItemStack | null; // 出击准备: 把一整堆从仓库取出交给调用方
  sellItem: (uid: string) => void; // 回收台: 按 sellValue 出售换居民积分
  equipItem: (charId: string, uid: string) => void; // 从仓库取一件穿上
  unequipItem: (charId: string, slot: EquipSlot) => void; // 卸下, 退回仓库
  // ---- 不经仓库的两个原子操作 ----
  // ★ 远征途中换装(探索页的角色档案)要把物品在**背包**与槽位之间搬, 与仓库无关。
  //   编排在 runStore(唯一同时认识城镇与探索的那一层), 这里只负责槽位这一半。
  wearStack: (charId: string, stack: ItemStack) => ItemStack | null; // 穿上, 返回被替下的旧件
  takeOffStack: (charId: string, slot: EquipSlot) => ItemStack | null; // 卸下并交出
  equipCardModule: (charId: string, cardUid: string, moduleUid: string) => void;
  /** 直接把一件**不在仓库里**的模组装到卡上(远征途中从待拾取框直接装载)。成功返回 true。 */
  installModuleStack: (charId: string, cardUid: string, stack: ItemStack) => boolean;
  unequipCardModule: (charId: string, cardUid: string) => void;
  craftModule: (charId: string, itemId: string) => void;
  resetProfile: () => void; // 重置存档
  selectSquadBadge: (id: string) => void;
  activateTalentNode: (nodeId: string) => void;
  refundTalentNode: (nodeId: string) => void;
  resetSquadTalent: () => void;
  toggleParty: (charId: string) => void; // 上阵/下阵
  awaken: (charId: string) => void; // 冬眠仓: 花 awakenCost 居民积分解封一名休眠队员
  admitToNutritionPod: (charId: string) => void; // 营养舱: 扣积分并安排次日治疗
  researchNutritionTech: (techId: string) => void; // 营养舱: 研究舱位或治疗量科技
  grantExp: (charIds: string[], amount: number) => ExpGain[]; // 发经验(不再有升级)
  grantExpEach: (byChar: Record<string, number>) => ExpGain[]; // 按角色分别发经验
  contaminateCards: (charIds: string[], count: number, each?: boolean) => ContaminationHit[]; // 随机污染队伍个人卡组中的未污染卡
  cureQuirk: (charId: string, quirkId?: QuirkId) => QuirkId | null;
  reducePollution: (charId: string, amount: number) => number;
  purifyCards: (charId: string, count: number, uids?: string[]) => number;
  syncBattleConditions: (
    conditions: { charId: string; pollution: number; sick: boolean; quirks: string[] }[],
  ) => void; // 战斗结束回填污染、疾病和怪癖
  syncExpeditionStatus: (
    conditions: { charId: string; hp: number; hpLimit: number; pollution: number }[],
  ) => void; // 回城时回填本趟远征最终 HP、体力极限与污染值(三者都是永久损伤)

  // ---- 天数与商店 ----
  advanceDay: () => void; // 推进一日 + 重摇货架(由 runStore.backToTown 调用)
  refreshShop: () => void; // 花积分立刻重摇货架, 当日刷得越多下次越贵
  buyShopItem: (key: string) => void; // 买下一格货, 扣积分 + 入仓

  // ---- 卡组锻造(经验的唯一去处) ----
  upgradeDeck: (charId: string) => void; // 升一级卡组等级
  forgeDraw: (charId: string) => void; // 花 drawCost 经验 → 摇稀有度 → 出 drawChoices 张候选
  cancelDraw: (charId: string) => void; // 放弃待选卡, 不退还已支付的经验
  grantFreeDraw: (charId: string) => void; // 不消耗经验 → 出 drawChoices 张候选
  pickDraw: (charId: string, cardDefId: string) => void; // 3 选 1 落袋, 清 pendingDraw
  rollPartyDrawOffers: (charIds: string[]) => { charId: string; cardDefId: string }[];
  pickPartyDraw: (charId: string, cardDefId: string) => boolean;
  removeCard: (charId: string, uid: string) => void; // 花 removeCost 经验删一张卡
  removeCardFree: (charId: string, uid: string) => void; // 不消耗经验删一张卡
  reforgeEquipped: (charId: string, slot: EquipSlot, bias?: BondBias) => void;
  lowerMinDeck: (charId: string) => void; // 花经验把最小卡组下限降 1
}

// ---------------------------------------------------------------------------
// 面板结算 —— 局外唯一换算点(UI 与开战共用)。
// 最终面板 =(角色基础 + 装备固定)×(1 + 装备百分比); 战斗内那一层在引擎里叠(engine/stats)。
// ---------------------------------------------------------------------------
// 已穿戴的三件装备 → 一个合并后的修正层。同名 flat 相加、同名 pct 相加。
// ⚠ 现算而不是存一份: 存两份(equipped 与 equipment)必然会有一份先过期。
export function equipModsOf(cs: CharacterState): EquipmentMods {
  const flat: Partial<StatBlock> = {};
  const pct: Partial<StatBlock> = {};
  for (const slot of EQUIP_SLOTS) {
    const st = cs.equipped?.[slot];
    if (!st) continue;
    const def = getItemDef(st.itemId);
    const flatMods = st.roll ? rollToFlat(st.roll) : def.mods?.flat;
    if (flatMods) for (const [k, v] of Object.entries(flatMods) as [keyof StatBlock, number][]) {
      flat[k] = (flat[k] ?? 0) + v;
    }
    for (const [k, v] of Object.entries(def.mods?.pct ?? {}) as [keyof StatBlock, number][]) {
      pct[k] = (pct[k] ?? 0) + v;
    }
  }
  return { flat, pct };
}

// 全队羁绊计数(《羁绊设计概览.md》§2.1) —— 遍历**上阵队伍**的 9 个槽(3 角色 × 3 槽):
//   def.affinity   = 羁绊饰品的固定羁绊(本期尚无这类数据, 但先支持, 免得日后要改两处)
//   stack.affinity = 掉落时 roll 出的随机羁绊
// 两者都算数, 因此一件羁绊饰品日后可以同时贡献两条。
// ⚠ 只算**上阵**角色 —— 羁绊是队伍构筑, 躺在冬眠仓里的人穿再多也不作数。
// ⚠ 现算不存储, 与 equipModsOf 同理: 存一份必然会与 equipped 对不上。
export function bondCountsOf(
  characters: Record<string, CharacterState>,
  party: string[],
): Record<string, number> {
  const out: Record<string, number> = {};
  const bump = (id: string | undefined) => {
    // getBondDef 返回 undefined = 已下线的羁绊 id(旧存档残留), 静默跳过
    if (id && getBondDef(id)) out[id] = (out[id] ?? 0) + 1;
  };
  for (const charId of party) {
    const cs = characters[charId];
    if (!cs) continue;
    for (const slot of EQUIP_SLOTS) {
      const st = cs.equipped?.[slot];
      if (!st) continue;
      bump(getItemDef(st.itemId).affinity);
      bump(st.affinity);
    }
  }
  return out;
}

export function deriveStats(cs: CharacterState): StatBlock {
  const base = getCharacter(cs.charId).base;
  const eq = equipModsOf(cs);
  const flat = addStats(base, eq.flat ?? {});
  const pct: Partial<StatBlock> = { ...(eq.pct ?? {}) };
  const addPct = (mod: Partial<StatBlock> | undefined) => {
    for (const [key, value] of Object.entries(mod ?? {}) as [keyof StatBlock, number][]) {
      pct[key] = (pct[key] ?? 0) + value;
    }
  };
  if (cs.sick) addPct(SICK_MOD.pct);
  for (const quirkId of quirkIdsOf(cs.quirks)) addPct(QUIRK_DEFS[quirkId].mod.pct);
  const out = { ...flat };
  for (const k of Object.keys(out) as (keyof StatBlock)[]) {
    out[k] = flat[k] * (1 + (pct[k] ?? 0) / 100);
  }
  out.maxHp = Math.max(1, out.maxHp);
  return out;
}

// 局外生命三段的**唯一**换算点: 存档里的 hp / hpLimit 叠上现算的 maxHp。
// ★ 存档里那两段是上一趟远征留下的永久损伤; maxHp 则跟着装备/怪癖实时浮动 ——
//   所以卸掉一件加血装之后, 旧的 hpLimit 可能反而高过 maxHp, 必须在这里夹一次。
// ⚠ 出击快照(runStore.partySnapshot)、城镇 UI 与远征换装同步都走这一个函数,
//   各写一套夹取逻辑迟早对不上。
export function vitalsOf(cs: CharacterState): { hp: number; hpLimit: number; maxHp: number } {
  const maxHp = Math.max(1, Math.round(deriveStats(cs).maxHp));
  const hpLimit = Math.max(1, Math.min(maxHp, Math.round(cs.hpLimit ?? maxHp)));
  const hp = Math.max(1, Math.min(hpLimit, Math.round(cs.hp ?? hpLimit)));
  return { hp, hpLimit, maxHp };
}

// 装备换过之后把存档里的生命三段跟着平移。
// ★ 口径与远征途中的 explore/session.syncPartyVitals **完全一致**: hpLimit 读作
//   「生命上限 − 永久损伤」, 故随上限增减同步平移, 损伤量本身保留; 当前 HP 只裁不补
//   (装备变强不回血, 变弱也不会把人打死)。
// ⚠ 少了这一步, 远征打掉 20 点极限后回城穿上一件 +20 生命的装备, 损伤会凭空翻倍成 40 点。
// ⚠ 调用点只有 wearStack / takeOffStack 两个原子操作 —— equipItem / unequipItem 复用它们。
function shiftVitals(before: CharacterState, after: CharacterState): CharacterState {
  const prev = vitalsOf(before);
  const nextMax = Math.max(1, Math.round(deriveStats(after).maxHp));
  const hpLimit = Math.max(1, Math.min(nextMax, prev.hpLimit + (nextMax - prev.maxHp)));
  return { ...after, hpLimit, hp: Math.max(1, Math.min(hpLimit, prev.hp)) };
}

// ---------------------------------------------------------------------------
// 卡组约束 —— 稀有度限携与最小卡组下限(《角色养成设计.md》4.2)。
// ---------------------------------------------------------------------------
export function countByRarity(deck: Card[]): Record<Rarity, number> {
  const out: Record<Rarity, number> = { common: 0, uncommon: 0, rare: 0 };
  for (const c of deck) {
    const rarity = c.rarity ?? "common";
    if (rarity === "basic") continue;
    out[rarity] += 1;
  }
  return out;
}

// 该稀有度还能不能再收一张。⚠ 硬约束, 不受卡组等级/装备影响。
export function canAddRarity(deck: Card[], rarity: Rarity): boolean {
  return countByRarity(deck)[rarity] < RULES.deck.rarityCap[rarity];
}

export function countByDefId(deck: Card[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const card of deck) out[card.id] = (out[card.id] ?? 0) + 1;
  return out;
}

export function canAddCopy(deck: Card[], defId: string): boolean {
  const rarity = getCardDef(defId).rarity ?? "common";
  if (rarity === "basic") return true;
  return (countByDefId(deck)[defId] ?? 0) < RULES.deck.copyCap[rarity];
}

export function availablePools(cs: CharacterState): Record<Rarity, string[]> {
  const pools = getCharacter(cs.charId).pools;
  const out = {} as Record<Rarity, string[]>;
  for (const rarity of ["common", "uncommon", "rare"] as Rarity[]) {
    out[rarity] = canAddRarity(cs.deck, rarity)
      ? pools[rarity].filter((defId) => canAddCopy(cs.deck, defId))
      : [];
  }
  return out;
}

// 按卡组等级摇一次稀有度。该档卡池为空时自动降级(rare → uncommon → common)。
function rollRarity(level: number, pools: Record<Rarity, string[]>, rand: () => number): Rarity {
  const weights = deckRarityWeights(level);
  const order: Rarity[] = ["common", "uncommon", "rare"];
  const total = order.reduce((s, r) => s + (pools[r].length ? weights[r] : 0), 0);
  if (total <= 0) return "common";
  let roll = rand() * total;
  for (const r of order) {
    if (!pools[r].length) continue;
    roll -= weights[r];
    if (roll <= 0) return r;
  }
  return "common";
}

function rollDrawOptions(cs: CharacterState): string[] | null {
  const pools = availablePools(cs);
  const rarity = rollRarity(cs.deckLevel, pools, Math.random);
  const pool = pools[rarity];
  if (!pool.length) return null;
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(RULES.deck.drawChoices, shuffled.length));
}

function rollPartyDrawOption(cs: CharacterState): string | null {
  const pools = availablePools(cs);
  const rarity = rollRarity(cs.deckLevel, pools, Math.random);
  const pool = pools[rarity];
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
}

function addCardToDeck(cs: CharacterState, cardDefId: string): boolean {
  const card = makeCard(cardDefId);
  const rarity = card.rarity === "basic" ? "common" : card.rarity ?? "common";
  if (!canAddRarity(cs.deck, rarity) || !canAddCopy(cs.deck, cardDefId)) return false;
  cs.deck = [...cs.deck, card];
  return true;
}

function cardBelongsToCharacter(cs: CharacterState, cardDefId: string): boolean {
  return Object.values(getCharacter(cs.charId).pools).some((pool) => pool.includes(cardDefId));
}

// 取该角色今日的锻造用量; 跨日自动归零(懒重置, 不依赖 advanceDay)。
function todayUsage(cs: CharacterState, day: number): { draw: number; remove: number } {
  if (cs.forgeDay !== day) return { draw: 0, remove: 0 };
  return { draw: cs.drawUsedToday, remove: cs.removeUsedToday };
}

export function deckForgeCosts(cs: CharacterState, day: number): {
  draw: number;
  remove: number;
  upgrade: number | null;
} {
  const usage = todayUsage(cs, day);
  return {
    draw: drawCostToday(usage.draw),
    remove: removeCostToday(usage.remove),
    upgrade: deckUpgradeCost(cs.deckLevel),
  };
}

function freshCharacter(def: CharacterDef): CharacterState {
  return {
    charId: def.id,
    hp: Math.max(1, Math.round(def.base.maxHp)),
    hpLimit: Math.max(1, Math.round(def.base.maxHp)),
    exp: 0,
    expEarned: 0,
    deck: def.startingCardIds.map((cid) => ({ ...makeCard(cid)})),
    deckLevel: 0,
    minDeckSize: RULES.deck.initialMinSize,
    equipped: { weapon: null, armor: null, trinket: null },
    pendingDraw: null,
    forgeDay: 1,
    drawUsedToday: 0,
    removeUsedToday: 0,
    pollution: INITIAL_POLLUTION,
    sick: false,
    quirks: [],
  };
}

// ★ 开局醒着的是 INITIAL_AWAKENED 上的人(剑士 + 预言家 + 植物学家), 其余全躺在冬眠仓等着被解封。
//   characters 仍然**全量**建档 —— 未唤醒角色也有一份初始档案, 解封那一刻直接可用,
//   awaken() 不需要建档, 各处 characters[id] 也不必判空。
// 开局就已唤醒并直接上阵的角色 id(按顺序)。
const INITIAL_AWAKENED = ["swordsman", "prophet", "botanist", "alchemist"];
const INITIAL_TEST_EXP = 2000;
const INITIAL_POLLUTION = 30;

const INITIAL_CONSUMABLE_IDS = [
  "sugar-cube-c",
  "medical-kit-c",
  "holy-water-c",
  "fruit-juice-c",
] as const;

// 模组制造的测试材料。开局给足, 两种模组各造一次之后还剩余量。
const INITIAL_MATERIAL_IDS = ["logic-cube", "standard-gear", "standard-battery"] as const;
const INITIAL_CRYSTAL_IDS = ["green-crystal", "blue-crystal", "red-crystal"] as const;

function freshStorage(): ItemStack[] {
  return [
    makeItemStack("rush-module"),
    ...INITIAL_CONSUMABLE_IDS.flatMap((itemId) =>
      Array.from({ length: 3 }, () => makeItemStack(itemId)),
    ),
    ...INITIAL_MATERIAL_IDS.flatMap((itemId) =>
      Array.from({ length: 6 }, () => makeItemStack(itemId)),
    ),
    ...INITIAL_CRYSTAL_IDS.map((itemId) => makeItemStack(itemId)),
  ];
}

function freshProfile(includeInitialExp = true): {
  characters: Record<string, CharacterState>;
  awakened: string[];
  clearedMaps: string[];
  party: string[];
  squadTalent: SquadTalentState;
  codex: CodexState;
} {
  const characters: Record<string, CharacterState> = {};
  for (const c of CHARACTERS) characters[c.id] = freshCharacter(c);
  // 名单里不存在的 id 直接忽略, 保证改角色数据时这里不会崩
  const awakened = INITIAL_AWAKENED.filter((id) => characters[id]);
  if (includeInitialExp) {
    for (const charId of awakened) {
      characters[charId] = {
        ...characters[charId],
        exp: INITIAL_TEST_EXP,
        expEarned: INITIAL_TEST_EXP,
      };
    }
  }
  // 上阵人数有上限, 初始队伍按名单顺序截断
  return {
    characters,
    awakened,
    clearedMaps: [],
    party: awakened.slice(0, RULES.progression.partySize),
    squadTalent: { badgeId: null, nodes: [] },
    codex: { items: [], cards: [], enemies: [] },
  };
}

export const TRAINING_POINT_CONTRIBUTORS = 5;

export function squadTrainingPoints(
  state: Pick<TownStore, "characters" | "awakened">,
): number {
  const deckLevels = state.awakened
    .map((charId) => state.characters[charId]?.deckLevel ?? 0)
    .sort((left, right) => right - left);
  return deckLevels
    .slice(0, TRAINING_POINT_CONTRIBUTORS)
    .reduce((sum, level) => sum + level, 0);
}

export const useTownStore = create<TownStore>()(
  persist(
    (set, get) => ({
      characters: {},
      awakened: [],
      clearedMaps: [],
      party: [],
      loot: 10000,
      storage: [],
      day: 1,
      shop: freshShop(1),
      nutrition: { techs: [], occupants: [] },
      squadTalent: { badgeId: null, nodes: [] },
      codex: { items: [], cards: [], enemies: [] },
      initialized: false,

      ensureProfile: () => {
        if (get().initialized) return;
        set({
          ...freshProfile(),
          loot: 10000,
          storage: freshStorage(),
          day: 1,
          shop: freshShop(1),
          nutrition: { techs: [], occupants: [] },
          initialized: true,
        });
      },

      markMapCleared: (mapId) => {
        const { clearedMaps } = get();
        if (clearedMaps.includes(mapId)) return;
        set({ clearedMaps: [...clearedMaps, mapId] });
      },

      recordCodex: (patch) => {
        const current = get().codex;
        const next: CodexState = {
          items: patch.items?.length ? [...new Set([...current.items, ...patch.items])] : current.items,
          cards: patch.cards?.length ? [...new Set([...current.cards, ...patch.cards])] : current.cards,
          enemies: patch.enemies?.length ? [...new Set([...current.enemies, ...patch.enemies])] : current.enemies,
        };
        if (
          next.items.length === current.items.length &&
          next.cards.length === current.cards.length &&
          next.enemies.length === current.enemies.length
        ) return;
        set({ codex: next });
      },

      resetProfile: () =>
        set({
          ...freshProfile(false),
          loot: 0,
          storage: freshStorage(),
          day: 1,
          shop: freshShop(1),
          nutrition: { techs: [], occupants: [] },
          initialized: true,
        }),

      // 切换小队徽章。★ 切换即重置整棵树(nodes 清空, 训练点全部回到池子)——
      //   「换徽章会丢掉已投入的点」这一确认在 UI 层做, store 只负责落账。
      //   ⚠ locked 的占位徽章直接拒绝, UI 与 store 两层都拦。
      selectSquadBadge: (id) => {
        const badge = getBadge(id);
        if (!badge || badge.locked) return;
        set({ squadTalent: { badgeId: id, nodes: [] } });
      },

      // 点亮一个天赋节点。校验用数据层的 canActivate:
      //   未激活 + 前置满足 + 剩余训练点(总训练点 - 本徽章已投入)够付。
      activateTalentNode: (nodeId) => {
        const { squadTalent } = get();
        if (!squadTalent.badgeId) return;
        const badge = getBadge(squadTalent.badgeId);
        if (!badge || !getNode(badge, nodeId)) return;
        const remaining = squadTrainingPoints(get()) - spentPoints(badge, squadTalent.nodes);
        if (!canActivate(badge, squadTalent.nodes, nodeId, remaining)) return;
        set({
          squadTalent: {
            badgeId: badge.id,
            nodes: [...squadTalent.nodes, nodeId],
          },
        });
      },

      // 单点退还。校验用 canRefund: 退还后不破坏其余节点的前置依赖。
      refundTalentNode: (nodeId) => {
        const { squadTalent } = get();
        if (!squadTalent.badgeId) return;
        const badge = getBadge(squadTalent.badgeId);
        if (!badge || !canRefund(badge, squadTalent.nodes, nodeId)) return;
        set({
          squadTalent: {
            badgeId: badge.id,
            nodes: squadTalent.nodes.filter((id) => id !== nodeId),
          },
        });
      },

      resetSquadTalent: () => {
        const { squadTalent } = get();
        if (!squadTalent.badgeId) return;
        set({ squadTalent: { badgeId: squadTalent.badgeId, nodes: [] } });
      },

      bankLoot: (amount) => {
        if (amount <= 0) return;
        set({ loot: get().loot + amount });
      },

      // ---- 物资中转仓 ----

      // 远征落袋。仓库无上限, 所以只是接上去 —— 不会有"装不下"这回事。
      deposit: (stacks) => {
        if (!stacks.length) return; // 幂等护栏, 同 bankLoot
        set({ storage: [...get().storage, ...stacks.map((s) => ({ ...s }))] });
      },

      discardStored: (uid) => {
        const next = removeByUid(get().storage, uid);
        if (next !== get().storage) set({ storage: next });
      },

      // 出击准备: 把一整堆从仓库取出, 交给调用方(store/sortieStore 会把它塞进待出发的背包)。
      // ★ 刻意返回那一堆而不是只做删除 —— 调用方需要拿到 uid 与 count 才能原样退回。
      // ⚠ 按 uid 整堆取, **不拆堆**: 仓库里合并显示的是 UI 的事(mergeStacksForDisplay),
      //   状态里存的本来就是逐 uid 的独立堆。
      withdraw: (uid) => {
        const { storage } = get();
        const st = storage.find((s) => s.uid === uid);
        if (!st) return null;
        set({ storage: removeByUid(storage, uid) });
        return { ...st };
      },

      // 回收台。⚠ 只有填了 sellValue 的物品(目前是废料与装备)能卖 ——
      // 模组材料与数据存档留着有别的用处, 卖掉会让日后接模组系统时无货可用。
      sellItem: (uid) => {
        const { storage, loot } = get();
        const st = storage.find((s) => s.uid === uid);
        if (!st) return;
        const value = getItemDef(st.itemId).sellValue;
        if (!value) return;
        set({ storage: removeByUid(storage, uid), loot: loot + value * st.count });
      },

      // ---- 三装备槽(《物品设计.md》第二章) ----
      // 穿上 = 从仓库移出、进角色的槽位; 被替下的旧装备退回仓库, 不会凭空消失。
      // ⚠ 同一角色的同类槽位只能有一件; 不同角色可以各装一件同类装备。
      equipItem: (charId, uid) => {
        const { storage, characters } = get();
        const st = storage.find((s) => s.uid === uid);
        if (!st || !characters[charId]) return;
        const def = getItemDef(st.itemId);
        if (def.category !== "equipment" || !def.slot) return;
        // ⚠ 守卫全部走完才动手: 先把物品从仓库拿走再穿 —— 反过来的话 wearStack 交回的旧件
        //   会被这次 set 的 storage 快照(仍含新件)覆盖掉。
        set({ storage: removeByUid(storage, uid) });
        const old = get().wearStack(charId, st);
        if (old) set({ storage: [...get().storage, old] });
      },

      unequipItem: (charId, slot) => {
        const st = get().takeOffStack(charId, slot);
        if (!st) return;
        set({ storage: [...get().storage, st] });
      },

      // 穿上一件**已经在调用方手里**的装备(不从仓库取)。返回被替下的旧件, 由调用方决定它去哪。
      wearStack: (charId, stack) => {
        const { characters } = get();
        const cs = characters[charId];
        if (!cs) return null;
        const def = getItemDef(stack.itemId);
        if (def.category !== "equipment" || !def.slot) return null;

        const old = cs.equipped[def.slot];
        set({
          characters: {
            ...characters,
            [charId]: shiftVitals(cs, {
              ...cs,
              equipped: { ...cs.equipped, [def.slot]: { ...stack } },
            }),
          },
        });
        return old ? { ...old } : null;
      },

      // 卸下并把物品交出去(不进仓库)。槽位本来就空则返回 null, 不做任何改动。
      takeOffStack: (charId, slot) => {
        const { characters } = get();
        const cs = characters[charId];
        const st = cs?.equipped?.[slot];
        if (!cs || !st) return null;
        set({
          characters: {
            ...characters,
            [charId]: shiftVitals(cs, { ...cs, equipped: { ...cs.equipped, [slot]: null } }),
          },
        });
        return { ...st };
      },

      equipCardModule: (charId, cardUid, moduleUid) => {
        const moduleStack = get().storage.find((stack) => stack.uid === moduleUid);
        if (!moduleStack) return;
        // ★ 先装、装成了才扣仓库 —— 校验全在 installModuleStack 里, 这里不重复一遍。
        if (get().installModuleStack(charId, cardUid, moduleStack))
          set({ storage: removeByUid(get().storage, moduleUid) });
      },

      // 模组来源无关的装配核心。仓库装配与远征途中「从战利品直接装载」共用同一份校验,
      // 差别只在调用方要不要把这件模组从某个容器里扣掉。
      installModuleStack: (charId, cardUid, moduleStack) => {
        const { characters } = get();
        const cs = characters[charId];
        const card = cs?.deck.find((entry) => entry.uid === cardUid);
        if (!cs || !card || card.cardModule) return false;
        if (getItemDef(moduleStack.itemId).category !== "module") return false;
        if (!canEquipModule(card, moduleStack.itemId)) return false;

        const nextCard = { ...card, cardModule: { uid: moduleStack.uid, itemId: moduleStack.itemId } };
        recomputeCardModule(nextCard);
        set({
          characters: {
            ...characters,
            [charId]: {
              ...cs,
              deck: cs.deck.map((entry) => (entry.uid === cardUid ? nextCard : entry)),
            },
          },
        });
        return true;
      },

      unequipCardModule: (charId, cardUid) => {
        const { storage, characters } = get();
        const cs = characters[charId];
        const card = cs?.deck.find((entry) => entry.uid === cardUid);
        if (!cs || !card?.cardModule) return;

        const nextCard = { ...card, cardModule: null };
        recomputeCardModule(nextCard);
        set({
          storage: [...storage, { uid: card.cardModule.uid, itemId: card.cardModule.itemId, count: 1 }],
          characters: {
            ...characters,
            [charId]: {
              ...cs,
              deck: cs.deck.map((entry) => (entry.uid === cardUid ? nextCard : entry)),
            },
          },
        });
      },

      // ---- 模组制造 ----
      // 选定角色 → 按配方扣该角色经验与仓库材料 → 产出模组进仓库。
      // ⚠ 可行性判定统一走 data/moduleCrafting 的 craftCheck, UI 的置灰读的是同一个函数。
      craftModule: (charId, itemId) => {
        const { storage, characters } = get();
        const cs = characters[charId];
        const recipe = getModuleRecipe(charId, itemId);
        if (!cs || !recipe) return;
        if (!craftCheck(recipe, cs.exp, storage).ok) return;

        // 逐堆扣材料: 仓库存的是逐 uid 的独立堆, 扣空的堆整堆移除。
        let nextStorage = storage;
        for (const material of recipe.materials) {
          let left = material.count;
          for (const stack of nextStorage.filter((entry) => entry.itemId === material.itemId)) {
            if (left <= 0) break;
            const take = Math.min(left, stack.count);
            left -= take;
            nextStorage =
              take >= stack.count
                ? removeByUid(nextStorage, stack.uid)
                : nextStorage.map((entry) =>
                    entry.uid === stack.uid ? { ...entry, count: entry.count - take } : entry,
                  );
          }
        }

        set({
          storage: [...nextStorage, makeItemStack(recipe.itemId)],
          // expEarned 是累计获得量, 只增不减 —— 消费只动可用经验池。
          characters: { ...characters, [charId]: { ...cs, exp: cs.exp - recipe.exp } },
        });
      },
      toggleParty: (charId) => {
        const { party, characters, awakened, nutrition } = get();
        if (!characters[charId]) return;
        if (nutrition.occupants.some((occupant) => occupant.charId === charId)) return;
        if (party.includes(charId)) {
          if (party.length <= 1) return; // 至少保留 1 人上阵
          set({ party: party.filter((id) => id !== charId) });
        } else {
          if (!awakened.includes(charId)) return; // 还在冬眠仓里的人上不了阵
          if (party.length >= RULES.progression.partySize) return;
          set({ party: [...party, charId] });
        }
      },

      // 冬眠仓解封: 扣居民积分 + 进 awakened 名单。
      // ⚠ 刻意**不自动上阵** —— 队伍可能已经满员, 自动塞人要么失败要么得替谁下阵,
      //   两种都不该由 store 替玩家决定。解封后由玩家在冬眠仓里手动编队。
      awaken: (charId) => {
        const { characters, awakened, loot } = get();
        const cost = RULES.progression.awakenCost;
        if (!characters[charId] || awakened.includes(charId) || loot < cost) return;
        set({ awakened: [...awakened, charId], loot: loot - cost });
      },

      admitToNutritionPod: (charId) => {
        const { awakened, characters, day, loot, nutrition, party } = get();
        const cs = characters[charId];
        if (!cs || !awakened.includes(charId)) return;
        if (nutrition.occupants.some((occupant) => occupant.charId === charId)) return;
        if (nutrition.occupants.length >= nutritionPods(nutrition.techs)) return;
        if (loot < NUTRITION_TREAT_COST) return;

        const vitals = vitalsOf(cs);
        if (vitals.hpLimit >= vitals.maxHp) return;
        if (party.includes(charId) && party.length <= 1) return;

        set({
          loot: loot - NUTRITION_TREAT_COST,
          party: party.filter((id) => id !== charId),
          nutrition: {
            ...nutrition,
            occupants: [
              ...nutrition.occupants,
              { charId, heal: nutritionHeal(nutrition.techs), day },
            ],
          },
        });
      },

      researchNutritionTech: (techId) => {
        const { loot, nutrition, storage } = get();
        const tech = NUTRITION_TECHS.find((entry) => entry.id === techId);
        if (!tech || !isTechAvailable(tech, nutrition.techs)) return;
        if (!nutritionTechCheck(tech, loot, storage).ok) return;

        let nextStorage = storage;
        for (const material of tech.materials) {
          nextStorage = consumeItems(nextStorage, material.itemId, material.count);
        }
        set({
          loot: loot - tech.loot,
          storage: nextStorage,
          nutrition: { ...nutrition, techs: [...nutrition.techs, tech.id] },
        });
      },

      // 发经验。★ 没有等级也没有升级 —— 经验只是进池子, 等玩家拿去锻造卡组。
      grantExp: (charIds, amount) => {
        const characters = { ...get().characters };
        const report: ExpGain[] = [];
        for (const id of charIds) {
          const cs = characters[id];
          if (!cs) continue;
          const exp = cs.exp + amount;
          characters[id] = { ...cs, exp, expEarned: cs.expEarned + amount };
          report.push({ charId: id, gained: amount, expAfter: exp });
        }
        set({ characters });
        return report;
      },

      grantExpEach: (byChar) => {
        const characters = { ...get().characters };
        const report: ExpGain[] = [];
        for (const [charId, amount] of Object.entries(byChar)) {
          const cs = characters[charId];
          if (!cs || amount <= 0) continue;
          const exp = cs.exp + amount;
          characters[charId] = { ...cs, exp, expEarned: cs.expEarned + amount };
          report.push({ charId, gained: amount, expAfter: exp });
        }
        if (report.length) set({ characters });
        return report;
      },

      contaminateCards: (charIds, count, each = false) => {
        const wanted = Math.max(0, Math.floor(count));
        if (!wanted || !charIds.length) return [];

        const characters = { ...get().characters };
        const hits: ContaminationHit[] = [];
        const targets = each ? charIds : ["__all__"];
        for (const target of targets) {
          const candidates: { charId: string; index: number }[] = [];
          for (const charId of each ? [target] : charIds) {
            const cs = characters[charId];
            if (!cs) continue;
            cs.deck.forEach((card, index) => {
              if (!card.contaminated) candidates.push({ charId, index });
            });
          }
          const amount = Math.min(wanted, candidates.length);
          for (let i = 0; i < amount; i++) {
            const pick = Math.floor(Math.random() * candidates.length);
            const candidate = candidates.splice(pick, 1)[0];
            const cs = characters[candidate.charId];
            const card = cs.deck[candidate.index];
            hits.push({
              charId: candidate.charId,
              charName: getCharacter(candidate.charId).name,
              cardName: card.name,
            });
            characters[candidate.charId] = {
              ...cs,
              deck: cs.deck.map((card, index) =>
                index === candidate.index ? { ...card, contaminated: true } : card,
              ),
            };
          }
        }

        if (hits.length) set({ characters });
        return hits;
      },

      cureQuirk: (charId, quirkId) => {
        const cs = get().characters[charId];
        if (!cs?.quirks.length) return null;
        const target = quirkId && cs.quirks.includes(quirkId) ? quirkId : cs.quirks[0];
        const next = { ...cs, quirks: cs.quirks.filter((id) => id !== target) };
        set({
          characters: {
            ...get().characters,
            [charId]: shiftVitals(cs, next),
          },
        });
        return target;
      },

      reducePollution: (charId, amount) => {
        const cs = get().characters[charId];
        const wanted = Math.max(0, Math.floor(amount));
        if (!cs || !wanted) return 0;
        const actual = Math.min(cs.pollution, wanted);
        if (!actual) return 0;
        set({
          characters: {
            ...get().characters,
            [charId]: { ...cs, pollution: cs.pollution - actual },
          },
        });
        return actual;
      },

      purifyCards: (charId, count, uids) => {
        const cs = get().characters[charId];
        let remaining = Math.max(0, Math.floor(count));
        if (!cs || !remaining) return 0;
        const wanted = uids?.length ? new Set(uids) : null;
        let purified = 0;
        const deck = cs.deck.map((card) => {
          if (
            remaining <= 0 ||
            !card.contaminated ||
            (wanted && !wanted.has(card.uid))
          ) {
            return card;
          }
          remaining -= 1;
          purified += 1;
          return { ...card, contaminated: false };
        });
        if (!purified) return 0;
        set({ characters: { ...get().characters, [charId]: { ...cs, deck } } });
        return purified;
      },

      syncBattleConditions: (conditions) => {
        const characters = { ...get().characters };
        let changed = false;
        for (const condition of conditions) {
          const cs = characters[condition.charId];
          if (!cs) continue;
          const quirks = quirkIdsOf(condition.quirks).slice(0, POLLUTION_RULES.maxQuirks);
          const pollution = Math.max(
            0,
            Math.min(POLLUTION_RULES.threshold - 1, Math.floor(condition.pollution)),
          );
          if (
            cs.pollution === pollution &&
            cs.sick === condition.sick &&
            cs.quirks.length === quirks.length &&
            cs.quirks.every((id, index) => id === quirks[index])
          ) {
            continue;
          }
          const next = { ...cs, pollution, sick: condition.sick, quirks };
          characters[condition.charId] = shiftVitals(cs, next);
          changed = true;
        }
        if (changed) set({ characters });
      },

      // 回城落档 —— 生命三段里的前两段在这里变成永久损伤。
      // ★ 保底 1: 阵亡角色回城记为 HP 1 / 体力极限 1(设计决策), 极度虚弱但仍可编队出击,
      //   不会因为城镇暂无治疗手段而永久报废。
      // ⚠ 夹取顺序是 hpLimit ≤ maxHp, 再 hp ≤ hpLimit —— 三段的不变式只在这一处维护。
      syncExpeditionStatus: (conditions) => {
        const characters = { ...get().characters };
        let changed = false;
        for (const condition of conditions) {
          const cs = characters[condition.charId];
          if (!cs) continue;
          const maxHp = Math.max(1, Math.round(deriveStats(cs).maxHp));
          const hpLimit = Math.max(1, Math.min(maxHp, Math.round(condition.hpLimit)));
          const hp = Math.max(1, Math.min(hpLimit, Math.round(condition.hp)));
          const pollution = Math.max(
            0,
            Math.min(POLLUTION_RULES.threshold - 1, Math.floor(condition.pollution)),
          );
          if (cs.hp === hp && cs.hpLimit === hpLimit && cs.pollution === pollution) continue;
          characters[condition.charId] = { ...cs, hp, hpLimit, pollution };
          changed = true;
        }
        if (changed) set({ characters });
      },

      // ---- 天数与商店 ----

      // 推进一日。★ 商店的主刷新机制就是这个 —— 唯一调用方是 runStore.backToTown
      //   (出击打完从结算页回据点)。从主菜单进据点不算一日, 故 enterTown 不调它。
      // ⚠「隔日重置」在这里一次做完: 换新货 + 刷新次数归零。UI 不再判日期。
      advanceDay: () => {
        const { day, shop, characters, nutrition } = get();
        const next = day + 1;
        const nextCharacters = { ...characters };
        for (const occupant of nutrition.occupants) {
          const cs = nextCharacters[occupant.charId];
          if (!cs) continue;
          const vitals = vitalsOf(cs);
          nextCharacters[occupant.charId] = {
            ...cs,
            hpLimit: Math.min(vitals.maxHp, vitals.hpLimit + occupant.heal),
          };
        }
        set({
          day: next,
          characters: nextCharacters,
          nutrition: { ...nutrition, occupants: [] },
          shop: { ...shop, day: next, refreshes: 0, slots: rollShopStock(shop.level) },
        });
      },

      // 花积分立刻重摇货架。价格随当日刷新次数线性上涨, 隔日由 advanceDay 归零。
      refreshShop: () => {
        const { shop, loot } = get();
        const cost = shopRefreshCost(shop.refreshes);
        if (loot < cost) return; // 护栏与 awaken 同写法: 买不起就什么都不发生
        set({
          loot: loot - cost,
          shop: { ...shop, refreshes: shop.refreshes + 1, slots: rollShopStock(shop.level) },
        });
      },

      // 买下一格货。★ 售出后该格保留占位并打上 sold —— 当日不补货, 想要新货得刷新或过一天。
      //   实例化推迟到这一刻(uid 此时才发), 羁绊词条沿用上架时摇好的那条。
      buyShopItem: (key) => {
        const { shop, loot, storage } = get();
        const slot = shop.slots.find((s) => s.key === key);
        if (!slot || slot.sold || loot < slot.price) return;

        const next = shop.slots.map((s) => (s.key === key ? { ...s, sold: true } : s));
        set({
          loot: loot - slot.price,
          // 仓库无上限, 与 deposit 同写法直接追加, 不必走 addToContainer。
          storage: [
            ...storage,
            makeItemStack(slot.itemId, 1, { affinity: slot.affinity, roll: slot.roll }),
          ],
          shop: { ...shop, slots: next },
        });
      },

      // ---- 卡组锻造 ----

      upgradeDeck: (charId) => {
        const cs = get().characters[charId];
        if (!cs) return;
        const cost = deckUpgradeCost(cs.deckLevel);
        if (cost == null || cs.exp < cost) return;
        set({
          characters: {
            ...get().characters,
            [charId]: { ...cs, exp: cs.exp - cost, deckLevel: cs.deckLevel + 1 },
          },
        });
      },

      forgeDraw: (charId) => {
        const cs = get().characters[charId];
        const { day } = get();
        if (!cs) return;
        const usage = todayUsage(cs, day);
        const cost = drawCostToday(usage.draw);
        if (cs.pendingDraw || cs.exp < cost) return;

        const options = rollDrawOptions(cs);
        if (!options) return;
        set({
          characters: {
            ...get().characters,
            [charId]: {
              ...cs,
              exp: cs.exp - cost,
              pendingDraw: options,
              forgeDay: day,
              drawUsedToday: usage.draw + 1,
              removeUsedToday: usage.remove,
            },
          },
        });
      },

      cancelDraw: (charId) => {
        const cs = get().characters[charId];
        if (!cs?.pendingDraw) return;
        set({
          characters: { ...get().characters, [charId]: { ...cs, pendingDraw: null } },
        });
      },

      grantFreeDraw: (charId) => {
        const cs = get().characters[charId];
        if (!cs || cs.pendingDraw) return;
        const options = rollDrawOptions(cs);
        if (!options) return;
        set({
          characters: {
            ...get().characters,
            [charId]: { ...cs, pendingDraw: options },
          },
        });
      },

      pickDraw: (charId, cardDefId) => {
        const cs = get().characters[charId];
        if (!cs?.pendingDraw?.includes(cardDefId)) return;
        // 再校验一次限携 —— 候选是抽卡那一刻算的, 期间卡组可能已经变了。
        const next = { ...cs, deck: [...cs.deck] };
        if (!addCardToDeck(next, cardDefId)) {
          set({ characters: { ...get().characters, [charId]: { ...cs, pendingDraw: null } } });
          return;
        }
        set({
          characters: {
            ...get().characters,
            [charId]: { ...next, pendingDraw: null },
          },
        });
      },

      rollPartyDrawOffers: (charIds) => charIds.flatMap((charId) => {
        const cs = get().characters[charId];
        const cardDefId = cs ? rollPartyDrawOption(cs) : null;
        return cardDefId ? [{ charId, cardDefId }] : [];
      }),

      pickPartyDraw: (charId, cardDefId) => {
        const cs = get().characters[charId];
        if (!cs || !cardBelongsToCharacter(cs, cardDefId)) return false;
        const next = { ...cs, deck: [...cs.deck] };
        if (!addCardToDeck(next, cardDefId)) return false;
        set({ characters: { ...get().characters, [charId]: next } });
        return true;
      },

      removeCard: (charId, uid) => {
        const cs = get().characters[charId];
        const { day } = get();
        if (!cs) return;
        const usage = todayUsage(cs, day);
        const cost = removeCostToday(usage.remove);
        if (cs.exp < cost) return;
        if (cs.deck.length <= cs.minDeckSize) return; // 卡组不能低于最小下限
        if (!cs.deck.some((c) => c.uid === uid)) return;
        set({
          characters: {
            ...get().characters,
            [charId]: {
              ...cs,
              exp: cs.exp - cost,
              forgeDay: day,
              drawUsedToday: usage.draw,
              removeUsedToday: usage.remove + 1,
              deck: cs.deck.filter((c) => c.uid !== uid),
            },
          },
        });
      },

      removeCardFree: (charId, uid) => {
        const cs = get().characters[charId];
        if (!cs || cs.deck.length <= cs.minDeckSize) return;
        if (!cs.deck.some((c) => c.uid === uid)) return;
        set({
          characters: {
            ...get().characters,
            [charId]: { ...cs, deck: cs.deck.filter((c) => c.uid !== uid) },
          },
        });
      },

      reforgeEquipped: (charId, slot, bias) => {
        const cs = get().characters[charId];
        const equipped = cs?.equipped?.[slot];
        const pool = bondPool(bias);
        if (!cs || !equipped || !pool.length) return;
        const affinity = pool[Math.floor(Math.random() * pool.length)];
        set({
          characters: {
            ...get().characters,
            [charId]: {
              ...cs,
              equipped: {
                ...cs.equipped,
                [slot]: { ...equipped, affinity },
              },
            },
          },
        });
      },

      // 降低最小卡组下限。★ 只开放后续删卡空间, 不会直接删掉任何卡。
      lowerMinDeck: (charId) => {
        const cs = get().characters[charId];
        if (!cs) return;
        const cost = lowerMinSizeCost(cs.minDeckSize);
        if (cost == null || cs.exp < cost) return;
        set({
          characters: {
            ...get().characters,
            [charId]: { ...cs, exp: cs.exp - cost, minDeckSize: cs.minDeckSize - 1 },
          },
        });
      },
    }),
    // ⚠ v16: 新增博物馆图鉴累计名单, 旧档不兼容, 换 key 让旧档自然失效重建。
    // ⚠ v15: 新增营养舱科技与疗养名单, 旧档不兼容, 换 key 让旧档自然失效重建。
    // ⚠ v14: 新增 clearedMaps, 旧档不兼容, 换 key 让旧档自然失效重建。
    // ⚠ v13: 商店货架合并为 slots, 旧档不兼容, 换 key 让旧档自然失效重建。
    // ⚠ v12: CharacterState 新增 hpLimit —— 远征打掉的体力极限现在跨日持久化。
    //   旧档没有这个字段, 换 key 让旧档自然失效重建。
    // ⚠ v10: 训练室改成天赋树 —— squadTalent.nodes 由 Record<string, number>(方向级数)
    //   改为 string[](已激活节点 id)。旧存档不兼容, 换 key 让旧档自然失效重建。
    // v9: 新增每日锻造用量与待选卡放弃 action。旧存档不兼容, 换 key 让旧档自然失效重建。
    // v6 新增的天数 day 与商店货架 shop 也由新档完整初始化。
    //   ⇒ 据点状态条显示「第 NaN 日」、商店货架空着且刷新价算不出来。项目不做旧存档兼容,
    //   换 key 让旧档自然失效重建。
    //   (v5 引入的是装备实例的随机羁绊词条 ItemStack.affinity;
    //    v4 引入的是物资中转仓 storage 与三装备槽 CharacterState.equipped。)
    { name: "town-profile-v16", version: 16 },
  ),
);
