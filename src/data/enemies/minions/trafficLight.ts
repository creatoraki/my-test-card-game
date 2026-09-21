import type { EnemyDef } from "../types";
import { COMMON_BASE, generalDrop, LOW_BOONS } from "./shared";

export const TRAFFIC_LIGHT_BOT: EnemyDef = {
  id: "traffic-light-bot",
  name: "红绿灯机器人",
  emoji: "🚦",
  maxHp: 70,
  exp: 14,
  stats: { attack: 55, defense: 4, dodgeRate: 0, initiative: 19, critDamage: 150 },
  moves: [
    {
      id: "signal-green",
      name: "交通管制",
      emoji: "🟢",
      delay: 2,
      kind: "buff",
      targeting: "self",
      weight: 1,
      bias: [
        { when: "selfLacksStatus", status: "escort", multiplier: 4 },
        // 没有队友时护航毫无意义，落单坦克优先攻击。
        { when: "allyCountBelow", value: 2, multiplier: 0 },
      ],
      anim: "buff",
      effects: [
        { type: "GAIN_SHIELD", amount: 14, target: "self" },
        { type: "APPLY_STATUS", status: "escort", stacks: 1, target: "self" },
      ],
    },
    {
      id: "signal-barrier",
      name: "路障加固",
      emoji: "🧱",
      delay: 4,
      kind: "buff",
      targeting: "self",
      weight: 1,
      bias: [
        { when: "selfHasStatus", status: "escort", multiplier: 1.5 },
        { when: "allyCountBelow", value: 2, multiplier: 0.3 },
      ],
      anim: "buff",
      effects: [{ type: "GAIN_SHIELD", amount: 12, target: "self" }],
    },
    {
      id: "signal-red",
      name: "红灯禁行",
      emoji: "🔴",
      delay: 4,
      kind: "attack",
      targeting: "foe",
      weight: 1.5,
      bias: [{ when: "allyCountBelow", value: 2, multiplier: 3 }],
      anim: "lightning",
      effects: [
        { type: "DAMAGE", multiplier: 0.75, target: "primary" },
        { type: "APPLY_STATUS", status: "static", stacks: 2, target: "primary" },
      ],
    },
    {
      id: "signal-yellow",
      name: "黄灯警示",
      emoji: "🟡",
      delay: 3,
      kind: "debuff",
      targeting: "foe",
      weight: 1,
      bias: [{ when: "allyCountBelow", value: 2, multiplier: 3 }],
      anim: "shot",
      effects: [
        { type: "DAMAGE", multiplier: 0.6, target: "primary" },
        { type: "MARK_CARDS", mark: "heavy", markPick: "targetHandRandom", amount: 1, target: "primary" },
      ],
    },
  ],
  dropTable: [...COMMON_BASE, generalDrop("magnet", 0.05)],
  boonTable: LOW_BOONS,
};
