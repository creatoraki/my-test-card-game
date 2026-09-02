// ============================================================================
// 战斗编排 —— 公开的高层操作: createBattle / playCard / endRound。
// 所有函数直接修改传入的 BattleState(store 层负责克隆后再调用, 保证不可变更新)。
// ============================================================================

import type {
  Ally,
  AnimHit,
  BattleState,
  Card,
  Combatant,
  EncounterModifier,
  Enemy,
  FxRecorder,
  StatBlock,
} from "./types";
import type { QuirkId } from "./quirks";
import { RULES } from "./rules";
import {
  addMod,
  makeStats,
  partyDrawCount,
  partyHandLimit,
  partyManaPerRound,
  partyOpeningDrawCount,
  partyRedrawLimit,
  partyWaitLimit,
} from "./stats";
import { shuffle } from "./rng";
import { applyStatus, checkEnd, log, ops } from "./ops";
import { STATUS_DEFS } from "./statuses";
import { allyTempoIds, runAllyTempo, runOwnerTempo } from "./statusLifecycle";
import { drawCards } from "./deck";
import { resolveEffects } from "./effects";
import { cardCost, manaCostOf, starlightPayment } from "./cost";
import { startCharge } from "./ai";
import { advanceTick, flushPendingActs } from "./scheduler";

const isTest = import.meta.env.isTest === "true";
import {
  checkChallengesOnEndTurn,
  checkMassacreOnRoundSettle,
  noteChallengePlay,
  noteChallengeRedraw,
  rollChallenges,
} from "./challenges";
import { getEncounter, getEnemyDef, slotDefId } from "../data";
import { flushAutoPlays, moveToDiscard, takeDiscardSnapshot, withDiscardRecorder } from "./discard";
import { KEYWORD_DEFS } from "./keywords";
import { CARD_MARK_DEFS } from "./cardMarks";
import { isPassive, playableHandUids, recycleHandPassives } from "./passive";
import { cultivateReady, resetCultivate, tickCultivate } from "./cultivate";
import { withHitRecorder } from "./animHits";

// 出牌记录器: 收集出牌后触发的敌人行动动画帧, 并回传"出牌后/敌人行动前"的快照。
export interface PlayRecorder {
  steps: FxRecorder["steps"];
  cardMissedTargets: string[];
  cardSnapshot?: BattleState;
  // 本次出牌真实影响到的单位与逐段明细(见 animHits.ts)。UI 据此飘字与播音效 ——
  // 不要再从卡牌定义反推目标: lowestHpAlly / randomAlly / 培育追加效果都推不出来。
  cardHits?: AnimHit[];
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
  startHpLimit?: number;
  pollution?: number;
  sick?: boolean;
  quirks?: QuirkId[];
}

