// ---------------------------------------------------------------------------
// 属性面板 —— 见《角色养成设计.md》第三/五/六章。
// ⚠ 所有概率与百分比类属性一律存**百分点整数**(命中率 8 = +8%, 爆伤 150 = 150%),
//   引擎里不出现 0.08 这种小数, 避免"到底该加还是该乘"的歧义。
// ---------------------------------------------------------------------------
export interface StatBlock {
  // 生存与输出
  maxHp: number; // 最大生命。★ 战斗中的实时上限读 Combatant.maxHp, 这里只是声明来源
  attack: number; // 攻击力: 攻击牌伤害 = 攻击力 ÷ RULES.combat.attackDivisor × 倍率
  healPower: number; // 治愈力: 治疗/护盾基础值 = 治愈力 ÷ RULES.combat.healDivisor × 倍率
  lowCostMastery: number; // 低费精通: 仅在卡牌结算窗口内叠加到攻击力与治愈力
  highCostMastery: number; // 高费精通: 仅在卡牌结算窗口内叠加到攻击力与治愈力
  fastMastery: number; // 速攻精通: 打出速攻牌时叠加到攻击力(只加伤害)
  executeMastery: number; // 斩杀精通: 攻击生命低于 50% 的目标时叠加到攻击力(只加伤害)
  chargeMastery: number; // 冲锋精通: 攻击满血目标时叠加到攻击力(只加伤害)
  defense: number; // 防御力: 正值按防御力 / (防御力 + 常量)减伤，负值增伤；穿甲只抵扣正防御，角色基础防御力为 0
  armorPen: number; // 穿甲(固定整数): 结算时抵扣目标防御力, 有效防御力不低于 0
  // 命中 / 回避 / 暴击
  hitRate: number; // 命中率(百分点)
  dodgeRate: number; // 闪避率(百分点, 最终值 70 封顶)
  critRate: number; // 暴击率(百分点, 最终值 70 封顶)
  critDamage: number; // 爆伤(百分点, 150 = 暴击伤害为 1.5 倍)
  precision: number; // 精准(百分点, 只抵消目标闪避, 不封顶)
  // 节奏 / 防护 / 异常
  initiative: number; // 先手: 敌人招式发动时刻 = max(1, 招式延迟 + 我方均值 − 敌方先手)
  blockRate: number; // 格挡率(百分点, 最终值 70 封顶); 成功则本次伤害 ×RULES.combat.blockReduction
  healBoost: number; // 治愈强度(百分点): 最终治疗 ×(1 + 治愈强度/100)
  shieldBoost: number; // 护盾强度(百分点): 最终护盾 ×(1 + 护盾强度/100)
  ailmentResist: number; // 异常抗性(百分点, 最终值 70 封顶); 抵抗哪一项由各异常自己定义
  // 探索 / 小队
  burdenAdapt: number; // 负重适应(固定值): 小队合计, 每 1 点抵扣 1 格占格
}

// 属性修正层。最终属性 = (基础 + flat) × (1 + pct/100)。
// 装备(局外常驻)与卡牌/状态(战斗内)都用这个结构, 只是生命周期不同。
export interface StatModifier {
  flat?: Partial<StatBlock>; // 固定值; 装备的百分点属性也放这里
  pct?: Partial<StatBlock>; // 按基数放大的百分比; 同名 pct 默认相加
}
