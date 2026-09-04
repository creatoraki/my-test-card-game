// ============================================================================
// 卡牌触发的演出录制 —— 弃牌联动与被动卡驻留效果共用的记录器与快照台账。
// ★ 单独成文件是为了打破 discard.ts ↔ passive.ts 的静态循环依赖: 两边都只依赖本模块。
// ============================================================================

import type { AnimHit, BattleState, Card, DiscardRecorder } from "./types";
import type { EffectResolution } from "./effects";
import { allIds } from "./ops";
import { fillMissingHits } from "./animHits";

let activeRecorder: DiscardRecorder | undefined;
const cardFxSnapshots = new WeakMap<BattleState, BattleState>();

// 在 fn 执行期间把 rec 设为"当前记录器" —— 深处的弃牌/被动触发不必层层传参。
export function withDiscardRecorder<T>(rec: DiscardRecorder | undefined, fn: () => T): T {
  const previous = activeRecorder;
  activeRecorder = rec;
  try {
    return fn();
  } finally {
    activeRecorder = previous;
  }
}

export function currentRecorder(rec?: DiscardRecorder): DiscardRecorder | undefined {
  return rec ?? activeRecorder;
}

// 第一次录制触发步骤之前, 存一份"触发发生前"的快照, 供 UI 先播出牌结果再播联动。
export function ensureCardFxSnapshot(state: BattleState): void {
  if (!cardFxSnapshots.has(state)) cardFxSnapshots.set(state, structuredClone(state));
}

export function takeDiscardSnapshot(state: BattleState): BattleState | undefined {
  const snapshot = cardFxSnapshots.get(state);
  cardFxSnapshots.delete(state);
  return snapshot;
}

export function snapshotHp(state: BattleState): Record<string, number> {
  const beforeHp: Record<string, number> = {};
  for (const id of allIds(state)) beforeHp[id] = state.combatants[id].hp;
  return beforeHp;
}

// 把一次卡牌触发(弃牌联动 / 自动出牌 / 被动驻留)录成一条 FxStep。
export function recordCardTrigger(
  state: BattleState,
  card: Card,
  beforeHp: Record<string, number>,
  rec: DiscardRecorder,
  resolution: EffectResolution,
  autoPlay = false,
  recorded: AnimHit[] = [],
  reveal = false,
): void {
  // 逐段明细优先(带 parts, 供 UI 飘多个数字); 记录器没覆盖到的目标(只吃护盾/状态、
  // 或 HP 经状态结算变动)再用「快照前后 HP 差」补齐, 与改造前的口径一致。
  const hits = fillMissingHits(state, beforeHp, [...recorded]);
  for (const id of allIds(state)) {
    if (hits.some((hit) => hit.id === id)) continue;
    if (resolution.missed.includes(id) && !resolution.hit.includes(id))
      hits.push({ id, hpDelta: 0, missed: true });
  }
  rec.steps.push({
    kind: "discard",
    cardUid: card.uid,
    actorId: card.ownerCharId,
    anim: card.anim,
    autoPlay,
    reveal,
    hits,
    snapshot: structuredClone(state),
  });
}
