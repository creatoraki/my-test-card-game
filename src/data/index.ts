// 数据注册表 —— 所有内容按 id 索引; 引擎/store 通过这些 getter 取数据。

import type { Card, CardDef } from "../engine/types";
import { rngInt } from "../engine/rng";
import { RULES } from "../engine/rules";
import { rollAffinity } from "../items/drops";
import { rollEquipment } from "../items/equipRoll";
import type { EquipSlot, ItemDef, ItemStack } from "../items/types";
import { RARITY_ORDER } from "../items/types";
import { CARD_DEFS } from "./cards";
import { ITEM_DEFS as LEGACY_ITEM_DEFS } from "./items";
import { DESIGN_ITEM_DEFS, EQUIPMENT_ITEM_DEFS } from "./items/index";
import { CHARACTERS, type CharacterDef } from "./characters";
import { ENEMIES, type EnemyDef } from "./enemies";
import { ENCOUNTERS, type EncounterDef } from "./encounters";
import { MAPS, type MapDef } from "./maps";
import { NPC_EVENTS, getNpcEvent, type NpcEvent } from "./npcEvents";
import { ROLLABLE_BOND_IDS } from "./bonds";
export {
  SQUAD_BADGES,
  branchNodesOf,
  canActivate,
  canRefund,
  costToReach,
  getBadge,
  getNode,
  isUnlocked,
  pathTo,
  spentPoints,
  squadModsOf,
  type SquadBadgeDef,
  type SquadResourceKey,
  type SquadResourceMods,
  type TalentBranchDef,
  type TalentNodeDef,
} from "./squadTalents";

export { CARD_DEFS } from "./cards";
export {
  EVENT_POOLS,
  ALL_NODE_EVENTS,
  getEventPool,
  type EventPool,
} from "./exploreEvents";
export { TUTORIAL_EVENT_POOL } from "./tutorialEvents";
export { CHARACTERS, type CharacterDef } from "./characters";
export {
  BOND_DEFS,
  BOND_BIAS,
  ROLLABLE_BOND_IDS,
  activeBonds,
  bondPool,
  getBondDef,
  mergeMods,
  nextTier,
  type BondDef,
  type BondTier,
} from "./bonds";
export { NPC_EVENTS, getNpcEvent, type NpcEvent } from "./npcEvents";
export { ENEMIES, type EnemyDef, type EnemyMove } from "./enemies";
export {
  ENCOUNTERS,
  slotDefId,
  slotPlacement,
  type EncounterDef,
  type EnemyPlacement,
  type EnemySlot,
} from "./encounters";
export {
  MAPS,
  visibleMaps,
  isMapUnlocked,
  mapEquipRarities,
  mapLockReason,
  type MapDef,
} from "./maps";
export { ITEM_DEFS as LEGACY_ITEM_DEFS } from "./items";
export {
  CONSUMABLE_ITEM_DEFS,
  DESIGN_ITEM_DEFS,
  EQUIPMENT_ITEM_DEFS,
  GENERIC_MODULE_FAMILY,
  GENERIC_MODULE_ITEM_DEFS,
  MATERIAL_ITEM_DEFS,
  MODULE_CRATE_ITEM_DEFS,
  MODULE_ITEM_DEFS,
} from "./items/index";
export {
  CARD_MODULES,
  GENERIC_T1_MODULE_IDS,
  canEquipModule,
  getCardModule,
  hasDamageEffect,
  hasScaledDamage,
  hasScaledSupport,
  recomputeCardModule,
  type CardModuleDef,
} from "./cardModules";
export {
  MODULE_RECIPES,
  craftCheck,
  getModuleRecipe,
  materialCount,
  recipesOfCharacter,
  type CraftCheck,
  type ModuleRecipe,
} from "./moduleCrafting";
export { SORTIE_STOCK_IDS } from "./sortieStock";
export { TRADE_SERVICES, TRADE_BUFF_OPTIONS, getTradeService, type TradeServiceDef } from "./tradeServices";
export { tradeStockDefs, type TradeStockKind } from "./tradeStock";

export const ITEM_DEFS: ItemDef[] = [...LEGACY_ITEM_DEFS, ...DESIGN_ITEM_DEFS];

export function equipmentDefsBySlot(slot?: EquipSlot): ItemDef[] {
  return EQUIPMENT_ITEM_DEFS.filter((def) => !slot || def.slot === slot);
}

function keyBy<T extends { id: string }>(arr: T[]): Record<string, T> {
  const out: Record<string, T> = {};
  for (const item of arr) out[item.id] = item;
  return out;
}

const CARD_INDEX = keyBy(CARD_DEFS);
const CHAR_INDEX = keyBy(CHARACTERS);
const ENEMY_INDEX = keyBy(ENEMIES);
const ENCOUNTER_INDEX = keyBy(ENCOUNTERS);
const MAP_INDEX = keyBy(MAPS);
const ITEM_INDEX = keyBy(ITEM_DEFS);

