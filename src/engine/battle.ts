// ============================================================================
// 战斗编排 —— 公开的高层操作: createBattle / playCard / endRound。
// 所有函数直接修改传入的 BattleState(store 层负责克隆后再调用, 保证不可变更新)。
// ============================================================================

import type { AnimFrame, Ally, BattleState, Card, Combatant, Enemy } from "./types";
import { RULES } from "./rules";
import { shuffle } from "./rng";
import { allIds, checkEnd, log, runRoundEnd, runRoundStart } from "./ops";
import { drawCards } from "./deck";
import { resolveEffects } from "./effects";
import { actAndRecord, buildIntent } from "./ai";
import { advanceTick } from "./scheduler";
import { getEncounter, getEnemyDef } from "../data";

// 出牌记录器: 收集出牌后触发的敌人行动动画帧, 并回传"出牌后/敌人行动前"的快照。
export interface PlayRecorder {
  frames: AnimFrame[];
  cardSnapshot?: BattleState;
}

export interface AllyInit {
  id: string;
  charId: string;
  name: string;
  emoji: string;
  maxHp: number;
  threat?: number;
  attack?: number; // 攻击加成(缺省 0)
  defense?: number; // 防御加成(缺省 0)
}

export interface BattleSetup {
  allies: AllyInit[];
  deck: Card[]; // 运行期卡牌实例(带 uid)
}

// ---------------------------------------------------------------------------
// 建立一场战斗
// ---------------------------------------------------------------------------
export function createBattle(encounterId: string, setup: BattleSetup, seed?: number): BattleState {
  const enc = getEncounter(encounterId);
  const combatants: Record<string, Combatant> = {};
  const playerIds: string[] = [];
  const enemyIds: string[] = [];

  for (const a of setup.allies) {
    const ally: Ally = {
      id: a.id,
      charId: a.charId,
      name: a.name,
      emoji: a.emoji,
      team: "player",
      hp: a.maxHp,
      maxHp: a.maxHp,
      block: 0,
      statuses: [],
      alive: true,
      threat: a.threat ?? RULES.aggro.baseThreat,
      attack: a.attack ?? 0,
      defense: a.defense ?? 0,
    };
    combatants[a.id] = ally;
    playerIds.push(a.id);
  }

  // 统计同名敌人以便加后缀区分
  const defCounts: Record<string, number> = {};
  for (const defId of enc.enemies) defCounts[defId] = (defCounts[defId] ?? 0) + 1;
  const defSeen: Record<string, number> = {};

  enc.enemies.forEach((defId, i) => {
    const def = getEnemyDef(defId);
    const id = `${defId}#${i}`;
    const suffix = defCounts[defId] > 1 ? ` ${String.fromCharCode(65 + (defSeen[defId] ?? 0))}` : "";
    defSeen[defId] = (defSeen[defId] ?? 0) + 1;
    const enemy: Enemy = {
      id,
      enemyDefId: defId,
      name: def.name + suffix,
      emoji: def.emoji,
      team: "enemy",
      hp: def.maxHp,
      maxHp: def.maxHp,
      block: 0,
      statuses: [],
      alive: true,
      castTick: def.castTick,
      nextActTick: 0,
      actsThisRound: 0,
      aiIndex: 0,
      intent: { moveId: "", name: "", emoji: "", kind: "special" },
    };
    combatants[id] = enemy;
    enemyIds.push(id);
  });

  const cards: Record<string, Card> = {};
  for (const c of setup.deck) cards[c.uid] = c;

  const state: BattleState = {
    encounterId,
    round: 0,
    tick: 0,
    phase: "player",
    combatants,
    playerIds,
    enemyIds,
    cards,
    draw: [],
    hand: [],
    discard: [],
    exhaust: [],
    redrawsThisRound: 0,
    resources: {},
    rngState: (seed ?? (Date.now() & 0xffffffff)) >>> 0,
    log: [],
  };

  state.draw = shuffle(state, Object.keys(cards));
  log(state, `⚔️ 遭遇战: ${enc.name}`);
  startRound(state);
  return state;
}

