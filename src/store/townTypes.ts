// 城镇档案的状态形状 —— townStore 与各切片共用。只放类型, 不含逻辑。

import type { Card, QuirkId } from "../engine";
import type { TechTreeState } from "../data";
import type { EquipSlot, ItemStack } from "../items/types";
import type { BondBias } from "../explore/types";
import type { CurioTownSlice } from "./curioTownSlice";
import type { MapProgressSlice } from "./mapProgressSlice";
import type { ShopState } from "./shopSlice";

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

export interface NutritionState {
  techs: string[];
  occupants: { charId: string; heal: number; day: number; slot: number }[];
}

export interface SanctuaryState {
  purifying: { relicId: string; daysLeft: number }[];
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

export interface TownStore extends CurioTownSlice {
  characters: Record<string, CharacterState>;
  // ★ 在编队员名单, 按加入先后。阵亡角色会从这里移出。
  // ⚠ characters 仍是**全量**建档(见 freshProfile) —— 「有没有解锁」只看这里, 各处取
  //   characters[id] 才不必判空。上阵资格 = 在这张名单上。
  awakened: string[];
  fallen: string[]; // 永久阵亡的角色 id, 按阵亡先后。与 awakened 互斥
  clearedMaps: string[]; // 已通关的地图 id
  clearedDifficulties: string[]; // 已通关的地图难度 key
  dailyClear: { day: number; rewards: Record<string, ItemStack[]> };
  party: string[]; // 上阵角色 id, 1 ≤ length ≤ RULES.progression.partySize, 且必须 ⊆ awakened
  loot: number; // 居民积分余额 —— 主要来自废料出售; 团灭时本趟的产出全丢
  // ★ 物资中转仓: **不设上限**(与背包的 24 格形成对照)。远征活着回来才有东西进来。
  storage: ItemStack[];
  lastSortieRelicIds: string[]; // 上一次回归时背包里携带的遗物 itemId, 最多 6 个
  day: number; // 生存天数, 从第 1 日起。★ 只由 advanceDay() 推进(出击后返回据点算一日)
  // 货架是**存档的一部分**: 关掉页面再回来, 今天挑剩下的还是今天那批货。
  // 「隔日重置」的唯一真相点是 advanceDay() —— UI 不再判一次日期。
  shop: ShopState;
  nutrition: NutritionState;
  sanctuary: SanctuaryState;
  techTree: TechTreeState;
  squadTalent: SquadTalentState;
  codex: CodexState;
  seenGuides: string[]; // 已看过的新手引导 id, 随存档永久记录
  initialized: boolean;

  ensureProfile: () => void; // 幂等: 首次进城镇时建档
  markMapCleared: (mapId: string) => void; // 记录通关地图, 已记录则保持不变
  markDifficultyCleared: MapProgressSlice["markDifficultyCleared"];
  syncDailyClear: MapProgressSlice["syncDailyClear"];
  takeDailyClearReward: MapProgressSlice["takeDailyClearReward"];
  markGuideSeen: (id: string) => void;
  recordCodex: (patch: Partial<CodexState>) => void;
  recordSortieRelics: (ids: string[]) => void;
  bankLoot: (amount: number) => void; // 远征结束落袋
  deposit: (stacks: ItemStack[]) => void; // 远征结束: 背包 + 已寄回的整批入仓
  depositHaul: (stacks: ItemStack[], relicBonus?: number) => number; // 远征收尾: 换金物折积分, 其余入仓; 返回售出总额
  discardStored: (uid: string) => void; // 仓库里丢弃(二次确认在 UI)
  withdraw: (uid: string) => ItemStack | null; // 出击准备: 把一整堆从仓库取出交给调用方
  sellItem: (uid: string) => void; // 回收台: 按统一售价函数出售换居民积分
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
  markFallen: (charIds: string[]) => void; // 回城落袋: 移出在编队员并记入永久阵亡名单
  reviveFallen: (charId: string) => void; // 复苏舱: 花 reviveCost 居民积分重置一名阵亡队员
  admitToNutritionPods: (assignments: { charId: string; slot: number }[]) => void; // 营养舱: 批量确认、扣积分并记录席位
  researchNutritionTech: (techId: string) => void; // 营养舱: 研究舱位或治疗量科技
  purifyRelic: (relicId: string) => boolean; // 圣水池: 投入一件诅咒遗物
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
  refreshShop: import("./shopSlice").ShopSlice["refreshShop"];
  buyShopSlot: import("./shopSlice").ShopSlice["buyShopSlot"];
  upgradeShop: import("./shopSlice").ShopSlice["upgradeShop"];
  researchTech: import("./techTreeSlice").TechTreeSlice["researchTech"];

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
  pendingReforge: import("./equipCraftSlice").PendingReforge | null;
  upgradeEquip: import("./equipCraftSlice").EquipCraftSlice["upgradeEquip"];
  rollReforge: import("./equipCraftSlice").EquipCraftSlice["rollReforge"];
  applyReforge: import("./equipCraftSlice").EquipCraftSlice["applyReforge"];
}

// 切片工厂共用的 set / get 签名。
export type TownSet = (partial: Partial<TownStore> | ((state: TownStore) => Partial<TownStore>)) => void;
export type TownGet = () => TownStore;
