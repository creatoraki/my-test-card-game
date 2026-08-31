import type { CardDef, EffectDescriptor } from "@/engine/types";

export interface CardModuleDef {
  itemId: string;
  canEquip: (def: CardDef) => boolean;
  /** 装配条件的展示文案。★ 与 canEquip 写在一起, 规则改了文案不会漏改; 物品详情直接读它。 */
  equipText: string;
  /** 白名单字段覆盖: 重算时先还原成基础卡定义, 再套上当前模组的值。 */
  patch: Partial<Pick<CardDef, "cardType">>;
  /** 相对基础费用的调整。重算时独立还原, 不受卡牌强化影响。 */
  costDelta?: number;
  /** 插在 card.effects 最前的效果。 */
  prependEffects?: EffectDescriptor[];
  /** 追加到 card.effects 末尾的效果。⚠ 不能走 patch —— effects 会被 upgradeCard 就地强化,
   *  整字段还原会把强化结果一起抹掉, 所以这里改成带 fromModule 标记的追加/剥离。 */
  appendEffects?: EffectDescriptor[];
  /** 追加的卡牌词条, 同样用 fromModule 保证反复装卸幂等。 */
  appendKeywords?: CardDef["keywords"];
  /** 追加到 card.text 末尾的说明。重算时按登记过的全部后缀做剔除, 同样不碰卡牌自身文案。 */
  textSuffix?: string;
}

// ---------------------------------------------------------------------------
// 装配条件的判定口径(《通用模组设计.md》§6)
// ---------------------------------------------------------------------------

/** 含伤害效果 —— 固定伤害与倍率伤害都算。 */
export function hasDamageEffect(def: CardDef): boolean {
  return def.effects.some((effect) => effect.type === "DAMAGE");
}

/** 含**攻击力倍率**伤害。★ 固定伤害(写 amount)完全不读攻击力, 装攻击力模组收益恰好为零,
 *  必须用这条挡住 —— 装上去毫无变化是纯粹的挫败。 */
export function hasScaledDamage(def: CardDef): boolean {
  return def.effects.some((effect) => effect.type === "DAMAGE" && effect.multiplier != null);
}

/** 含**治愈力倍率**治疗或护盾。同理挡住治愈力模组装在固定值护盾牌上。 */
export function hasScaledSupport(def: CardDef): boolean {
  return def.effects.some(
    (effect) => (effect.type === "HEAL" || effect.type === "GAIN_SHIELD") && effect.multiplier != null,
  );
}
