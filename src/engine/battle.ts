// ============================================================================
// 战斗编排 —— 公开的高层操作: createBattle / playCard / endRound。
// 所有函数直接修改传入的 BattleState(store 层负责克隆后再调用, 保证不可变更新)。
// ============================================================================

import type {
  AnimFrame,
  Ally,
  BattleState,
  Card,
  Combatant,
  EncounterModifier,
  Enemy,
  StatBlock,
} from "./types";
import { RULES } from "./rules";
import { enemyActDelay, makeStats, partyDrawCount, partyHandLimit, partyOpeningDrawCount } from "./stats";
import { shuffle } from "./rng";
import { allIds, applyStatus, checkEnd, log, runRoundEnd, runRoundStart } from "./ops";
import { drawCards } from "./deck";
import { resolveEffects } from "./effects";
import { actAndRecord, buildIntent } from "./ai";
import { advanceTick } from "./scheduler";
import { getEncounter, getEnemyDef, slotDefId } from "../data";

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
  // ★ 局外已结算完的面板(角色基础 + 装备)。由 store 层通过 townStore.deriveStats 产出。
  stats: StatBlock;
  // 开局生命。缺省 = stats.maxHp; 探索模式传入上一场战斗继承下来的血量 ——
  // 「血量跨战斗继承」是探索牌局的地基, 没有它「休整」与「撤退」都不成为决策。
  startHp?: number;
}

export interface BattleSetup {
  allies: AllyInit[];
  deck: Card[]; // 运行期卡牌实例(带 uid)
  // ★ 开战瞬间的负重惩罚(百分点), 由探索层算好传入(engine/stats.burdenPenalty)。
  //   引擎不认识背包与占格, 只认识这一个数。缺省 0 —— 城镇试打与单元测试都走这条。
  burdenPenalty?: number;
}

// ---------------------------------------------------------------------------
// 建立一场战斗
// ---------------------------------------------------------------------------
export function createBattle(
  encounterId: string,
  setup: BattleSetup,
  seed?: number,
  mod?: EncounterModifier,
): BattleState {
  const enc = getEncounter(encounterId);
  const combatants: Record<string, Combatant> = {};
  const playerIds: string[] = [];
  const enemyIds: string[] = [];

  for (const a of setup.allies) {
    const maxHp = Math.max(1, Math.round(a.stats.maxHp));
    const ally: Ally = {
      id: a.id,
      charId: a.charId,
      name: a.name,
      emoji: a.emoji,
      team: "player",
      hp: Math.max(1, Math.min(maxHp, a.startHp ?? maxHp)),
      maxHp,
      shield: 0,
      stats: a.stats,
      mods: {},
      statuses: [],
      alive: true,
    };
    combatants[a.id] = ally;
    playerIds.push(a.id);
  }

  // 槽位可以是裸 id 或带站位的对象; 站位是纯表现, 引擎只取 def id(见 data/encounters.ts)
  // 改造器追加的敌人排在原有敌人之后 ⇒ 不影响 encounters.ts 里手工调好的站位下标。
  const defIds = [...enc.enemies.map(slotDefId), ...(mod?.extraEnemies ?? [])];
  const hpMul = mod?.hpMultiplier ?? 1;

  // 统计同名敌人以便加后缀区分
  const defCounts: Record<string, number> = {};
  for (const defId of defIds) defCounts[defId] = (defCounts[defId] ?? 0) + 1;
  const defSeen: Record<string, number> = {};

  defIds.forEach((defId, i) => {
    const def = getEnemyDef(defId);
    const id = `${defId}#${i}`;
    const suffix = defCounts[defId] > 1 ? ` ${String.fromCharCode(65 + (defSeen[defId] ?? 0))}` : "";
    defSeen[defId] = (defSeen[defId] ?? 0) + 1;
    const maxHp = Math.max(1, Math.round(def.maxHp * hpMul));
    const enemy: Enemy = {
      id,
      enemyDefId: defId,
      name: def.name + suffix,
      emoji: def.emoji,
      team: "enemy",
      hp: maxHp,
      maxHp,
      shield: 0,
      stats: makeStats({ ...def.stats, maxHp }),
      mods: {},
      statuses: [],
      alive: true,
      castTick: Math.max(1, def.castTick + (mod?.castTickDelta ?? 0)),
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
    burdenPenalty: Math.max(0, setup.burdenPenalty ?? 0),
    rngState: (seed ?? (Date.now() & 0xffffffff)) >>> 0,
    log: [],
  };

  state.draw = shuffle(state, Object.keys(cards));
  log(state, `⚔️ 遭遇战: ${enc.name}`);

  // 开局状态必须在 startRound 之前施加 —— startRound 会 buildIntent, 而意图预览要吃到力量加成。
  for (const st of mod?.enemyStatuses ?? []) {
    for (const id of enemyIds) applyStatus(state, id, st.id, st.stacks);
  }

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

  if (RULES.combat.clearShieldOnRoundStart) {
    for (const id of allIds(state)) state.combatants[id].shield = 0;
  }

  const rn = RULES.resource.name;
  state.resources[rn] = RULES.resource.perRound + (RULES.resource.carryOver ? state.resources[rn] ?? 0 : 0);

  for (const id of state.enemyIds) {
    const e = state.combatants[id] as Enemy;
    if (!e.alive) continue;
    e.actsThisRound = 0;
    // ★ 先手: 行动时刻 = max(1, 技能延迟 + 我方先手均值 − 敌方先手)
    e.nextActTick = state.tick + enemyActDelay(state, e, e.castTick);
    buildIntent(state, id);
  }

  // 第 1 回合抽开局张数(5), 之后每回合抽小队抽牌数(2), 均抽到手牌上限为止。
  const limit = partyHandLimit(state);
  const want = state.round === 1 ? partyOpeningDrawCount(state) : partyDrawCount(state);
  drawCards(state, Math.max(0, Math.min(want, limit - state.hand.length)));

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
