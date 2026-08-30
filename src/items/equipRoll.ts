import type { StatBlock } from "../engine/types";
import type { EquipAffixDef, EquipModelDef, EquipRoll, ItemDef } from "./types";

export const AFFIX_SCALE: Partial<Record<keyof StatBlock, number>> = {
  maxHp: 1,
  attack: 1,
  healPower: 1,
  lowCostMastery: 1,
  highCostMastery: 1,
  critRate: 2,
  critDamage: 2,
  hitRate: 1,
  precision: 2,
  armorPen: 1,
  initiative: 0.5,
  defense: 1,
};

export const COST_ALLOWED_STATS: ReadonlySet<keyof StatBlock> = new Set([
  "maxHp",
  "initiative",
  "healPower",
  "critDamage",
  "hitRate",
  "defense",
]);

function randomInt(min: number, max: number, pick: (n: number) => number): number {
  return min + pick(max - min + 1);
}

function calculateRefund(model: EquipModelDef, cost: number): number {
  return model.costRefundFlat ?? Math.round(cost * (model.costRefund ?? 0.7));
}

function weightedPick(
  affixes: EquipAffixDef[],
  pick: (n: number) => number,
): EquipAffixDef {
  const totalWeight = affixes.reduce((sum, affix) => sum + affix.weight, 0);
  let roll = pick(totalWeight);
  for (const affix of affixes) {
    if (roll < affix.weight) return affix;
    roll -= affix.weight;
  }
  return affixes[affixes.length - 1];
}

function distribute(
  model: EquipModelDef,
  points: Partial<Record<keyof StatBlock, number>>,
  amount: number,
  pick: (n: number) => number,
): void {
  let remain = amount;
  while (remain > 0) {
    const available = model.affixes.filter((affix) => (points[affix.stat] ?? 0) < affix.max);
    if (!available.length) throw new Error("装备模型容量不足以容纳模型值");
    const affix = weightedPick(available, pick);
    const room = affix.max - (points[affix.stat] ?? 0);
    const size = Math.min(remain, room, randomInt(2, model.blockMax, pick));
    points[affix.stat] = (points[affix.stat] ?? 0) + size;
    remain -= size;
  }
}

export function assertModelValid(def: ItemDef): void {
  const model = def.model;
  if (!model) return;

  const minSum = model.affixes.reduce((sum, affix) => sum + affix.min, 0);
  const maxSum = model.affixes.reduce((sum, affix) => sum + affix.max, 0);
  const costRefund = model.costRefund ?? 0.7;
  const hasDrawbacks = Boolean(model.drawbacks?.length);
  const costRefundFlat = model.costRefundFlat;
  const maxCost = (model.drawbacks ?? []).reduce((sum, affix) => sum + affix.max, 0);
  const maxRefund = costRefundFlat ?? Math.round(maxCost * costRefund);
  if (
    !Number.isInteger(model.budget.min) ||
    !Number.isInteger(model.budget.max) ||
    !Number.isInteger(model.blockMax) ||
    model.blockMax < 2 ||
    model.budget.min > model.budget.max ||
    minSum > model.budget.min ||
    maxSum < model.budget.max + maxRefund ||
    !Number.isFinite(costRefund) ||
    costRefund < 0 ||
    costRefund > 1 ||
    (costRefundFlat != null &&
      (!hasDrawbacks || !Number.isInteger(costRefundFlat) || costRefundFlat < 0)) ||
    model.affixes.some(
      (affix) =>
        !Number.isInteger(affix.min) ||
        !Number.isInteger(affix.max) ||
        affix.min < 0 ||
        affix.min > affix.max ||
        !Number.isInteger(affix.weight) ||
        affix.weight <= 0 ||
        AFFIX_SCALE[affix.stat] == null,
    ) ||
    model.drawbacks?.some(
      (affix) =>
        !Number.isInteger(affix.min) ||
        !Number.isInteger(affix.max) ||
        affix.min < 0 ||
        affix.min > affix.max ||
        !Number.isInteger(affix.weight) ||
        affix.weight <= 0 ||
        !COST_ALLOWED_STATS.has(affix.stat) ||
        AFFIX_SCALE[affix.stat] == null,
    )
  ) {
    throw new Error(`装备模型无效: ${def.id}`);
  }
}

export function rollEquipment(def: ItemDef, pick: (n: number) => number): EquipRoll | undefined {
  if (!def.model) return undefined;
  assertModelValid(def);
  const points: Partial<Record<keyof StatBlock, number>> = {};
  for (const affix of def.model.affixes) points[affix.stat] = affix.min;
  let cost = 0;
  for (const drawback of def.model.drawbacks ?? []) {
    const rolledCost = randomInt(drawback.min, drawback.max, pick);
    points[drawback.stat] = (points[drawback.stat] ?? 0) - rolledCost;
    cost += rolledCost;
  }
  const refund = calculateRefund(def.model, cost);
  const budget = randomInt(def.model.budget.min, def.model.budget.max, pick) + refund;
  const minPoints = def.model.affixes.reduce((sum, affix) => sum + affix.min, 0);
  distribute(def.model, points, budget - minPoints, pick);
  return { budget, cost: cost || undefined, points };
}

export function upgradeEquipment(
  roll: EquipRoll,
  nextDef: ItemDef,
  pick: (n: number) => number,
): EquipRoll {
  if (!nextDef.model) throw new Error(`装备没有可升阶模型: ${nextDef.id}`);
  assertModelValid(nextDef);
  const points: Partial<Record<keyof StatBlock, number>> = {};
  for (const affix of nextDef.model.affixes) {
    points[affix.stat] = Math.max(affix.min, roll.points[affix.stat] ?? 0);
  }
  const previousRefund =
    roll.cost == null ? 0 : Math.round(roll.cost * (nextDef.model.costRefund ?? 0.7));
  let cost = 0;
  for (const drawback of nextDef.model.drawbacks ?? []) {
    const rolledCost = randomInt(drawback.min, drawback.max, pick);
    points[drawback.stat] = -rolledCost;
    cost += rolledCost;
  }
  const refund = calculateRefund(nextDef.model, cost);
  const added = randomInt(4, 5, pick);
  const budgetAdded = added + refund - previousRefund;
  if (budgetAdded < 0) throw new Error(`装备升阶后预算不足: ${nextDef.id}`);
  distribute(nextDef.model, points, budgetAdded, pick);
  return { budget: roll.budget + budgetAdded, cost: cost || undefined, points };
}

export function rollToFlat(roll: EquipRoll): Partial<StatBlock> {
  const flat: Partial<StatBlock> = {};
  for (const [stat, points] of Object.entries(roll.points) as [keyof StatBlock, number][]) {
    const scale = AFFIX_SCALE[stat];
    if (scale == null) continue;
    flat[stat] = points * scale;
  }
  return flat;
}
