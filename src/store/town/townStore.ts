// Zustand store: 城镇档案 —— 跨远征持久的玩家资产(个人卡组 / 编队 / 经验 / 居民积分)。
// 与 runStore 的分工: 这里存"永久拥有的东西", runStore 只存"这趟远征的进度"。
// 依赖方向: runStore → townStore(单向); 本 store 不认识 runStore。
// 已接 persist 中间件(localStorage), 刷新页面进度保留;「重置存档」清回初始档。
//
// ★ 角色**不设等级、不加属性点**(《角色养成设计.md》第一章)。
//   角色面板固定, 经验的唯一去处是锻造个人卡组: 升卡组等级 / 抽卡 / 删卡 / 降低最小卡组下限。
//
// 状态形状见 townTypes.ts, 出厂档案见 townProfile.ts; action 按领域拆在各个 *Slice.ts 里,
// 本文件只负责拼装、建档 / 重置与「推进一日」这类横跨多个领域的操作。

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { makeItemStack } from "@/data";
import { TOWN_PROFILE_KEY, commitTownBackup, restoreTownBackup } from "../run/expeditionBackup";
import { vitalsOf } from "./characterStats";
import { createConditionSlice } from "../townSlices/conditionSlice";
import { createCurioTownSlice } from "../townSlices/curioTownSlice";
import { createDeckForgeSlice } from "../townSlices/deckForgeSlice";
import { createEquipCraftSlice } from "../townSlices/equipCraftSlice";
import { createMapProgressSlice, freshMapProgress } from "../townSlices/mapProgressSlice";
import { createMemberCareSlice } from "../townSlices/memberCareSlice";
import { createShopSlice, freshShop } from "../townSlices/shopSlice";
import { rollShopStock } from "./shopStock";
import { createSquadTalentSlice } from "../townSlices/squadTalentSlice";
import { createStorageSlice } from "../townSlices/storageSlice";
import { createTechTreeSlice } from "../townSlices/techTreeSlice";
import { freshProfile, freshStorage, purifiedRelicId } from "./townProfile";
import type { CodexState, SanctuaryState, TownStore } from "./townTypes";

export {
  EQUIP_SLOTS,
  bondCountsOf,
  deriveStats,
  equipModsOf,
  vitalsOf,
} from "./characterStats";
export type { EquipmentMods } from "./characterStats";
export {
  addCardToDeck,
  availablePools,
  canAddCopy,
  canAddRarity,
  countByDefId,
  countByRarity,
  rollRarity,
} from "./deckCards";
export type * from "./townTypes";
export { TRAINING_POINT_CONTRIBUTORS, squadTrainingPoints, techLevels } from "./townProfile";
export { deckForgeCosts } from "../townSlices/deckForgeSlice";

// 必须在 create(persist(...)) 之前回滚, 让 persist 同步 rehydrate 直接读到出击前档案。
restoreTownBackup();

// 建档与重置共用的「新一局」状态。includeInitialExp / loot 两处不同, 由调用方覆盖。
function freshTownState(includeInitialExp: boolean) {
  const profile = freshProfile(includeInitialExp);
  return {
    ...profile,
    ...freshMapProgress(1),
    storage: freshStorage(),
    day: 1,
    shop: freshShop(1, profile.characters, profile.awakened),
    nutrition: { techs: [], occupants: [] },
    sanctuary: { purifying: [] },
    techTree: { levels: {} },
    pendingReforge: null,
    initialized: true,
  } satisfies Partial<TownStore>;
}

