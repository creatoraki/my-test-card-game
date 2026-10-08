import type { EffectDescriptor } from "@/engine/types";
import { getStatusDef } from "@/engine";
import type { EnemyMove } from "@/data/enemies";
import { statLabel } from "@/ui/common/shared/statGroups";

const KIND_LABEL: Record<EnemyMove["kind"], string> = {
  attack: "攻击",
  block: "防御",
  buff: "增益",
  debuff: "减益",
  special: "特殊",
};

const EFFECT_LABEL: Record<string, string> = {
  DRAIN_SHIELD: "吸收护盾",
  STRIP_STATUS: "移除增益",
  APPLY_STAT_MOD: "施加属性修正",
  DISCARD: "弃牌",
  RECOVER_FROM_DISCARD: "从弃牌堆恢复",
  CONVERT_CARD_TYPE: "转换卡牌类型",
  ADD_CARD_TO_HAND: "将卡牌加入手牌",
  RESTORE_HP_LIMIT: "修复生命上限",
  VALUE_BOOST: "提高效果数值",
  PLAY_STAT_BONUS: "获得出牌属性加成",
  LOSE_HP: "失去生命",
  GAIN_POLLUTION: "增加污染值",
  CULTIVATE_TICK: "推进培育",
  ARK_SEIZE_CARD: "扣押目标所属的随机 1 张手牌，锁在蟹身上，仅击杀后返还",
  ARK_SEIZE_MANA: "扣押当前可用的 1 枚法力水晶，不降低后续回合自然回复，击杀后返还",
  ARK_CARRY_ROOTS: "将全部缠根牌搬到自身作为押品，最多持有 3 张",
  ARK_GERMINATE: "立即萌发并清空目标孢子，缠住随机 2 张所属手牌并施加 2 层中毒（持续 3 拍），同时触发蜗牛回灌",
  ARK_MARK_GUARD: "所有受庇护怪物的记忆改为被攻击角色",
  ARK_TRANSPLANT: "随机中毒角色作为病株，将其一半中毒层数（向上取整）复制给另一名角色，持续 3 拍，病株层数不减少",
  ARK_BARRAGE: "装填 3 发，开启持续 3 个时刻的火力封锁",
  GAIN_ENEMY_AP: "目标获得 2 点行动点，影响后续选招，当前蓄力招式不变",
  TICK_STATUS: "立即毒发 1 次，不扣层数或持续时间",
};

function numberText(value: number): string {
  return Number.isInteger(value) ? `${value}` : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function effectText(effect: EffectDescriptor): string {
  switch (effect.type) {
    case "DAMAGE": {
      const base = effect.amount != null ? `${numberText(effect.amount)} 点伤害` : `${numberText(effect.multiplier ?? 1)} 倍攻击伤害`;
      const hits = effect.hits ?? 1;
      return hits > 1 ? `${base}（${hits} 段）` : base;
    }
    case "APPLY_STATUS": {
      const status = effect.status ? getStatusDef(effect.status) : undefined;
      const name = status?.name ?? effect.status ?? "异常状态";
      const stacks = effect.stacks != null ? `${effect.stacks} 层` : effect.stacksFromStat ? "按属性计算层数" : "状态";
      const duration = effect.duration != null ? `，持续 ${effect.duration} 拍` : "";
      return `施加${name} ${stacks}${duration}`;
    }
    case "APPLY_STAT_MOD": {
      const label = statLabel(effect.stat);
      if (!label || effect.amount == null) return EFFECT_LABEL[effect.type];
      return `${label} ${effect.amount >= 0 ? "+" : ""}${numberText(effect.amount)}${effect.pct ? "%" : ""}`;
    }
    case "HEAL":
      return effect.amount != null ? `恢复 ${numberText(effect.amount)} 点生命` : `恢复 ${numberText(effect.multiplier ?? 1)} 倍治愈力`;
    case "GAIN_SHIELD":
      return effect.amount != null ? `获得 ${numberText(effect.amount)} 点护盾` : `获得 ${numberText(effect.multiplier ?? 1)} 倍治愈力护盾`;
    case "DRAIN_SHIELD":
      return effect.maxAmount != null
        ? `吸收护盾（每个目标最多 ${numberText(effect.maxAmount)} 点）`
        : "吸收护盾";
    case "STRIP_STATUS":
      return "移除增益";
    case "DRAW":
      return `抽 ${effect.amount ?? 1} 张牌`;
    case "GAIN_RESOURCE":
      return `获得 ${effect.amount ?? 1} 点资源`;
    case "GAIN_POLLUTION":
      return `增加 ${effect.amount ?? 0} 点污染值`;
    case "REMOVE_STATUS":
      return "移除状态";
    case "MARK_CARDS":
      return `标记 ${effect.amount ?? 1} 张牌`;
    default:
      return EFFECT_LABEL[effect.type] ?? "其他效果";
  }
}

export function moveKindLabel(kind: EnemyMove["kind"]): string {
  return KIND_LABEL[kind];
}

export function moveSummary(move: EnemyMove): string {
  if (move.description) return move.description;
  const summary = move.effects.map(effectText).filter(Boolean).join("；");
  return summary || KIND_LABEL[move.kind];
}
