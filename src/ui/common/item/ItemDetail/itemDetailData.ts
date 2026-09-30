// 物品详情的「数据口径」—— 属性行、遗物触发文案等。
// 详情栏(ItemDetail)与悬浮详情卡(ItemTooltipCard)外观不同, 但读出来的内容必须是同一份。

import { STAT_KEYS } from "@/engine";
import type { StatBlock } from "@/engine";
import type { ItemDef, ItemStack, RelicTriggerId } from "@/items/types";
import { RELIC_TRIGGER_LABEL } from "@/items/types";
import { rollToFlat } from "@/items/equipRoll";
import { isPercentStat } from "@/ui/common/shared/statGroups";

// 属性中文名。⚠ 与 CryoScene 的队员档案是同一套口径, 改名要一起改。
// ★ 导出给 ShopItemCard 复用 —— 商店的详情栏样式独立, 但**文案口径必须同一份**。
export const STAT_LABEL: Partial<Record<keyof StatBlock, string>> = {
  maxHp: "生命上限",
  attack: "攻击力",
  healPower: "治愈力",
  lowCostMastery: "低费精通",
  highCostMastery: "高费精通",
  fastMastery: "速攻精通",
  executeMastery: "斩杀精通",
  chargeMastery: "冲锋精通",
  defense: "防御力",
  armorPen: "穿甲",
  hitRate: "命中率",
  dodgeRate: "闪避率",
  critRate: "暴击率",
  critDamage: "爆伤",
  precision: "精准",
  initiative: "先手",
  blockRate: "格挡率",
  healBoost: "治愈强度",
  shieldBoost: "护盾强度",
  ailmentResist: "异常抗性",
  burdenAdapt: "负重适应",
};

export interface ItemStatRow {
  label: string;
  value: string;
  good: boolean;
}

/** 物品带来的属性行: 装备取 roll 出的词条, 遗物取遗物修正, 其余取定义上的修正。 */
export function itemStatRows(stack: ItemStack, def: ItemDef): ItemStatRow[] {
  const flatMods = stack.roll
    ? rollToFlat(stack.roll)
    : def.category === "relic"
      ? def.relic?.mods?.flat
      : def.mods?.flat;
  const pctMods = def.category === "relic" ? def.relic?.mods?.pct : def.mods?.pct;
  const rows: ItemStatRow[] = [];
  for (const k of STAT_KEYS) {
    const flat = flatMods?.[k];
    const pct = pctMods?.[k];
    if (flat)
      rows.push({
        label: STAT_LABEL[k] ?? k,
        value: `${signed(flat)}${isPercentStat(k) ? "%" : ""}`,
        good: flat > 0,
      });
    if (pct)
      rows.push({
        label: STAT_LABEL[k] ?? k,
        value: `${signed(pct)}${isPercentStat(k) ? "%" : ""}`,
        good: pct > 0,
      });
  }
  return rows;
}

// 词条允许小数(如 1.5 倍换算), 显示时四舍五入。
const signed = (value: number) => {
  const n = Math.round(value);
  return n > 0 ? `+${n}` : `${n}`;
};

export function relicTriggerText(on: RelicTriggerId | RelicTriggerId[]): string {
  return (Array.isArray(on) ? on : [on]).map((id) => RELIC_TRIGGER_LABEL[id]).join("、");
}
