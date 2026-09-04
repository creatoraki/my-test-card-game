import type { BoonEntry } from "../../explore/types";
import type { DropEntry } from "../../items/types";
import type { EnemyDef } from "./types";

const ELITE_BASE: DropEntry[] = [
  { kind: "item", itemId: "blue-crystal", chance: 0.6 },
  { kind: "item", itemId: "bronze-bear", chance: 0.4 },
  { kind: "item", itemId: "module-crate-t1", chance: 0.08 },
];

const generalDrop = (itemId: string, chance: number): DropEntry => ({
  kind: "item",
  itemId,
  chance,
});

const ELITE_BOONS: BoonEntry[] = [
  { kind: "healDew", chance: 0.5 },
  { kind: "equipCrate", chance: 0.3 },
  { kind: "moduleCrate", chance: 0.15 },
  { kind: "cardOffer", chance: 0.3 },
];

export const ELITE_ENEMIES: EnemyDef[] = [
  {
    id: "scrap-bot",
    name: "废品机器人",
    emoji: "🤖",
    maxHp: 95,
    exp: 30,
    stats: { attack: 85, defense: 4, dodgeRate: 0, initiative: 20, critDamage: 150 },
    moves: [
      {
        id: "scrap-crush",
        name: "压板重砸",
        emoji: "🔨",
        delay: 4,
        kind: "attack",
        targeting: "foe",
        weight: 2,
        anim: "slash",
        effects: [{ type: "DAMAGE", multiplier: 1.25, target: "primary" }],
      },
      {
        id: "scrap-spray",
        name: "废料喷流",
        emoji: "💥",
        delay: 6,
        kind: "attack",
        targeting: "foe",
        weight: 1,
        anim: "shot",
        effects: [{ type: "DAMAGE", multiplier: 0.5, target: "allFoes" }],
      },
      {
        id: "scrap-compress",
        name: "压缩封罐",
        emoji: "🧱",
        delay: 5,
        kind: "debuff",
        targeting: "foe",
        weight: 1,
        anim: "buff",
        effects: [
          { type: "DAMAGE", multiplier: 0.3, target: "primary" },
          { type: "MARK_CARDS", mark: "heavy", markPick: "handRandom", amount: 1 },
        ],
      },
      {
        id: "scrap-plating",
        name: "碎料护甲",
        emoji: "🛡️",
        delay: 7,
        kind: "block",
        targeting: "self",
        weight: 1,
        anim: "shield",
        effects: [{ type: "GAIN_SHIELD", amount: 12, target: "self" }],
      },
    ],
    dropTable: [...ELITE_BASE, generalDrop("coil-spring", 0.15)],
    boonTable: ELITE_BOONS,
  },
  {
    id: "pole-bot",
    name: "电线杆机器人",
    emoji: "🤖",
    maxHp: 100,
    exp: 32,
    stats: { attack: 90, defense: 4, dodgeRate: 0, initiative: 20, critDamage: 150 },
    moves: [
      {
        id: "pole-smash",
        name: "高压重击",
        emoji: "⚔️",
        delay: 4,
        kind: "attack",
        targeting: "foe",
        weight: 2,
        anim: "slash",
        effects: [{ type: "DAMAGE", multiplier: 1.3, target: "primary" }],
      },
      {
        id: "pole-arc",
        name: "电弧急放",
        emoji: "⚡",
        delay: 6,
        kind: "attack",
        targeting: "foe",
        weight: 1,
        anim: "lightning",
        effects: [{ type: "DAMAGE", multiplier: 0.6, target: "allFoes" }],
      },
      {
        id: "pole-paralyze",
        name: "麻痹电流",
        emoji: "💫",
        delay: 5,
        kind: "debuff",
        targeting: "foe",
        weight: 1,
        anim: "lightning",
        effects: [
          { type: "DAMAGE", multiplier: 0.4, target: "primary" },
          { type: "APPLY_STATUS", status: "stun", stacks: 1, duration: 1, target: "primary" },
        ],
      },
      {
        id: "pole-boost",
        name: "升压过载",
        emoji: "💪",
        delay: 8,
        kind: "buff",
        targeting: "self",
        weight: 1,
        anim: "buff",
        effects: [
          { type: "APPLY_STATUS", status: "strength", stacks: 2, target: "self" },
          { type: "GAIN_SHIELD", amount: 12, target: "self" },
        ],
      },
    ],
    dropTable: [...ELITE_BASE, generalDrop("magnet", 0.15)],
    boonTable: ELITE_BOONS,
  },
];
