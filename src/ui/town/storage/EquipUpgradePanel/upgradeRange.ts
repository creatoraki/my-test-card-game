// 升阶后属性区间 —— 纯计算, 不碰 React。
//
// ★ 口径全部来自 items/equipRoll.ts 的 upgradeEquipment(): 升阶不是重掷, 而是在原 roll 上继续加点。
//   1. 每条正面词条先抬到新阶模型的 affix.min 地板: max(affix.min, 旧值)。
//   2. 负面词条**整条重置**为 -rolledCost(数据上 min === max, 所以是确定值, 不是区间)。
//   3. 增量预算 = randomInt(4,5) + 新阶返还 - 旧 cost 按新阶费率折算的返还。
//   4. 这份预算按权重随机分配到各正面词条, 单条不超过 affix.max。
//
// ⚠ 下限通常等于地板值(这一条可能一点都没分到); 只有**其余词条全部封顶**、预算无处可去时,
//   它才被迫吃下多出来的点 —— 所以下限要减去其余词条的剩余空间, 不能想当然写成地板值。

import type { StatBlock } from "@/engine";
import { AFFIX_SCALE } from "@/items/equipRoll";
import type { EquipRoll, ItemDef } from "@/items/types";
import { STAT_LABEL } from "@/ui/common/item/ItemDetail";
import { isPercentStat } from "@/ui/common/statGroups";

/** 升阶固定投入的模型值(见 upgradeEquipment 里的 randomInt(4, 5))。 */
const ADDED_MIN = 4;
const ADDED_MAX = 5;

export interface StatRangeRow {
  stat: keyof StatBlock;
  label: string;
  /** 展示值(点数 × AFFIX_SCALE), 下同。 */
  current: number;
  min: number;
  max: number;
  /** 这条词条已经顶到模型上限, 升阶不会再涨。 */
  capped: boolean;
  /** 负面词条(升阶会整条重掷成新阶的固定代价)。 */
  drawback: boolean;
  percent: boolean;
}

export interface UpgradeRangePreview {
  rows: StatRangeRow[];
  /** 本次升阶实际投入的模型值区间。 */
  budgetMin: number;
  budgetMax: number;
}

const scaled = (stat: keyof StatBlock, points: number) => points * (AFFIX_SCALE[stat] ?? 1);

/** 算出「这件装备升到 nextDef 后, 每条属性可能落在什么区间」。nextDef 没有模型时返回 null。 */
export function upgradeRangePreview(nextDef: ItemDef, roll: EquipRoll): UpgradeRangePreview | null {
  const model = nextDef.model;
  if (!model) return null;

  const refundRate = model.costRefund ?? 0.7;
  const drawbacks = model.drawbacks ?? [];
  const costMin = drawbacks.reduce((sum, affix) => sum + affix.min, 0);
  const costMax = drawbacks.reduce((sum, affix) => sum + affix.max, 0);
  const refundOf = (cost: number) => model.costRefundFlat ?? Math.round(cost * refundRate);
  // 旧 cost 也按**新阶**的费率折算 —— 与 upgradeEquipment 保持一致。
  const previousRefund = roll.cost == null ? 0 : Math.round(roll.cost * refundRate);
  const budgetMin = Math.max(0, ADDED_MIN + refundOf(costMin) - previousRefund);
  const budgetMax = Math.max(budgetMin, ADDED_MAX + refundOf(costMax) - previousRefund);

  const floors = model.affixes.map((affix) => Math.max(affix.min, roll.points[affix.stat] ?? 0));
  const rooms = model.affixes.map((affix, i) => Math.max(0, affix.max - floors[i]));
  const totalRoom = rooms.reduce((sum, room) => sum + room, 0);

  const rows: StatRangeRow[] = model.affixes.map((affix, i) => {
    const floor = floors[i];
    const room = rooms[i];
    const forced = Math.max(0, budgetMin - (totalRoom - room)); // 别处装不下才必须落到这一条
    return {
      stat: affix.stat,
      label: STAT_LABEL[affix.stat] ?? affix.stat,
      current: scaled(affix.stat, roll.points[affix.stat] ?? 0),
      min: scaled(affix.stat, floor + Math.min(forced, room)),
      max: scaled(affix.stat, floor + Math.min(budgetMax, room)),
      capped: room === 0,
      drawback: false,
      percent: isPercentStat(affix.stat),
    };
  });

  for (const affix of drawbacks) {
    rows.push({
      stat: affix.stat,
      label: STAT_LABEL[affix.stat] ?? affix.stat,
      current: scaled(affix.stat, roll.points[affix.stat] ?? 0),
      // 负面值是「扣掉多少」, 区间的下界对应扣得最狠的那一头。
      min: scaled(affix.stat, -affix.max),
      max: scaled(affix.stat, -affix.min),
      capped: false,
      drawback: true,
      percent: isPercentStat(affix.stat),
    });
  }

  return { rows, budgetMin, budgetMax };
}

/** 展示用: 去掉多余的 .0, 正数带 +。 */
export function signedValue(value: number): string {
  const text = Number.isInteger(value) ? `${value}` : value.toFixed(1);
  return value > 0 ? `+${text}` : text;
}
