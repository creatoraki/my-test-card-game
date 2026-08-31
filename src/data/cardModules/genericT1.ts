// 1 阶通用模组 —— 只从战斗掉落, 不可制造, 不看归属角色, 只看结构条件。
// 设计口径见《通用模组设计.md》§4(清单) 与 §5(实现)。
//
// 两组的结算时机刻意相反, 卡面文案也必须写清楚:
//   · 面板组 prependEffects —— 插在卡牌自身效果**之前**, 本卡按加成后的面板结算。
//   · 异常组 appendEffects  —— 追加在卡牌自身效果**之后**, 本卡伤害结算完才施加异常。

import {
  hasDamageEffect,
  hasScaledDamage,
  hasScaledSupport,
  type CardModuleDef,
} from "./types";

/** 异常组的 DOT 层数: 施放者攻击力 15% 对应层数, 持续 2 回合(与植物学家毒系卡同一口径)。 */
const DOT_STACK_MULTIPLIER = 0.15;
const DOT_DURATION = 2;

export const GENERIC_T1_CARD_MODULES: CardModuleDef[] = [
  // ---- 面板加成组: 只在本卡结算期间生效, 结算结束立即撤回 ----
  {
    itemId: "attack-module-t1",
    canEquip: hasScaledDamage,
    equipText: "使用攻击力结算的攻击卡",
    patch: {},
    prependEffects: [{ type: "PLAY_STAT_BONUS", stat: "attack", amount: 10 }],
    textSuffix: "（攻击力模组1：使用该卡牌时，计算结果时额外获得 10 点攻击力）",
  },
  {
    itemId: "healpower-module-t1",
    canEquip: hasScaledSupport,
    equipText: "使用治愈力结算的治疗或护盾卡",
    patch: {},
    prependEffects: [{ type: "PLAY_STAT_BONUS", stat: "healPower", amount: 10 }],
    textSuffix: "（治愈力模组1：使用该卡牌时，计算结果时额外获得 10 点治愈力）",
  },
  {
    itemId: "armorpen-module-t1",
    canEquip: hasScaledDamage,
    equipText: "使用攻击力结算的攻击卡",
    patch: {},
    prependEffects: [{ type: "PLAY_STAT_BONUS", stat: "armorPen", amount: 5 }],
    textSuffix: "（穿甲模组1：使用该卡牌时，计算结果时额外获得 5 点穿甲）",
  },
  {
    itemId: "crit-module-t1",
    canEquip: hasScaledDamage,
    equipText: "使用攻击力结算的攻击卡",
    patch: {},
    prependEffects: [{ type: "PLAY_STAT_BONUS", stat: "critRate", amount: 25 }],
    textSuffix: "（暴击模组1：使用该卡牌时，计算结果时额外获得 25% 暴击率）",
  },
  {
    // 唯一在某些战斗里收益为零的面板件(对 0 闪避目标), 所以给两项且装配条件最宽松。
    itemId: "precision-module-t1",
    canEquip: hasDamageEffect,
    equipText: "攻击卡",
    patch: {},
    prependEffects: [
      { type: "PLAY_STAT_BONUS", stat: "hitRate", amount: 10 },
      { type: "PLAY_STAT_BONUS", stat: "precision", amount: 5 },
    ],
    textSuffix: "（精准模组1：使用该卡牌时，计算结果时额外获得 10% 命中率与 5 点精准）",
  },

  // ---- 异常组: 打出后对目标施加 DOT。费用 ≥2 是把单次价值压回 1 阶的稀释器 ----
  {
    itemId: "poison-module-t1",
    canEquip: (def) => hasDamageEffect(def) && def.cost >= 2,
    equipText: "攻击卡，且费用 2 及以上",
    patch: {},
    appendEffects: [
      {
        type: "APPLY_STATUS",
        status: "poison",
        stacksFromStat: { stat: "attack", multiplier: DOT_STACK_MULTIPLIER },
        duration: DOT_DURATION,
        target: "primary",
      },
    ],
    textSuffix: "（淬毒模组1：打出后对目标施加攻击力 15% 层数的中毒，持续 2 回合）",
  },
  {
    itemId: "burn-module-t1",
    canEquip: (def) => hasDamageEffect(def) && def.cost >= 2,
    equipText: "攻击卡，且费用 2 及以上",
    patch: {},
    appendEffects: [
      {
        type: "APPLY_STATUS",
        status: "burn",
        stacksFromStat: { stat: "attack", multiplier: DOT_STACK_MULTIPLIER },
        duration: DOT_DURATION,
        target: "primary",
      },
    ],
    textSuffix: "（燃烧模组1：打出后对目标施加攻击力 15% 层数的灼烧，持续 2 回合）",
  },
];

/** 1 阶模组箱的开箱池 —— 与上表同一份真相, 新增一件模组不用改箱子。 */
export const GENERIC_T1_MODULE_IDS = GENERIC_T1_CARD_MODULES.map((module) => module.itemId);