export const useTownStore = create<TownStore>()(
  persist(
    (set, get) => ({
      characters: {},
      awakened: [],
      fallen: [],
      clearedMaps: [],
      ...freshMapProgress(1),
      party: [],
      loot: 10000,
      storage: [],
      lastSortieRelicIds: [],
      day: 1,
      shop: freshShop(1, {}, []),
      nutrition: { techs: [], occupants: [] },
      sanctuary: { purifying: [] },
      techTree: { levels: {} },
      squadTalent: { badgeId: null, nodes: [] },
      codex: { items: [], cards: [], enemies: [] },
      seenGuides: [],
      ...createEquipCraftSlice(set, get),
      ...createMapProgressSlice(set, get),
      ...createShopSlice(set, get),
      ...createTechTreeSlice(set, get),
      ...createCurioTownSlice(set, get),
      ...createDeckForgeSlice(set, get),
      ...createStorageSlice(set, get),
      ...createMemberCareSlice(set, get),
      ...createConditionSlice(set, get),
      ...createSquadTalentSlice(set, get),
      initialized: false,

      ensureProfile: () => {
        if (get().initialized) return;
        set({ ...freshTownState(true), loot: 10000 });
      },

      resetProfile: () => {
        set({ ...freshTownState(false), loot: 0, lastSortieRelicIds: [] });
        commitTownBackup();
      },

      markMapCleared: (mapId) => {
        const { clearedMaps } = get();
        if (clearedMaps.includes(mapId)) return;
        set({ clearedMaps: [...clearedMaps, mapId] });
      },

      markGuideSeen: (id) => {
        const { seenGuides } = get();
        if (seenGuides.includes(id)) return;
        set({ seenGuides: [...seenGuides, id] });
      },

      recordSortieRelics: (ids) => {
        // 6 与 sortieStore.SORTIE_RELIC_LIMIT 同源；反向依赖会成环，因此这里保留数值。
        set({ lastSortieRelicIds: [...new Set(ids)].slice(0, 6) });
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

      // 推进一日。★ 商店的主刷新机制就是这个 —— 唯一调用方是 runStore.backToTown
      //   (出击打完从结算页回据点)。从主菜单进据点不算一日, 故 enterTown 不调它。
      // ⚠「隔日重置」在这里一次做完: 疗养结算 + 圣水池倒计时 + 换新货 + 刷新次数归零。UI 不再判日期。
      advanceDay: () => {
        const { day, shop, characters, awakened, nutrition, sanctuary, storage, loot } = get();
        const next = day + 1;
        const nextCharacters = { ...characters };
        // 疗养同步恢复等额 HP；体力极限已满时，额度转为治疗 HP。
        for (const occupant of nutrition.occupants) {
          const cs = nextCharacters[occupant.charId];
          if (!cs) continue;
          const vitals = vitalsOf(cs);
          const hpLimit = Math.min(vitals.maxHp, vitals.hpLimit + occupant.heal);
          nextCharacters[occupant.charId] = {
            ...cs,
            hpLimit,
            hp: Math.min(hpLimit, vitals.hp + occupant.heal),
          };
        }
        let nextStorage = storage;
        let nextLoot = loot;
        const purifying: SanctuaryState["purifying"] = [];
        for (const entry of sanctuary.purifying) {
          const daysLeft = entry.daysLeft - 1;
          if (daysLeft > 0) {
            purifying.push({ ...entry, daysLeft });
            continue;
          }
          const resultId = purifiedRelicId(entry.relicId, nextStorage);
          if (resultId) nextStorage = [...nextStorage, makeItemStack(resultId)];
          else nextLoot += 20;
        }
        set({
          day: next,
          characters: nextCharacters,
          nutrition: { ...nutrition, occupants: [] },
          storage: nextStorage,
          loot: nextLoot,
          sanctuary: { purifying },
          shop: {
            ...shop,
            day: next,
            refreshes: 0,
            slots: rollShopStock(nextCharacters, awakened, shop.techs, shop.level),
          },
          dailyClear: freshMapProgress(next).dailyClear,
        });
      },
    }),
    // ⚠ v30: 徽章 id 全部更换, 旧档的 squadTalent.badgeId 不再有效, 换 key 让旧档自然失效重建。
    // ⚠ v29: 新增教学关固定通关奖励键与通关奖励装备完美度加成, 旧档不兼容, 换 key 让旧档自然失效重建。
    // ⚠ v28: 新增地图难度进度与每日通关奖励。
    // ⚠ v27: 卡牌/装备/材料/祝福遗物统一为一套商店货架, 旧档不兼容, 换 key 让旧档自然失效重建。
    // ⚠ v26: 遗物清单与初始仓库调整, 旧档中的 relic-even-draw 已下线, 换 key 让旧档自然失效重建。
    // ⚠ v25: 新增遗物与圣水池, 旧档不兼容, 换 key 让旧档自然失效重建。
    // ⚠ v24: 新增科技树等级, 旧档不兼容, 换 key 让旧档自然失效重建。
    // ⚠ v22: 新增 fallen 永久阵亡名单与复苏舱, 旧档不兼容, 换 key 让旧档自然失效重建。
    // ⚠ v21: 新增商店扩展货架、科技与购买 action, 旧档不兼容, 换 key 让旧档自然失效重建。
    // ⚠ v20: 重铸台改为重掷羁绊, pendingReforge 由 roll 改为 affinity, 旧档不兼容, 换 key 让旧档自然失效重建。
    // ⚠ v19: 新增 seenGuides 新手引导记录, 旧档不兼容, 换 key 让旧档自然失效重建。
    // ⚠ v18: 新增装备升阶、词条重铸与待确认重铸状态, 旧档不兼容, 换 key 让旧档自然失效重建。
    // ⚠ v17: 装备模型预算调整, 旧档中的商店与仓库装备 roll 不再可信, 换 key 让旧档自然失效重建。
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
    { name: TOWN_PROFILE_KEY, version: 30 },
  ),
);
