// 蚀刻系: 月亮(减益扩散 / 迷雾 / 降下减益) · 太阳(增益共享 / 曜光 / 降下增益) · 节制(净化 / 反施 / 逆转持续伤害)。
// 月亮与太阳刻意做成镜像结构: 一个对敌, 一个对己。

import type { BattleState, Combatant, StatusInstance } from "../../types";
import { STATUS_DEFS } from "../../core/hookRegistry";
import { applyStatus, heal, log } from "../../core/ops";
import { isStealableBuff } from "../../hexer/stealableBuff";
import type { BondBehavior } from "../types";
import {
  addDamageFlags,
  aliveAllies,
  aliveFoes,
  hpRatio,
  isAlly,
  isFoe,
  pickRandom,
  statusKindCount,
} from "../bondState";

// 通用减益 / 增益池(《羁绊重构设计文档》第四章)。层数按各状态的常用档位给。
const MOON_DEBUFFS: { id: string; stacks: number }[] = [
  { id: "weak", stacks: 1 },
  { id: "vulnerable", stacks: 1 },
  { id: "armorBreak", stacks: 1 },
  { id: "attackDown", stacks: 1 },
  { id: "blind", stacks: 1 },
];
const SUN_BUFFS: { id: string; stacks: number }[] = [
  { id: "sharp", stacks: 1 },
  { id: "ironwall", stacks: 2 },
  { id: "regen", stacks: 3 },
  { id: "thorns", stacks: 3 },
];
// 敌人行动前先走拍点, 持续 1 拍的减益会在它出手前就到期 ⇒ 敌方给 2 拍; 我方拍点在回合结束, 1 拍即本回合。
const MOON_DURATION = 2;
const SUN_DURATION = 1;

function grantMissing(state: BattleState, unit: Combatant, pool: { id: string; stacks: number }[], duration: number): string | null {
  const missing = pool.filter((entry) => !unit.statuses.some((status) => status.id === entry.id && status.stacks > 0));
  const pick = pickRandom(state, missing);
  if (!pick) return null;
  applyStatus(state, unit.id, pick.id, pick.stacks, duration);
  return STATUS_DEFS[pick.id]?.name ?? pick.id;
}

function fromOurSide(state: BattleState, sourceId: string | undefined): boolean {
  return !sourceId || isAlly(state, sourceId);
}

const moon: BondBehavior = {
  afterStatusApplied: (ctx, info) => {
    const { state } = ctx;
    const def = STATUS_DEFS[info.statusId];
    if (state.bond.round.moonSpreadUsed || !def || def.kind !== "debuff" || def.mark) return;
    if (!isFoe(state, info.targetId) || !fromOurSide(state, info.sourceId)) return;
    const other = pickRandom(state, aliveFoes(state).filter((foe) => foe.id !== info.targetId));
    if (!other) return;
    state.bond.round.moonSpreadUsed = true;
    log(state, `月亮·幻月：${def.name} 扩散到 ${other.name}`);
    applyStatus(state, other.id, info.statusId, info.stacks, info.duration, info.data, info.sourceId);
  },
  afterDamageModified: (ctx, dmg) => {
    if (ctx.tier < 2 || !dmg.isAttack || !isAlly(ctx.state, dmg.sourceId) || !isFoe(ctx.state, dmg.targetId)) return;
    const target = ctx.state.combatants[dmg.targetId];
    if (target && statusKindCount(target, "debuff") >= 3) addDamageFlags(dmg.flags, "mustHit", "noBlock");
  },
  onRoundStart: (ctx) => {
    if (ctx.tier < 3) return;
    const target = aliveFoes(ctx.state).sort((a, b) => b.hp - a.hp)[0];
    if (!target) return;
    const name = grantMissing(ctx.state, target, MOON_DEBUFFS, MOON_DURATION);
    if (name) log(ctx.state, `月亮·幻月：${target.name} 获得 ${name}`);
  },
};

const sun: BondBehavior = {
  afterStatusApplied: (ctx, info) => {
    const { state } = ctx;
    const target = state.combatants[info.targetId];
    if (state.bond.round.sunSpreadUsed || !target || target.team !== "player" || !fromOurSide(state, info.sourceId)) return;
    const inst = target.statuses.find((status) => status.id === info.statusId);
    if (!inst || !isStealableBuff(inst)) return;
    const other = aliveAllies(state)
      .filter((ally) => ally.id !== target.id)
      .sort((a, b) => hpRatio(a) - hpRatio(b))[0];
    if (!other) return;
    state.bond.round.sunSpreadUsed = true;
    log(state, `太阳·正午：${STATUS_DEFS[info.statusId]?.name ?? info.statusId} 共享给 ${other.name}`);
    applyStatus(state, other.id, info.statusId, info.stacks, info.duration, info.data, info.sourceId);
  },
  afterDamageModified: (ctx, dmg) => {
    if (ctx.tier < 2 || !dmg.isAttack || !isAlly(ctx.state, dmg.sourceId) || !isFoe(ctx.state, dmg.targetId)) return;
    const source = ctx.state.combatants[dmg.sourceId!];
    if (source && statusKindCount(source, "buff") >= 2) addDamageFlags(dmg.flags, "mustHit", "noBlock");
  },
  onRoundStart: (ctx) => {
    if (ctx.tier < 3) return;
    const target = aliveAllies(ctx.state).sort((a, b) => hpRatio(a) - hpRatio(b))[0];
    if (!target) return;
    const name = grantMissing(ctx.state, target, SUN_BUFFS, SUN_DURATION);
    if (name) log(ctx.state, `太阳·正午：${target.name} 获得 ${name}`);
  },
};

// 全队身上可被净化的减益里, 剩余持续最短的那一个。
function shortestAllyDebuff(state: BattleState): { unit: Combatant; inst: StatusInstance } | null {
  let best: { unit: Combatant; inst: StatusInstance } | null = null;
  for (const unit of aliveAllies(state)) {
    for (const inst of unit.statuses) {
      const def = STATUS_DEFS[inst.id];
      if (inst.stacks <= 0 || def?.kind !== "debuff" || def.mark || def.undispellable) continue;
      if (!best || (inst.duration ?? Infinity) < (best.inst.duration ?? Infinity)) best = { unit, inst };
    }
  }
  return best;
}

const temperance: BondBehavior = {
  onRoundStart: (ctx) => {
    const { state } = ctx;
    const found = shortestAllyDebuff(state);
    if (!found) return;
    const { unit, inst } = found;
    unit.statuses = unit.statuses.filter((status) => status !== inst);
    const name = STATUS_DEFS[inst.id]?.name ?? inst.id;
    log(state, `节制·调和：移除 ${unit.name} 的${name}`);
    if (ctx.tier < 2) return;
    const foe = pickRandom(state, aliveFoes(state));
    if (foe) applyStatus(state, foe.id, inst.id, inst.stacks, inst.duration, inst.data, unit.id);
  },
  beforeHpLoss: (ctx, dmg) => {
    const { state } = ctx;
    const round = state.bond.round;
    if (ctx.tier < 3 || !dmg.dot || !isAlly(state, dmg.targetId) || round.temperanceDot.includes(dmg.targetId)) return;
    round.temperanceDot.push(dmg.targetId);
    const amount = dmg.amount;
    dmg.amount = 0;
    log(state, "节制·调和：持续伤害逆转为治疗");
    heal(state, undefined, dmg.targetId, amount);
  },
};

export const ETCH_BOND_BEHAVIORS: Record<string, BondBehavior> = { moon, sun, temperance };
