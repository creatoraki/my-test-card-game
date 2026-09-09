import type { BoonEntry } from "../../explore/types";
import type { DropEntry } from "../../items/types";
import type { EnemyDef } from "./types";

const generalDrop = (itemId: string, chance: number): DropEntry => ({
  kind: "item",
  itemId,
  chance,
});

const MIMIC_BASE: DropEntry[] = [
  generalDrop("silver-bear", 0.6),
  generalDrop("golden-bear", 0.25),
  generalDrop("bronze-bear", 0.5),
  generalDrop("green-crystal", 0.3),
];

const MIMIC_GEAR_BOONS: BoonEntry[] = [{ kind: "equipCrate", chance: 1 }];
const MIMIC_CARD_BOONS: BoonEntry[] = [{ kind: "cardOffer", chance: 1 }];

export const MIMIC_ENEMIES: EnemyDef[] = [
  {
    id: "treasure-mimic-gear",
    name: "械匣宝箱怪",
    emoji: "🧰",
    maxHp: 100,
    exp: 26,
    fleeAfterRound: 2,
    stats: { attack: 0, defense: 8, dodgeRate: 0, initiative: 16, critDamage: 150 },
    moves: [
      {
        id: "mimic-gear-clamp",
        name: "合盖锁死",
        emoji: "🧰",
        delay: 3,
        kind: "block",
        targeting: "self",
        weight: 3,
        anim: "shield",
        effects: [{ type: "GAIN_SHIELD", amount: 20, target: "self" }],
      },
      {
        id: "mimic-gear-bolt",
        name: "加固螺栓",
        emoji: "🔩",
        delay: 4,
        kind: "buff",
        targeting: "self",
        weight: 2,
        anim: "buff",
        effects: [
          { type: "APPLY_STATUS", status: "ironwall", stacks: 2, target: "self" },
          { type: "GAIN_SHIELD", amount: 12, target: "self" },
        ],
      },
      {
        id: "mimic-gear-vent",
        name: "泄压喷气",
        emoji: "💨",
        delay: 4,
        kind: "buff",
        targeting: "self",
        weight: 1,
        anim: "buff",
        effects: [
          { type: "APPLY_STAT_MOD", stat: "initiative", amount: 6, target: "self" },
          { type: "GAIN_SHIELD", amount: 10, target: "self" },
        ],
      },
    ],
    dropTable: MIMIC_BASE,
    boonTable: MIMIC_GEAR_BOONS,
  },
  {
    id: "treasure-mimic-card",
    name: "牌匣宝箱怪",
    emoji: "🃏",
    maxHp: 36,
    exp: 22,
    fleeAfterRound: 2,
    stats: { attack: 0, defense: 0, dodgeRate: 35, initiative: 26, critDamage: 150 },
    moves: [
      {
        id: "mimic-card-blink",
        name: "折射跳步",
        emoji: "✦",
        delay: 2,
        kind: "buff",
        targeting: "self",
        weight: 3,
        anim: "buff",
        effects: [{ type: "APPLY_STAT_MOD", stat: "dodgeRate", amount: 12, target: "self" }],
      },
      {
        id: "mimic-card-shuffle",
        name: "洗牌残影",
        emoji: "🃏",
        delay: 3,
        kind: "buff",
        targeting: "self",
        weight: 2,
        anim: "buff",
        effects: [
          { type: "APPLY_STAT_MOD", stat: "dodgeRate", amount: 8, target: "self" },
          { type: "GAIN_SHIELD", amount: 6, target: "self" },
        ],
      },
      {
        id: "mimic-card-idle",
        name: "空转诱饵",
        emoji: "🫥",
        delay: 4,
        kind: "buff",
        targeting: "self",
        weight: 1,
        anim: "buff",
        effects: [{ type: "APPLY_STAT_MOD", stat: "initiative", amount: 5, target: "self" }],
      },
    ],
    dropTable: MIMIC_BASE,
    boonTable: MIMIC_CARD_BOONS,
  },
];
