import type { BoonEntry } from "@/explore/types";
import type { DropEntry } from "@/items/types";
import { DEFAULT_REGION_ID, regionalMaterial } from "../../items/catalog/regional";
import type { EnemyDef } from "../types";

// ⚠ 本表当前只服务废弃楼层（教程关与它共用同一批敌人，串掉可接受）。第二个地区落地时必须改成「档位 × 地区」两维。
// 拆成 neonCommonBase / gardenCommonBase，或让基础表接受 regionId 参数、由 regionalMaterial() 拼装。不要直接再塞一条地区材料。
const ELITE_BASE: DropEntry[] = [
  { kind: "item", itemId: "blue-crystal", chance: 0.6 },
  { kind: "item", itemId: regionalMaterial(DEFAULT_REGION_ID, "mid").id, chance: 0.5 },
  { kind: "item", itemId: "copper-coin", chance: 0.46 },
];

const generalDrop = (itemId: string, chance: number): DropEntry => ({
  kind: "item",
  itemId,
  chance,
});

const ELITE_BOONS: BoonEntry[] = [
  { kind: "healDew", chance: 0.5 },
  { kind: "equipCrate", chance: 0.21 },
  { kind: "moduleCrate", chance: 0.25 },
  { kind: "cardOffer", chance: 0.55 },
];

export const ELITE_ENEMIES: EnemyDef[] = [
  {
    id: "scrap-bot",
    name: "废品机器人",
    emoji: "🤖",
    maxHp: 95,
    exp: 39,
    stats: { attack: 100, defense: 4, dodgeRate: 0, initiative: 20, critDamage: 150 },
    moves: [
      {
        id: "scrap-crush",
        name: "压板重砸",
        emoji: "🔨",
        cost: 4,
        delay: 3,
        kind: "attack",
        targeting: "foe",
        weight: 2,
        anim: "smash",
        effects: [{ type: "DAMAGE", multiplier: 0.8925, target: "primary" }],
      },
      {
        id: "scrap-spray",
        name: "废料喷流",
        emoji: "💥",
        cost: 6,
        delay: 4,
        kind: "attack",
        targeting: "foe",
        weight: 1,
        anim: "shot",
        effects: [{ type: "DAMAGE", multiplier: 0.6375, target: "allFoes" }],
      },
      {
        id: "scrap-compress",
        name: "压缩封罐",
        emoji: "🧱",
        cost: 4,
        delay: 3,
        kind: "debuff",
        targeting: "foe",
        weight: 1,
        anim: "debuff",
        effects: [
          { type: "DAMAGE", multiplier: 0.255, target: "primary" },
          { type: "MARK_CARDS", mark: "heavy", markPick: "handRandom", amount: 1 },
        ],
      },
      {
        id: "scrap-plating",
        name: "碎料护甲",
        emoji: "🛡️",
        cost: 3,
        delay: 2,
        kind: "block",
        targeting: "self",
        weight: 1,
        anim: "shield",
        effects: [{ type: "GAIN_SHIELD", amount: 14, target: "self" }],
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
    exp: 42,
    stats: { attack: 100, defense: 4, dodgeRate: 0, initiative: 20, critDamage: 150 },
    moves: [
      {
        id: "pole-smash",
        name: "高压重击",
        emoji: "⚔️",
        cost: 4,
        delay: 3,
        kind: "attack",
        targeting: "foe",
        weight: 2,
        anim: "smash",
        effects: [{ type: "DAMAGE", multiplier: 0.99, target: "primary" }],
      },
      {
        id: "pole-arc",
        name: "电弧急放",
        emoji: "⚡",
        cost: 6,
        delay: 4,
        kind: "attack",
        targeting: "foe",
        weight: 1,
        anim: "lightning",
        effects: [{ type: "DAMAGE", multiplier: 0.765, target: "allFoes" }],
      },
      {
        id: "pole-paralyze",
        name: "麻痹电流",
        emoji: "💫",
        cost: 5,
        delay: 4,
        kind: "debuff",
        targeting: "foe",
        weight: 1,
        anim: "lightning",
        effects: [
          { type: "DAMAGE", multiplier: 0.36, target: "primary" },
          { type: "APPLY_STATUS", status: "stun", stacks: 1, duration: 1, target: "primary" },
        ],
      },
      {
        id: "pole-boost",
        name: "升压过载",
        emoji: "💪",
        cost: 4,
        delay: 3,
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
