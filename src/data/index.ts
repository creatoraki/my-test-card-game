// 数据注册表 —— 所有内容按 id 索引; 引擎/store 通过这些 getter 取数据。

import type { Card, CardDef } from "../engine/types";
import { RULES } from "../engine/rules";
import type { SlotSymbol } from "../explore/types";
import type { ItemDef, ItemStack } from "../items/types";
import { RARITY_ORDER } from "../items/types";
import { CARD_DEFS } from "./cards";
import { ITEM_DEFS as LEGACY_ITEM_DEFS } from "./items";
import { DESIGN_ITEM_DEFS } from "./items/index";
import { CHARACTERS, type CharacterDef } from "./characters";
import { ENEMIES, type EnemyDef } from "./enemies";
import { ENCOUNTERS, type EncounterDef } from "./encounters";
import { MAPS, type MapDef } from "./maps";
import { SLOT_SYMBOLS } from "./slotSymbols";

export { CARD_DEFS } from "./cards";
export {
  EVENT_POOLS,
  ALL_NODE_EVENTS,
  getEventPool,
  type EventPool,
} from "./exploreEvents";
export { CHARACTERS, type CharacterDef } from "./characters";
export { ENEMIES, type EnemyDef, type EnemyMove } from "./enemies";
export {
  ENCOUNTERS,
  slotDefId,
  slotPlacement,
  type EncounterDef,
  type EnemyPlacement,
  type EnemySlot,
} from "./encounters";
export { MAPS, type MapDef } from "./maps";
export { SLOT_SYMBOLS, NEON_NORMAL_REEL, NEON_BOSS_REEL } from "./slotSymbols";
export { ITEM_DEFS as LEGACY_ITEM_DEFS } from "./items";
export {
  CONSUMABLE_ITEM_DEFS,
  DESIGN_ITEM_DEFS,
  EQUIPMENT_ITEM_DEFS,
  MATERIAL_ITEM_DEFS,
} from "./items/index";

export const ITEM_DEFS: ItemDef[] = [...LEGACY_ITEM_DEFS, ...DESIGN_ITEM_DEFS];

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
const SLOT_SYMBOL_INDEX = keyBy(SLOT_SYMBOLS);

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
export function getSlotSymbol(id: string): SlotSymbol {
  const def = SLOT_SYMBOL_INDEX[id];
  if (!def) throw new Error(`未知战斗签符号: ${id}`);
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
function newUid(prefix = "c"): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// 物品实例化。⚠ uid 会随仓库进 localStorage, 所以同样走 newUid 而不是内存计数器。
export function makeItemStack(itemId: string, count = 1, affinity?: string): ItemStack {
  getItemDef(itemId); // 存在性校验: 打错 id 要在这里炸, 而不是等 UI 渲染时才发现
  return { uid: newUid("i"), itemId, count: Math.max(1, count), affinity };
}

export function makeCard(defId: string, upgraded = false): Card {
  const def = getCardDef(defId);
  const card: Card = {
    ...def,
    effects: def.effects.map((e) => ({ ...e })), // 深拷贝效果, 便于单卡升级
    uid: newUid(),
    upgraded: false,
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
