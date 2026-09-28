// 组装效果 —— 从 effects.ts 拆出的组装 BUFF 获得、移除与释放。
// ⚠ resolve 由调用方注入(effects.ts / battleChoices.ts), 本文件不直接 import resolveEffects, 避免运行时环。

import type { BattleState, EffectDescriptor } from "../types";
import type { ResolveEffectsFn } from "./effects";
import { ops } from "../core/ops";
import { rngPick } from "../core/rng";
import {
  ASSEMBLE_IDS,
  SQUAD_BUFF_DEFS,
  consumeAllSquadBuffs,
  gainSquadBuff,
  missingAssembleIds,
  purifyAssembly,
  removeRandomSquadBuff,
  squadBuffIds,
  type AssembleId,
} from "../combat/squadBuff";

// 释放: 按组装 BUFF 的字母结算一次即时效果。数值口径见《改版方案/01-机制与状态.md》1.2。
export const ASSEMBLE_RELEASE_EFFECTS: Record<AssembleId, EffectDescriptor[]> = {
  assembleA: [
    { type: "APPLY_STATUS", status: "burn", stacksFromStat: { stat: "attack", multiplier: 0.3 }, duration: 2, target: "randomFoe" },
  ],
  assembleB: [{ type: "GAIN_SHIELD", multiplier: 0.4, target: "lowestHpAlly" }],
  assembleC: [
    { type: "APPLY_STATUS", status: "poison", stacksFromStat: { stat: "attack", multiplier: 0.15 }, duration: 2, target: "allFoes" },
  ],
  assembleD: [{ type: "RESONATE", amount: 1, resonatePick: "handAll" }],
};

export function releaseSquadBuff(
  state: BattleState,
  id: AssembleId,
  times: number,
  sourceId: string,
  resolve: ResolveEffectsFn,
): void {
  const count = Math.max(0, Math.floor(times));
  if (count <= 0 || !state.combatants[sourceId]) return;
  ops.log(state, `释放 ${SQUAD_BUFF_DEFS[id].name}${count > 1 ? ` × ${count}` : ""}`);
  for (let i = 0; i < count; i++) resolve(state, ASSEMBLE_RELEASE_EFFECTS[id], sourceId, undefined);
}

function applyGain(state: BattleState, effect: EffectDescriptor): void {
  if (effect.squadBuffPick === "choose") {
    if (!state.pendingChoice)
      state.pendingChoice = { kind: "pickSquadBuff", options: [...ASSEMBLE_IDS] };
    return;
  }
  if (effect.squadBuffPick === "purify") {
    purifyAssembly(state);
    return;
  }
  if (effect.squadBuffPick === "randomMissing") {
    const missing = missingAssembleIds(state);
    if (missing.length > 0) gainSquadBuff(state, rngPick(state, missing));
    return;
  }
  if (effect.squadBuff) gainSquadBuff(state, effect.squadBuff);
}

function applyRemove(state: BattleState, effect: EffectDescriptor): void {
  if (effect.squadBuffPick === "all") consumeAllSquadBuffs(state);
  else if (effect.squadBuffPick === "random") removeRandomSquadBuff(state);
  else if (effect.squadBuffPick === "choose") {
    const owned = squadBuffIds(state);
    if (owned.length > 0 && !state.pendingChoice)
      state.pendingChoice = { kind: "pickSquadBuff", options: [...owned], mode: "remove" };
  }
}

// 释放: choose = 玩家选 1 种移除并释放; random = 随机 1 种(keepSquadBuff 时不移除);
// all = 消耗全部(不触发组装成功), 每种释放 amount 次。
function applyRelease(state: BattleState, effect: EffectDescriptor, sourceId: string, resolve: ResolveEffectsFn): void {
  const times = Math.max(1, Math.floor(effect.amount ?? 1));
  const owned = squadBuffIds(state);
  if (owned.length === 0) return;
  if (effect.squadBuffPick === "choose") {
    if (!state.pendingChoice)
      state.pendingChoice = { kind: "pickSquadBuff", options: [...owned], mode: "release", sourceId };
    return;
  }
  if (effect.squadBuffPick === "all") {
    const consumed = consumeAllSquadBuffs(state);
    for (const id of consumed) releaseSquadBuff(state, id, times, sourceId, resolve);
    return;
  }
  const id = rngPick(state, owned);
  if (!effect.keepSquadBuff) state.squadBuffs = state.squadBuffs.filter((entry) => entry.id !== id);
  releaseSquadBuff(state, id, times, sourceId, resolve);
}

export function applyAssembleEffect(
  state: BattleState,
  effect: EffectDescriptor,
  sourceId: string,
  resolve: ResolveEffectsFn,
): void {
  if (effect.type === "GAIN_SQUAD_BUFF") applyGain(state, effect);
  else if (effect.type === "REMOVE_SQUAD_BUFF") applyRemove(state, effect);
  else if (effect.type === "RELEASE_SQUAD_BUFF") applyRelease(state, effect, sourceId, resolve);
}
