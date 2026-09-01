import type { DropEntry } from "../../items/types";
import type { EnemyDef } from "./types";

// 首领必掉红水晶(见 items/materials.ts 的档位口径), 换金物与通用材料按首领体量放宽。
const BOSS_DROPS: DropEntry[] = [
  { kind: "item", itemId: "red-crystal", chance: 1 },
  { kind: "item", itemId: "golden-bear", chance: 0.5 },
  { kind: "item", itemId: "silver-bear", chance: 0.6 },
  { kind: "item", itemId: "logic-cube", chance: 0.3 },
  { kind: "item", itemId: "standard-gear", chance: 0.3 },
  { kind: "item", itemId: "standard-battery", chance: 0.3 },
];

export const BOSS_ENEMIES: EnemyDef[] = [
  {
    id: "scrap-mountain-guardian",
    name: "垃圾山的守护者",
    emoji: "🤖",
    maxHp: 200,
    exp: 80,
    actsPerRound: 2,
    stats: { attack: 100, defense: 8, dodgeRate: 0, initiative: 20, critDamage: 150 },
    ai: {
      openingMoveId: "guardian-recycle",
      recycleMoveId: "guardian-recycle",
      shredMoveId: "guardian-shred",
      hammerMoveId: "guardian-hammer",
      breatherMoveIds: ["guardian-press", "guardian-slam"],
      breatherWeights: { "guardian-press": 60, "guardian-slam": 40 },
      successors: {
        "guardian-recycle": { "guardian-shred": 30, "guardian-hammer": 10, "guardian-press": 30, "guardian-slam": 30 },
        "guardian-shred": { "guardian-hammer": 20, "guardian-press": 30, "guardian-slam": 35, "guardian-recycle": 15 },
        "guardian-hammer": { "guardian-shred": 25, "guardian-press": 30, "guardian-slam": 30, "guardian-recycle": 15 },
        "guardian-press": { "guardian-shred": 25, "guardian-hammer": 30, "guardian-slam": 25, "guardian-recycle": 20 },
        "guardian-slam": { "guardian-shred": 20, "guardian-hammer": 30, "guardian-press": 20, "guardian-recycle": 30 },
      },
      thresholds: { soloShield: 20, partyShield: 45, nearZeroShield: 8, imbalanceRatio: 1.5, concentration: 60 },
      hammerOverride: 90,
      hammerCooldown: 1,
      recycleInsurance: 2,
      brittleShredBias: 1.5,
    },
    moves: [
      {
        id: "guardian-recycle",
        name: "护盾回收",
        emoji: "🛡️",
        delay: 5,
        kind: "buff",
        targeting: "self",
        anim: "buff",
        effects: [
          { type: "DRAIN_SHIELD", target: "allFoes", amount: 18 },
          { type: "APPLY_STATUS", status: "chargedShell", stacks: 1, target: "self" },
        ],
      },
      {
        id: "guardian-shred",
        name: "碎片倾泻",
        emoji: "🔩",
        delay: 6,
        kind: "attack",
        targeting: "foe",
        anim: "shot",
        effects: [
          {
            type: "DAMAGE",
            multiplier: 0.75,
            target: "allFoes",
            damageBonus: { when: "targetHasNoShield", multiplier: 0.35 },
          },
        ],
      },
      {
        id: "guardian-hammer",
        name: "充能重锤",
        emoji: "🔨",
        delay: 5,
        kind: "attack",
        targeting: "foe",
        targetPick: "highestShield",
        anim: "slash",
        effects: [{ type: "DAMAGE", multiplier: 1.8, target: "primary" }],
      },
      {
        id: "guardian-press",
        name: "压块封锁",
        emoji: "🧱",
        delay: 3,
        kind: "debuff",
        targeting: "foe",
        anim: "buff",
        effects: [
          { type: "DAMAGE", multiplier: 0.35, target: "primary" },
          { type: "APPLY_STATUS", status: "weak", stacks: 1, duration: 2, target: "primary" },
        ],
      },
      {
        id: "guardian-slam",
        name: "守卫重击",
        emoji: "⚔️",
        delay: 4,
        kind: "attack",
        targeting: "foe",
        anim: "slash",
        effects: [{ type: "DAMAGE", multiplier: 1.0, target: "primary" }],
      },
    ],
    dropTable: BOSS_DROPS,
    boonTable: [
      { kind: "healDew", chance: 0.8 },
      { kind: "equipCrate", chance: 1 },
      { kind: "moduleCrate", chance: 0.5 },
      { kind: "cardOffer", chance: 1 },
    ],
  },
];