// ---------------------------------------------------------------------------
// 回合开始
// ---------------------------------------------------------------------------
export function startRound(state: BattleState): void {
  state.round += 1;
  state.tick = RULES.timeline.startTick;
  state.redrawsThisRound = 0;
  log(state, `—— 第 ${state.round} 回合(第 ${state.tick} 时刻)——`);

  if (RULES.combat.clearBlockOnRoundStart) {
    for (const id of allIds(state)) state.combatants[id].block = 0;
  }

  const rn = RULES.resource.name;
  state.resources[rn] = RULES.resource.perRound + (RULES.resource.carryOver ? state.resources[rn] ?? 0 : 0);

  for (const id of state.enemyIds) {
    const e = state.combatants[id] as Enemy;
    if (!e.alive) continue;
    e.actsThisRound = 0;
    e.nextActTick = state.tick + Math.max(1, e.castTick);
    buildIntent(state, id);
  }

  if (RULES.hand.drawToFullEachRound) drawCards(state, RULES.hand.size - state.hand.length);

  runRoundStart(state); // 中毒/再生等在回合开始结算
  checkEnd(state);
}

// ---------------------------------------------------------------------------
// 打出一张牌
// ---------------------------------------------------------------------------
function isValidPrimary(state: BattleState, card: Card, primaryId?: string): boolean {
  if (!primaryId) return false;
  const t = state.combatants[primaryId];
  if (!t || !t.alive) return false;
  if (card.targeting === "foe") return t.team === "enemy";
  if (card.targeting === "ally") return t.team === "player";
  return true;
}

export function canPlay(state: BattleState, uid: string): boolean {
  const card = state.cards[uid];
  if (!card || state.phase !== "player" || !state.hand.includes(uid)) return false;
  const owner = state.combatants[card.ownerCharId];
  if (!owner || !owner.alive) return false;
  return (state.resources[RULES.resource.name] ?? 0) >= card.cost;
}

export function redrawHandCard(state: BattleState, uid: string): boolean {
  if (state.phase !== "player" || state.redrawsThisRound >= 1 || !state.hand.includes(uid)) return false;
  const card = state.cards[uid];
  if (!card) return false;

  state.hand = state.hand.filter((id) => id !== uid);
  state.discard.push(uid);
  state.redrawsThisRound += 1;
  drawCards(state, 1);
  log(state, `${card.name} 已换牌`);
  return true;
}

export function discardHandCard(state: BattleState, uid: string): boolean {
  if (state.phase !== "player" || !state.hand.includes(uid)) return false;
  const card = state.cards[uid];
  if (!card) return false;

  state.hand = state.hand.filter((id) => id !== uid);
  state.discard.push(uid);
  log(state, `${card.name} 已丢弃`);
  return true;
}

export function playCard(
  state: BattleState,
  uid: string,
  primaryId?: string,
  rec?: PlayRecorder,
): boolean {
  if (!canPlay(state, uid)) return false;
  const card = state.cards[uid];
  const owner = state.combatants[card.ownerCharId];
  if ((card.targeting === "foe" || card.targeting === "ally") && !isValidPrimary(state, card, primaryId))
    return false;

  state.resources[RULES.resource.name] -= card.cost;
  state.hand = state.hand.filter((x) => x !== uid);
  log(state, `${owner.emoji} ${owner.name} 打出 ${card.name}`);
  resolveEffects(state, card.effects, card.ownerCharId, primaryId);

  if (card.exhaust) state.exhaust.push(uid);
  else state.discard.push(uid);

  checkEnd(state);

  // 记录"出牌结算后、敌人行动前"的快照, 供 UI 先展示出牌结果再逐个播放敌人行动。
  if (rec) rec.cardSnapshot = structuredClone(state);

  if (state.phase === "player") {
    const adv =
      card.cardType === "normal" ? RULES.timeline.normalCardAdvance : RULES.timeline.fastCardAdvance;
    if (adv > 0) advanceTick(state, adv, rec?.frames);
  }
  return true;
}

// ---------------------------------------------------------------------------
// 结束回合
// ---------------------------------------------------------------------------
export function endRound(state: BattleState, frames?: AnimFrame[]): void {
  if (state.phase !== "player") return;

  // 冲刷: 本回合还没行动过的存活敌人各补一次行动
  if (RULES.timeline.flushEnemiesOnRoundEnd) {
    const pending = state.enemyIds
      .map((id) => state.combatants[id] as Enemy)
      .filter((e) => e.alive && e.actsThisRound === 0);
    for (const e of pending) {
      if (!e.alive || state.phase !== "player") break;
      actAndRecord(state, e.id, frames); // 内部已重排 nextActTick
      checkEnd(state);
      if (state.phase !== "player") return;
    }
  }
  if (state.phase !== "player") return;

  runRoundEnd(state); // 虚弱/易伤 -1 等
  checkEnd(state);
  if (state.phase !== "player") return;

  if (RULES.hand.discardLeftoversOnRoundEnd) {
    state.discard.push(...state.hand);
    state.hand = [];
  }
  startRound(state);
}
