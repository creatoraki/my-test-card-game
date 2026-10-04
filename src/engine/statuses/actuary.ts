import type { DamageCtx, StatusDef, StatusCtx } from "../types";
import { settleExpiredInsurance } from "../actuary/claims";
import { actuaryAfterHit, actuaryBeforeHpLoss } from "../actuary/insuranceHits";
import { surplusCap } from "../actuary/surplus";

// 受击联动统一转发到 actuary/insuranceHits(同一次伤害只结算一遍, 与状态先后无关)。
const afterHit = (c: StatusCtx, dmg: DamageCtx) => actuaryAfterHit(c.state, c.ownerId, dmg);
const beforeHpLoss = (c: StatusCtx, dmg: DamageCtx) => actuaryBeforeHpLoss(c.state, c.ownerId, dmg);

export const ACTUARY_STATUS_DEFS: Record<string, StatusDef> = {
  insurance: {
    id: "insurance",
    name: "保险",
    emoji: "🧾",
    kind: "buff",
    desc: "状态结束时理赔：按保险层数回复生命；受到敌方直接攻击时，层数提升 20%。",
    durationStartsImmediately: true,
    stackMode: "add",
    refreshMode: "max",
    hooks: {
      onAfterAttacked: afterHit,
      onExpire: (c) => settleExpiredInsurance(c.state, c.ownerId, c.inst),
    },
  },
  echo: {
    id: "echo",
    name: "回响",
    emoji: "🔁",
    kind: "buff",
    desc: "回响卡牌的基础效果会同步作用于带有回响的队友。",
    durationStartsImmediately: true,
    maxStacks: 1,
  },
  // 假装受伤 —— 急诊模组与《分诊》的产物: 只作为「本回合被打过」的替身标记, 自身不带任何结算钩子,
  // 因此不触发保险增值、风险准备金与止损。
  // ★ durationStartsImmediately: 与保险同一口径, 持续 N 回合 = 含施加当回合在内的 N 个回合,
  //   所以 duration 1 正好只覆盖打出模组卡的这一回合。
  feignInjury: {
    id: "feignInjury",
    name: "假装受伤",
    emoji: "🎭",
    kind: "buff",
    desc: "持续期间自身视为本回合已被攻击，可直接触发急诊。",
    durationStartsImmediately: true,
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "max",
  },
  deductible: {
    id: "deductible",
    name: "免赔",
    emoji: "📉",
    kind: "buff",
    desc: "受到的伤害降低 20%。",
    hooks: {
      modifyIncomingDamage: (_c, _dmg, mods) => {
        mods.mulTaken(0.8);
      },
    },
  },
  // 盈余 —— 精算师自身的资源。入账见 actuary/surplus, 出口卡走 CONSUME_STATUS。
  surplus: {
    id: "surplus",
    name: "盈余",
    emoji: "💰",
    kind: "buff",
    undispellable: true,
    stackMode: "add",
    maxStacksOf: surplusCap,
    desc: "理赔溢额的 50% 计入盈余（偿付能力生效时为全额）。上限为精算师治愈力 100% 换算的点数（偿付能力生效时翻倍）。",
  },
  stopLoss: {
    id: "stopLoss",
    name: "止损",
    emoji: "🛑",
    kind: "buff",
    durationStartsImmediately: true,
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "max",
    desc: "下一次受到敌方直接攻击后（先结算保险增值），回复等同于当前保险层数的生命，不扣除保险，然后移除止损。",
    hooks: { onAfterAttacked: afterHit },
  },
  lifeline: {
    id: "lifeline",
    name: "寿险",
    emoji: "🛟",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    desc: "受到致命伤害时，生命保留为 1，并立即理赔全部保险，回复量翻倍。随保险存续；每名队友每场战斗只能触发 1 次。",
    hooks: {
      onApplied: (c) => {
        if (!c.state.lifelineUsed.includes(c.ownerId)) return;
        const owner = c.state.combatants[c.ownerId];
        owner.statuses = owner.statuses.filter((status) => status !== c.inst);
        c.ops.log(c.state, `${owner.emoji} ${owner.name} 本场战斗已触发过寿险`);
      },
      // 保险被驱散等途径移除后, 寿险随之失效。
      onRoundStart: (c) => {
        const owner = c.state.combatants[c.ownerId];
        if (!owner.statuses.some((status) => status.id === "insurance" && status.stacks > 0))
          owner.statuses = owner.statuses.filter((status) => status !== c.inst);
      },
      onBeforeHpLoss: beforeHpLoss,
      onAfterAttacked: afterHit,
    },
  },
  beneficiary: {
    id: "beneficiary",
    name: "受益人",
    emoji: "🎁",
    kind: "buff",
    durationStartsImmediately: true,
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "max",
    desc: "其他队友理赔产生的溢额，改为回复受益人。同时只能有 1 名受益人。",
    hooks: {
      // 新的受益人顶替旧的。
      onApplied: (c) => {
        for (const id of c.state.playerIds) {
          if (id === c.ownerId) continue;
          const ally = c.state.combatants[id];
          if (ally) ally.statuses = ally.statuses.filter((status) => status.id !== "beneficiary");
        }
      },
    },
  },
  generalAverage: {
    id: "generalAverage",
    name: "共同海损",
    emoji: "⚓",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    expiresOnRoundEnd: true,
    desc: "本回合内，受到敌方直接攻击时，伤害平均分摊给所有存活队友（向上取整）；分摊到伤害的队友视为受到一次直接攻击。",
    hooks: { onBeforeHpLoss: beforeHpLoss },
  },
  coinsurance: {
    id: "coinsurance",
    name: "共保体",
    emoji: "🤝",
    kind: "buff",
    undispellable: true,
    maxStacks: 1,
    stackMode: "max",
    desc: "本场战斗中，回响每回合新增人数不受限制。",
  },
  solvency: {
    id: "solvency",
    name: "偿付能力",
    emoji: "🏦",
    kind: "buff",
    undispellable: true,
    maxStacks: 1,
    stackMode: "max",
    desc: "本场战斗中，理赔溢额全额计入盈余，盈余上限翻倍。",
  },
  // 风险评估挂在敌人身上。data.insure = 被攻击者没有保险时获得的保险层数(施加时按精算师治愈力换算)。
  highRisk: {
    id: "highRisk",
    name: "高风险",
    emoji: "⚠️",
    kind: "debuff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "max",
    desc: "持有者的直接攻击命中我方时，被攻击者的保险增值改为提高 50%；被攻击者没有保险时，改为获得保险。",
    hooks: {
      onAfterAttack: (c, dmg) => actuaryAfterHit(c.state, dmg.targetId, dmg),
    },
  },
};
