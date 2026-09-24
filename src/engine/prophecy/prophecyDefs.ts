// ============================================================================
// 预言定义表 —— 纯数据(与 CARD_MARK_DEFS 同口径)。条件判定在 prophecy.ts 中按 id 分派。
// 统一写法: 预言(期限): [条件]。应验: [奖励]。落空: [结果]。
// ============================================================================

import type { EffectDescriptor, ProphecyId } from "../types";

export interface ProphecyDef {
  id: ProphecyId;
  name: string; // 状态显示为「预言·name」
  emoji: string;
  statusId: string; // 挂在预言家身上的状态 id
  desc: string;
  duration?: number; // 期限(我方拍数); 缺省 = 无期限
  durationStartsImmediately?: true; // true = 打出当回合也计入期限(「本回合」「3 回合内」)
  goal?: number; // 累计型条件的目标值(进度存于状态 data.progress)
  onFulfill: EffectDescriptor[];
  onFail?: EffectDescriptor[];
}

// 凶兆在目标敌人身上的显示标记。
export const ILL_OMEN_MARK = "illOmen";

export const PROPHECY_DEFS: Record<ProphecyId, ProphecyDef> = {
  goodOmen: {
    id: "goodOmen",
    name: "吉兆",
    emoji: "🍀",
    statusId: "prophecyGoodOmen",
    desc: "预言（至下回合结束）：有敌人被击杀。应验：汇星 2。",
    duration: 1,
    onFulfill: [{ type: "APPLY_STATUS", status: "starlight", stacks: 2, target: "self" }],
  },
  omen: {
    id: "omen",
    name: "预兆",
    emoji: "🔮",
    statusId: "prophecyOmen",
    desc: "预言（本回合）：有牌触发瀑布。应验：汇星 1，抽 1 张牌。",
    duration: 1,
    durationStartsImmediately: true,
    onFulfill: [
      { type: "APPLY_STATUS", status: "starlight", stacks: 1, target: "self" },
      { type: "DRAW", amount: 1 },
    ],
  },
  illOmen: {
    id: "illOmen",
    name: "凶兆",
    emoji: "🦉",
    statusId: "prophecyIllOmen",
    desc: "预言（直到被标记的敌人下次行动）：该敌人发动攻击招式。应验：这次攻击的伤害 -50%，汇星 1。落空：抽 1 张牌。",
    onFulfill: [{ type: "APPLY_STATUS", status: "starlight", stacks: 1, target: "self" }],
    onFail: [{ type: "DRAW", amount: 1 }],
  },
  apocalypse: {
    id: "apocalypse",
    name: "天启",
    emoji: "📯",
    statusId: "prophecyApocalypse",
    desc: "预言（3 回合内）：累计消耗 6 层星辉。应验：对所有敌人造成攻击力 250% 的伤害。",
    duration: 3,
    durationStartsImmediately: true,
    goal: 6,
    onFulfill: [{ type: "DAMAGE", multiplier: 2.5, target: "allFoes" }],
  },
};

export const PROPHECY_LIST: ProphecyDef[] = Object.values(PROPHECY_DEFS);

export function prophecyByStatus(statusId: string): ProphecyDef | undefined {
  return PROPHECY_LIST.find((def) => def.statusId === statusId);
}
