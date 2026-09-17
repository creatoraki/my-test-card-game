import type { BattleState, DamageCtx, DamageOpts } from "../types";
import type { DamageModifiers, DamageModifierSink } from "./types";
import { runStatusHooks } from "./hooks";
import { runRelicHook } from "../relicBehaviors/types";

export function createDamageCtx(
  sourceId: string | undefined,
  targetId: string,
  amount: number,
  opts: Pick<DamageOpts, "flags" | "isAttack" | "fixed" | "single" | "guarded">,
): DamageCtx {
  return {
    sourceId,
    targetId,
    amount,
    flags: opts.flags ?? [],
    isAttack: opts.isAttack ?? false,
    fixed: opts.fixed ?? false,
    single: opts.single ?? false,
    guarded: opts.guarded ?? false,
    missed: false,
    crit: false,
    blockRolled: false,
    blocked: 0,
    hpLost: 0,
  };
}

function createSink(mods: DamageModifiers): DamageModifierSink {
  return {
    addFlat: (value) => {
      mods.flat += value;
    },
    addDealtPct: (pct) => {
      mods.dealtPct += pct;
    },
    mulDealt: (multiplier) => {
      mods.dealtMult *= multiplier;
    },
    addTakenPct: (pct) => {
      mods.takenPct += pct;
    },
    mulTaken: (multiplier) => {
      mods.takenMult *= multiplier;
    },
  };
}

// 收集施放者状态、行为遗物、目标状态登记的全部乘区。纯计算, 预览与实结算共用。
// pure 伤害不吃状态修正, 但遗物修正照常生效(沿用旧口径)。
export function collectDamageModifiers(state: BattleState, dmg: DamageCtx, pure = false): DamageModifiers {
  const mods: DamageModifiers = { flat: 0, dealtPct: 0, dealtMult: 1, takenPct: 0, takenMult: 1 };
  const sink = createSink(mods);
  if (!pure && dmg.sourceId && state.combatants[dmg.sourceId])
    runStatusHooks(state, dmg.sourceId, "modifyOutgoingDamage", dmg, sink);
  runRelicHook(state, "modifyOutgoingDamage", dmg, sink);
  if (!pure) runStatusHooks(state, dmg.targetId, "modifyIncomingDamage", dmg, sink);
  return mods;
}

export function applyDamageModifiers(base: number, mods: DamageModifiers): number {
  return (
    (base + mods.flat) *
    Math.max(0, 1 + mods.dealtPct / 100) *
    mods.dealtMult *
    Math.max(0, 1 + mods.takenPct / 100) *
    mods.takenMult
  );
}
