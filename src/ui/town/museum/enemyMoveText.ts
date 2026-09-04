import type { EffectDescriptor } from "@/engine/types";
import { getStatusDef } from "@/engine";
import type { EnemyMove } from "@/data/enemies";

const KIND_LABEL: Record<EnemyMove["kind"], string> = {
  attack: "攻击",
  block: "防御",
  buff: "增益",
  debuff: "减益",
  special: "特殊",
};

const EFFECT_LABEL: Record<string, string> = {
  DRAIN_SHIELD: "吸收护盾",
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
    case "HEAL":
      return effect.amount != null ? `恢复 ${numberText(effect.amount)} 点生命` : `恢复 ${numberText(effect.multiplier ?? 1)} 倍治愈力`;
    case "GAIN_SHIELD":
      return effect.amount != null ? `获得 ${numberText(effect.amount)} 点护盾` : `获得 ${numberText(effect.multiplier ?? 1)} 倍治愈力护盾`;
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
  const summary = move.effects.map(effectText).filter(Boolean).join("；");
  return summary || KIND_LABEL[move.kind];
}
