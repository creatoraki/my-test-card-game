import type { StatusDef } from "../types";

export const CONTROL_STATUS_DEFS: Record<string, StatusDef> = {
  stun: {
    id: "stun",
    name: "眩晕",
    emoji: "💫",
    kind: "debuff",
    stackMode: "max",
    refreshMode: "max",
    desc: "无法行动。敌人跳过一次行动, 我方本回合无法打出其卡牌。",
    resistMode: "chance",
  },
};