export interface BattleSetup {
  allies: AllyInit[];
  deck: Card[]; // 运行期卡牌实例(带 uid)
  // ★ 开战瞬间的有效负重点数, 由探索层算好传入(engine/stats.burdenValue)。
  //   引擎不认识背包与占格, 只认识这一个数。缺省 0 —— 城镇试打与单元测试都走这条。
  burden?: number;
  squadMods?: import("./types").SquadResourceMods;
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
    const hpLimit = Math.max(1, Math.min(maxHp, Math.round(a.startHpLimit ?? maxHp)));
    const ally: Ally = {
      id: a.id,
      charId: a.charId,
      name: a.name,
      emoji: a.emoji,
      team: "player",
      hp: Math.max(0, Math.min(maxHp, a.startHp ?? maxHp)),
      hpLimit,
      maxHp,
      shield: 0,
      stats: a.stats,
      mods: {},
      statuses: [],
      alive: true,
      tempo: 0,
      pollution: Math.max(0, Math.min(99, Math.round(a.pollution ?? 0))),
      sick: a.sick ?? false,
      quirks: [...(a.quirks ?? [])],
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
    const maxHp = isTest ? 1 : Math.max(1, Math.round(def.maxHp * hpMul));
    const enemy: Enemy = {
      id,
      enemyDefId: defId,
      name: def.name + suffix,
      emoji: def.emoji,
      team: "enemy",
      hp: maxHp,
      hpLimit: maxHp,
      maxHp,
      shield: 0,
      stats: makeStats({ ...def.stats, maxHp }),
      mods: {},
      statuses: [],
      alive: true,
      tempo: 0,
      moveDelayDelta: mod?.moveDelayDelta ?? 0,
      nextActTick: null,
      actsPerRound: Math.max(1, def.actsPerRound ?? 1),
      actsThisRound: 0,
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
    waitsThisRound: 0,
    discardsThisRound: 0,
    playedThisRound: [],
    lastPlayedCard: null,
    discardResolving: [],
    resources: {},
    burden: Math.max(0, setup.burden ?? 0),
    squadMods: {
      openingHand: 0,
      drawCount: 0,
      redraws: 0,
      waits: 0,
      mana: 0,
      handLimit: 0,
      ...(setup.squadMods ?? {}),
    },
    challenges: [],
    challengeKillRound: null,
    challengeFocusTargetId: null,
    challengeEnemyActRound: null,
    rngState: (seed ?? (Date.now() & 0xffffffff)) >>> 0,
    log: [],
    lastDiscardBatch: 0,
    discardsThisBattle: 0,
    lastDiscardBatchFast: 0,
    lastRecoverBatchFast: 0,
    pendingChoice: null,
    pendingAutoPlays: [],
    waterfallPlay: false,
    playValueBonusPct: 0,
    playStatMods: [],
    activeCardCost: null,
    activeCardStacks: 0,
    passiveEventCardUid: null,
    lastDiscardBatchCost: 0,
    lastConvertBatch: 0,
  };

  state.draw = shuffle(state, Object.keys(cards));
  state.challenges = rollChallenges(state);
  log(state, `⚔️ 遭遇战: ${enc.name}`);

  // 开局状态必须在 startRound 之前施加 —— startRound 会抽招, 而意图预览要吃到力量加成。
  for (const st of mod?.enemyStatuses ?? []) {
    for (const id of enemyIds) applyStatus(state, id, st.id, st.stacks, st.duration);
  }

  startRound(state);
  return state;
}

// ---------------------------------------------------------------------------
// 回合开始
// ---------------------------------------------------------------------------
// 我方存活单位身上带 onRoundStart 的状态各触发一次。
function runRoundStartHooks(state: BattleState): void {
  for (const id of state.playerIds) {
    const unit = state.combatants[id];
    if (!unit?.alive) continue;
    for (const inst of [...unit.statuses]) {
      const hook = STATUS_DEFS[inst.id]?.hooks?.onRoundStart;
      if (hook) hook({ state, ownerId: id, inst, stacks: inst.stacks, ops });
    }
  }
}

export function startRound(state: BattleState): void {
  state.round += 1;
  state.tick = RULES.timeline.startTick;
  tickCultivate(state);
  state.redrawsThisRound = 0;
  state.waitsThisRound = 0;
  state.challengeFocusTargetId = null;
  state.discardsThisRound = 0;
  state.lastDiscardBatch = 0;
  state.lastDiscardBatchFast = 0;
  state.lastRecoverBatchFast = 0;
  state.lastDiscardBatchCost = 0;
  state.lastConvertBatch = 0;
  state.pendingAutoPlays = [];
  state.waterfallPlay = false;
  state.playedThisRound = [];
  state.lastPlayedCard = null;
  log(state, `—— 第 ${state.round} 回合(第 ${state.tick} 时刻)——`);

  const rn = RULES.resource.name;
  state.resources[rn] = partyManaPerRound(state) + (RULES.resource.carryOver ? state.resources[rn] ?? 0 : 0);

  for (const id of state.enemyIds) {
    const e = state.combatants[id] as Enemy;
    if (!e.alive) continue;
    e.actsThisRound = 0;
    startCharge(state, id);
  }

  // 状态的回合开始钩子(罗生门等)。★ 必须排在抽牌之前 —— 它们大多是"回合开始时抽牌"。
  runRoundStartHooks(state);

  // 第 1 回合抽开局张数(5), 之后每回合抽小队抽牌数(2), 均抽到手牌上限为止。
  const limit = partyHandLimit(state);
  const want = state.round === 1 ? partyOpeningDrawCount(state) : partyDrawCount(state);
  drawCards(state, Math.max(0, Math.min(want, limit - state.hand.length)));

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

// null = 可以打；mana = 只差法力；other = 结构性不可用。
export type PlayBlock = null | "mana" | "other";

export function playBlockReason(state: BattleState, uid: string): PlayBlock {
  const card = state.cards[uid];
  if (!card || state.phase !== "player" || !state.hand.includes(uid)) return "other";
  if (isPassive(card)) return "other"; // 被动卡不可打出, 只在手中生效
  const owner = state.combatants[card.ownerCharId];
  if (!owner || !owner.alive) return "other";
  if (owner.statuses.some((status) => status.id === "stun" && status.stacks > 0)) return "other";
  if (state.pendingChoice) return "other";
  return (state.resources[RULES.resource.name] ?? 0) >= manaCostOf(state, card) ? null : "mana";
}

export function canPlay(state: BattleState, uid: string): boolean {
  return playBlockReason(state, uid) === null;
}

export function redrawHandCard(state: BattleState, uid: string): boolean {
  if (
    state.pendingChoice ||
    state.phase !== "player" ||
    state.redrawsThisRound >= partyRedrawLimit(state) ||
    !state.hand.includes(uid)
  )
    return false;
  const card = state.cards[uid];
  if (!card) return false;

  moveToDiscard(state, uid, "redraw");
  state.redrawsThisRound += 1;
  drawCards(state, 1);
  noteChallengeRedraw(state);
  log(state, `${card.name} 已换牌`);
  return true;
}

// 待机: 什么都不做, 只推进时刻 —— 敌人因此可能走到行动点。每回合限 partyWaitLimit 次。
export function waitTick(state: BattleState, rec?: FxRecorder): boolean {
  if (state.pendingChoice || state.phase !== "player" || state.waitsThisRound >= partyWaitLimit(state)) return false;
  state.waitsThisRound += 1;
  log(state, `⏳ 待机 —— 推进 ${RULES.timeline.waitAdvance} 时刻`);
  withDiscardRecorder(rec, () => advanceTick(state, RULES.timeline.waitAdvance, rec));
  return true;
}

export function discardHandCard(state: BattleState, uid: string, rec?: FxRecorder): boolean {
  if (state.pendingChoice || state.phase !== "player" || !state.hand.includes(uid)) return false;
  const card = state.cards[uid];
  if (!card) return false;

  moveToDiscard(state, uid, "manual", rec);
  log(state, `${card.name} 已丢弃`);
  flushAutoPlays(state, rec);
  checkEnd(state);
  return true;
}

// 撤回本次出牌期间写进面板的 PLAY_STAT_BONUS。★ 逐条按相反数写回 mods 再清台账,
// 与写入端严格对称 —— 出牌开始与出牌结束各调一次(后者兜底异常路径)。
function revertPlayStatMods(state: BattleState): void {
  for (const entry of state.playStatMods) {
    const target = state.combatants[entry.targetId];
    if (target) addMod(target, entry.stat, -entry.amount, entry.pct);
  }
  state.playStatMods = [];
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

  const faceCost = cardCost(state, card);
  const starPayment = starlightPayment(state, card);
  const manaPayment = faceCost - starPayment;
  // 瀑布只看"能打出的手牌" —— 被动卡无费用, 不参与任何费用比较。
  state.waterfallPlay = playableHandUids(state)
    .filter((handUid) => handUid !== uid)
    .every((handUid) => card.cost > (state.cards[handUid]?.cost ?? 0));
  if (starPayment > 0) applyStatus(state, owner.id, "starlight", -starPayment);
  state.resources[RULES.resource.name] -= manaPayment;
  state.hand = state.hand.filter((x) => x !== uid);
  log(state, `${owner.emoji} ${owner.name} 打出 ${card.name}`);
  const discardRecorder = rec;
  const cardMissed = new Set<string>();
  const cardHit = new Set<string>();
  const mergeCardResolution = (resolution: ReturnType<typeof resolveEffects>) => {
    resolution.missed.forEach((id) => cardMissed.add(id));
    resolution.hit.forEach((id) => cardHit.add(id));
  };
  // 本次出牌真实打到/治到了谁, 每个目标分了几段 —— 逐段由 ops.dealDamage / ops.heal 上报。
  // ⚠ 刻意不做「快照前后 HP 差」的兜底扫描: 弃牌联动与自动出牌在结算过程中也会改 HP,
  //   而它们各自会产出独立的动画步(见 discard.ts), 兜底扫描会让同一笔伤害飘两次。
  //   引擎里 HP 的写入口只有 dealDamage / heal(markDead 与 maxHp 修正除外), 记录器已经全覆盖。
  const cardHits = withHitRecorder(() => {
    withDiscardRecorder(discardRecorder, () => {
      state.playValueBonusPct = 0;
      revertPlayStatMods(state);
      state.activeCardCost = faceCost;
      state.activeCardStacks = card.discardStacks ?? 0;
      try {
        const cultivated = cultivateReady(card);
        const cultivateMode = card.cultivate?.mode ?? "append";
        const activeEffects = cultivated && cultivateMode === "replace" ? card.cultivate!.effects : card.effects;
        mergeCardResolution(resolveEffects(state, activeEffects, card.ownerCharId, primaryId));

        if (cultivated && cultivateMode !== "replace")
          mergeCardResolution(resolveEffects(state, card.cultivate!.effects, card.ownerCharId, primaryId));
        resetCultivate(card);

        if (card.exhaust) state.exhaust.push(uid);
        else moveToDiscard(state, uid, "play");

        for (const ref of card.keywords ?? []) {
          const def = KEYWORD_DEFS[ref.id];
          if (!def) continue;
          const ctx = { primaryId, hitIds: [...cardHit] };
          const times = def.triggers(state, card, ctx);
          for (let i = 0; i < times; i++)
            mergeCardResolution(resolveEffects(state, ref.effects, card.ownerCharId, primaryId));
          def.onTriggered?.(state, card, ctx, times);
        }
        for (const markId of card.marks ?? []) {
          const mark = CARD_MARK_DEFS[markId];
          if (mark) mergeCardResolution(resolveEffects(state, mark.effects, card.ownerCharId, primaryId));
        }
        card.marks = [];
        card.discardStacks = 0; // 累计层数只在"未打出"期间有效, 打出即清零
        state.waterfallPlay = false;
        state.playValueBonusPct = 0;
        // ⚠ 必须在 flushAutoPlays 之前撤回: 自动出牌是另一张牌的结算, 不该继承本卡的临时面板。
        revertPlayStatMods(state);
        if (rec) rec.cardMissedTargets = [...cardMissed].filter((id) => !cardHit.has(id));
        flushAutoPlays(state, rec);
      } finally {
        state.activeCardCost = null;
        state.activeCardStacks = 0;
      }
    });
  });
  // 只吃护盾/状态、没有 HP 变化的目标不在这里补 —— 它们由 UI 侧的 fxTargets 兜底闪特效。
  if (rec) rec.cardHits = cardHits;

  const played = {
    uid: card.uid,
    cost: faceCost,
    cardType: card.cardType,
    ownerCharId: card.ownerCharId,
  };
  state.lastPlayedCard = played;
  state.playedThisRound.push(played);
  noteChallengePlay(state, card, faceCost);

  checkEnd(state);

  // 记录"出牌结算后、敌人行动前"的快照, 供 UI 先展示出牌结果再逐个播放敌人行动。
  if (rec) rec.cardSnapshot = takeDiscardSnapshot(state) ?? structuredClone(state);

  if (state.phase === "player") {
    const adv =
      card.cardType === "normal" ? RULES.timeline.normalCardAdvance : RULES.timeline.fastCardAdvance;
    if (adv > 0) withDiscardRecorder(rec, () => advanceTick(state, adv, rec));
  }

  return true;
}

// ---------------------------------------------------------------------------
// 结束回合
// ---------------------------------------------------------------------------
// 我方拍点(DOT/HOT)。带记录器时逐个单位录一帧, 让掉血/回血逐个演出而不是数字突变。
function runAllyTempoRecorded(state: BattleState, rec?: FxRecorder): void {
  if (!rec) {
    runAllyTempo(state);
    return;
  }
  for (const id of allyTempoIds(state)) {
    if (!state.combatants[id]?.alive) continue;
    const hits = withHitRecorder(() => runOwnerTempo(state, id));
    if (hits.length) rec.steps.push({ kind: "tempo", ownerId: id, hits, snapshot: structuredClone(state) });
  }
}

export function endRound(state: BattleState, rec?: FxRecorder): void {
  if (state.pendingChoice || state.phase !== "player") return;
  withDiscardRecorder(rec, () => {
    checkChallengesOnEndTurn(state);

    // 回合结束推进时刻, 让所有尚未发动的蓄力招式依次结算。
    flushPendingActs(state, rec);
    if (state.phase !== "player") return;

    runAllyTempoRecorded(state, rec);
    checkEnd(state);
    if (state.phase !== "player") return;
    checkMassacreOnRoundSettle(state);

    if (RULES.hand.discardLeftoversOnRoundEnd) {
      for (const cardUid of [...state.hand]) moveToDiscard(state, cardUid, "roundEnd");
    }
    // 手牌里剩下的被动卡自动收进弃牌堆 —— 不计弃牌数、不触发任何弃牌联动。
    recycleHandPassives(state, rec);
    flushAutoPlays(state, rec);
    if (state.phase !== "player") return;
    startRound(state);
  });
}

export function resolvePendingChoice(state: BattleState, uid: string): boolean {
  const choice = state.pendingChoice;
  if (!choice || choice.kind !== "recoverFromDiscard") return false;
  if (!state.discard.includes(uid) || state.hand.length >= partyHandLimit(state)) return false;

  state.discard = state.discard.filter((id) => id !== uid);
  state.hand.push(uid);
  const card = state.cards[uid];
  if (card) resetCultivate(card);
  if (choice.count > 1) choice.count -= 1;
  else state.pendingChoice = null;
  log(state, `${card?.name ?? "卡牌"} 已从弃牌堆回到手牌`);
  return true;
}

export function cancelPendingChoice(state: BattleState): boolean {
  if (!state.pendingChoice) return false;
  state.pendingChoice = null;
  log(state, "放弃回收弃牌");
  return true;
}
