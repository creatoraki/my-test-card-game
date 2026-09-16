import type { EnemyDef } from "../types";
import { COMMON_BASE, generalDrop, LOW_BOONS } from "./shared";

export const TRAFFIC_LIGHT_BOT: EnemyDef = {
  id: "traffic-light-bot",
  name: "红绿灯机器人",
  emoji: "🚦",
  maxHp: 58,
  exp: 14,
  stats: { attack: 70, defense: 0, dodgeRate: 0, initiative: 19, critDamage: 150 },
  moves: [
    {
      id: "signal-yellow",
      name: "黄灯警示",
      emoji: "🟡",
      delay: 3,
      kind: "debuff",
      targeting: "foe",
      weight: 2,
      anim: "shot",
      effects: [
        { type: "DAMAGE", multiplier: 0.6, target: "primary" },
        { type: "MARK_CARDS", mark: "heavy", markPick: "handRandom", amount: 1 },
      ],
    },
    {
      id: "signal-red",
      name: "红灯禁行",
      emoji: "🔴",
      delay: 5,
      kind: "debuff",
      targeting: "foe",
      weight: 1,
      anim: "lightning",
      effects: [
        { type: "DAMAGE", multiplier: 0.6, target: "primary" },
        { type: "APPLY_STATUS", status: "stun", stacks: 1, duration: 1, target: "primary" },
      ],
    },
    {
      id: "signal-restrict",
      name: "限行标记",
      emoji: "🚧",
      delay: 4,
      kind: "debuff",
      targeting: "foe",
      weight: 1,
      anim: "buff",
      effects: [
        { type: "DAMAGE", multiplier: 0.4, target: "primary" },
        { type: "MARK_CARDS", mark: "heavy", markPick: "handRandom", amount: 2 },
      ],
    },
    {
      id: "signal-green",
      name: "交通管制",
      emoji: "🟢",
      delay: 4,
      kind: "buff",
      targeting: "allAllies",
      weight: 1,
      bias: [{ when: "allyCountAtLeast", value: 2, multiplier: 2 }],
      anim: "buff",
      effects: [
        { type: "APPLY_STATUS", status: "taunt", stacks: 1, duration: 1, target: "self" },
        { type: "APPLY_STAT_MOD", stat: "initiative", amount: 4, target: "allAllies" },
      ],
    },
  ],
  dropTable: [...COMMON_BASE, generalDrop("magnet", 0.05)],
  boonTable: LOW_BOONS,
};