// 家族索引: familyId → 该族全部 def, 组内按稀有度由低到高排好。
// 掉落时 qualityBias 就在这个数组上右移权重(见 items/drops.pickByQuality)。
const FAMILY_INDEX: Record<string, ItemDef[]> = (() => {
  const out: Record<string, ItemDef[]> = {};
  for (const def of ITEM_DEFS) {
    if (!def.familyId) continue;
    (out[def.familyId] ??= []).push(def);
  }
  for (const list of Object.values(out)) {
    list.sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity));
  }
  return out;
})();

export function getCardDef(id: string): CardDef {
  const def = CARD_INDEX[id];
  if (!def) throw new Error(`未知卡牌: ${id}`);
  return def;
}
export function getCharacter(id: string): CharacterDef {
  const def = CHAR_INDEX[id];
  if (!def) throw new Error(`未知角色: ${id}`);
  return def;
}
export function getEnemyDef(id: string): EnemyDef {
  const def = ENEMY_INDEX[id];
  if (!def) throw new Error(`未知敌人: ${id}`);
  return def;
}
export function getEncounter(id: string): EncounterDef {
  const def = ENCOUNTER_INDEX[id];
  if (!def) throw new Error(`未知遭遇战: ${id}`);
  return def;
}
export function getMap(id: string): MapDef {
  const def = MAP_INDEX[id];
  if (!def) throw new Error(`未知地图: ${id}`);
  return def;
}
export function getItemDef(id: string): ItemDef {
  const def = ITEM_INDEX[id];
  if (!def) throw new Error(`未知物品: ${id}`);
  return def;
}
export function getItemFamily(familyId: string): ItemDef[] {
  const list = FAMILY_INDEX[familyId];
  if (!list?.length) throw new Error(`未知物品家族: ${familyId}`);
  return list;
}

// ---------------------------------------------------------------------------
// 卡牌实例化 / 升级
// ---------------------------------------------------------------------------
// 卡实例会随城镇档案持久化到 localStorage, 刷新后继续发号 ——
// 不能用会归零的内存计数器, 否则新卡 uid 会撞上存档里的旧卡。
// 物品实例(仓库)同理, 故两者共用这个发号器, 只换前缀。
export function newUid(prefix = "c"): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// 物品实例化。⚠ uid 会随仓库进 localStorage, 所以同样走 newUid 而不是内存计数器。
export function makeItemStack(
  itemId: string,
  count = 1,
  extra: { affinity?: string; roll?: ItemStack["roll"] } = {},
): ItemStack {
  getItemDef(itemId); // 存在性校验: 打错 id 要在这里炸, 而不是等 UI 渲染时才发现
  return {
    uid: newUid("i"),
    itemId,
    count: Math.max(1, count),
    affinity: extra.affinity,
    roll: extra.roll,
  };
}

// 实例化一件物品并按规则掷羁绊词条。非 affinityRollable 的物品不消耗 RNG。
export function makeRolledItemStack(
  rng: { rngState: number },
  itemId: string,
  count = 1,
): ItemStack {
  const def = getItemDef(itemId);
  return makeItemStack(itemId, count, {
    affinity: rollAffinity(def, ROLLABLE_BOND_IDS, (n) => rngInt(rng, n)),
    roll: rollEquipment(def, (n) => rngInt(rng, n)),
  });
}

export function makeCard(defId: string, upgraded = false): Card {
  const def = getCardDef(defId);
  const card: Card = {
    ...def,
    effects: def.effects.map((e) => ({ ...e })), // 深拷贝效果, 便于单卡升级
    uid: newUid(),
    upgraded: false,
    contaminated: false,
  };
  if (upgraded) upgradeCard(card);
  return card;
}

const UPGRADE_AMOUNT_TYPES = new Set(["DAMAGE", "HEAL", "GAIN_SHIELD"]);

export function upgradeCard(card: Card): void {
  if (card.upgraded) return;
  card.upgraded = true;
  if (!card.name.endsWith("+")) card.name += "+";
  card.effects = card.effects.map((e) => {
    if (!UPGRADE_AMOUNT_TYPES.has(e.type)) return e;
    // 倍率伤害升级倍率, 固定值效果升级 amount —— 两者只会有一个存在(见 EffectDescriptor)。
    if (e.multiplier != null)
      return { ...e, multiplier: Number((e.multiplier * RULES.upgrade.amountMultiplier).toFixed(2)) };
    if (e.amount != null)
      return { ...e, amount: Math.ceil(e.amount * RULES.upgrade.amountMultiplier) };
    return e;
  });
  card.text += "（已强化）";
}
