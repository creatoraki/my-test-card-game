// 数据注册表 —— 所有内容按 id 索引; 引擎/store 通过这些 getter 取数据。

import type { Card, CardDef } from "../engine/types";
import { RULES } from "../engine/rules";
import { CARD_DEFS } from "./cards";
import { CHARACTERS, type CharacterDef } from "./characters";
import { ENEMIES, type EnemyDef } from "./enemies";
import { ENCOUNTERS, type EncounterDef } from "./encounters";
import { MAPS, type MapDef } from "./maps";

export { CARD_DEFS } from "./cards";
export {
  EVENT_POOLS,
  ALL_ROUTE_EVENTS,
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

// ---------------------------------------------------------------------------
// 卡牌实例化 / 升级
// ---------------------------------------------------------------------------
// 卡实例会随城镇档案持久化到 localStorage, 刷新后继续发号 ——
// 不能用会归零的内存计数器, 否则新卡 uid 会撞上存档里的旧卡。
function newUid(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? `c-${crypto.randomUUID()}`
    : `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
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

const UPGRADE_AMOUNT_TYPES = new Set(["DAMAGE", "HEAL", "GAIN_BLOCK"]);

export function upgradeCard(card: Card): void {
  if (card.upgraded) return;
  card.upgraded = true;
  if (!card.name.endsWith("+")) card.name += "+";
  card.effects = card.effects.map((e) =>
    e.amount != null && UPGRADE_AMOUNT_TYPES.has(e.type)
      ? { ...e, amount: Math.ceil(e.amount * RULES.upgrade.amountMultiplier) }
      : e,
  );
  card.text += "（已强化）";
}
