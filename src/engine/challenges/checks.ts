// ============================================================================
// 挑战词条运行时判定 —— 每个词条一个钩子, 由引擎各处在对应时机调用。
// ★ 依赖方向单向: 本模块只 import types / rules, 由 ops / battle / deck / damage 调用。
// ★ 口径: 只有玩家主动 playCard 参与"打出"判定, 弃牌联动的自动出牌不计
//   (与 state.playedThisRound 同一口径)。
// ============================================================================

import type {
  BattleState,
  Card,
  Combatant,
  DiscardReason,
  EffectDescriptor,
  EffectType,
} from "../types";
import { RULES } from "../core/battleRules";
import { breakChallenge, isLive } from "./core";
import { MERCY_MAX_DAMAGE, RESTRAINT_MIN_MANA, ROTATION_MIN_OWNERS, SWIFT_WIN_LAST_ROUND } from "./defs";

// ---------------------------------------------------------------------------
// 牌面效果扫描 —— 背水一战 / 知足按牌面静态判定(不看本次是否真的治疗到 / 抽到),
// 含培育 / 词条 / 嵌套的命中后效果。待选后续、羁绊自动出牌都不经过 playCard 的结算窗口,
// 静态判定才能让「打出这张牌就算」的口径对玩家可预期。
// ---------------------------------------------------------------------------
const HEAL_EFFECTS = new Set<EffectType>(["HEAL", "INDEMNITY_HEAL", "RESTORE_HP_LIMIT"]);
const DRAW_EFFECTS = new Set<EffectType>(["DRAW"]);
const NESTED_KEYS = ["onKill", "onHit", "onCrit", "onEachRemoved", "onNoneRemoved", "followUp"] as const;

function effectsContain(effects: EffectDescriptor[] | undefined, types: Set<EffectType>): boolean {
  return (effects ?? []).some(
    (effect) => types.has(effect.type) || NESTED_KEYS.some((key) => effectsContain(effect[key], types)),
  );
}

function cardContains(card: Card, types: Set<EffectType>): boolean {
  return (
    effectsContain(card.effects, types) ||
    effectsContain(card.cultivate?.effects, types) ||
    (card.keywords ?? []).some((ref) => effectsContain(ref.effects, types) || effectsContain(ref.onceEffects, types))
  );
}

// ---------------------------------------------------------------------------
// 击杀时判定 —— 大屠杀(首杀记回合, 跨回合还有敌人存活即破) / 擒贼擒王(只看首杀)
// ---------------------------------------------------------------------------
export function noteChallengeKill(state: BattleState, victim: Combatant): void {
  if (victim.team !== "enemy") return;
  if (state.challengeKillRound == null) {
    state.challengeKillRound = state.round;
    if (!state.challengeRegicideIds.includes(victim.id)) {
      breakChallenge(state, "regicide", `第一个倒下的是 ${victim.name}`);
    }
    return;
  }
  if (state.challengeKillRound !== state.round) {
    breakChallenge(state, "massacre", "敌人跨回合存活");
  }
}

// ---------------------------------------------------------------------------
// 回合结算后判定 —— 大屠杀 / 速战速决。只在结算后仍未分胜负时调用。
// ---------------------------------------------------------------------------
export function checkChallengesOnRoundSettle(state: BattleState): void {
  if (state.phase !== "player") return;
  if (state.challengeKillRound != null) {
    breakChallenge(state, "massacre", "敌人未在同一回合内全部倒下");
  }
  if (state.round >= SWIFT_WIN_LAST_ROUND) {
    breakChallenge(state, "swift_win", `第 ${state.round} 回合结束时仍有敌人存活`);
  }
}

// ---------------------------------------------------------------------------
// 出牌时判定 —— 轻装上阵 / 养精蓄锐 / 稳扎稳打 / 循序渐进 / 返璞归真 / 背水一战 / 知足
// played 是刚写进 playedThisRound 的出牌记录: cost 为实际结算费用(已含减免, 即手牌上看到的数字),
// cardType 为实际计入的类型(含流光 / 无声咒等「视为速攻」)。
// ---------------------------------------------------------------------------
export function noteChallengePlay(
  state: BattleState,
  card: Card,
  played: BattleState["playedThisRound"][number],
): void {
  if (played.cost > RULES.combat.lowCostApMax) {
    breakChallenge(state, "low_cost", `打出了 ${played.cost} 费的「${card.name}」`);
  }
  if (state.round === 1) {
    breakChallenge(state, "slow_start", `第 1 回合打出了「${card.name}」`);
  }
  if (played.cardType === "fast") {
    breakChallenge(state, "steady", `打出了速攻牌「${card.name}」`);
  }
  const index = state.playedThisRound.lastIndexOf(played);
  const prev = index > 0 ? state.playedThisRound[index - 1] : null;
  if (prev && played.cost <= prev.cost) {
    breakChallenge(state, "ascending", `「${card.name}」${played.cost} 费未高于上一张的 ${prev.cost} 费`);
  }
  if (card.rarity === "uncommon" || card.rarity === "rare") {
    breakChallenge(state, "plain", `打出了${card.rarity === "rare" ? "稀有" : "罕见"}牌「${card.name}」`);
  }
  if (isLive(state, "no_heal") && cardContains(card, HEAL_EFFECTS)) {
    breakChallenge(state, "no_heal", `使用了治疗卡牌「${card.name}」`);
  }
  if (isLive(state, "content") && cardContains(card, DRAW_EFFECTS)) {
    breakChallenge(state, "content", `打出了带抽牌效果的「${card.name}」`);
  }
}

// ---------------------------------------------------------------------------
// 手牌操作判定 —— 不改初衷(换牌) / 当机立断(等待)
// ---------------------------------------------------------------------------
export function noteChallengeRedraw(state: BattleState): void {
  breakChallenge(state, "no_redraw", "使用了换牌");
}

export function noteChallengeWait(state: BattleState): void {
  breakChallenge(state, "no_wait", "使用了等待");
}

// ---------------------------------------------------------------------------
// 弃牌时判定 —— 敝帚自珍。手动 / 效果 / 代价丢弃都算(不论由哪张牌、哪个被动引起);
// 换牌、回合结束清理、打出进弃牌堆、被动卡回收、羁绊弃牌都不算。
// ---------------------------------------------------------------------------
const COUNTED_DISCARDS = new Set<DiscardReason>(["manual", "effect", "cost"]);

export function noteChallengeDiscard(state: BattleState, reason: DiscardReason, cardName: string): void {
  if (COUNTED_DISCARDS.has(reason)) breakChallenge(state, "no_discard", `丢弃了「${cardName}」`);
}

// ---------------------------------------------------------------------------
// 状态挂上后判定 —— 光明磊落。只在 applyStatus 成功加层后调用(被抵抗 / 未命中不会走到这里)。
// 来源是我方单位即算: 卡牌、弃牌联动、被动牌、遗物带上我方来源时一视同仁。
// isDebuff 与疫病等「获得减益」监听同一口径: 减益且不是标记类状态。
// ---------------------------------------------------------------------------
export function noteChallengeStatus(
  state: BattleState,
  target: Combatant,
  sourceId: string | undefined,
  statusName: string,
  isDebuff: boolean,
): void {
  if (target.team !== "enemy" || !isDebuff || !sourceId) return;
  if (state.combatants[sourceId]?.team !== "player") return;
  breakChallenge(state, "honorable", `对 ${target.name} 施加了${statusName}`);
}

// ---------------------------------------------------------------------------
// 回合结束时判定 —— 克制 / 轮转
// ★ 中途取胜的那一回合不追判(与大屠杀口径一致): endRound 根本不会被调到。
// ---------------------------------------------------------------------------
export function checkChallengesOnEndTurn(state: BattleState): void {
  if ((state.resources[RULES.resource.name] ?? 0) < RESTRAINT_MIN_MANA) {
    breakChallenge(state, "restraint", `结束回合时法力不足 ${RESTRAINT_MIN_MANA} 点`);
  }
  if (isLive(state, "rotation")) {
    const owners = new Set(state.playedThisRound.map((played) => played.ownerCharId));
    if (owners.size < ROTATION_MIN_OWNERS) {
      breakChallenge(state, "rotation", `本回合只打出了 ${owners.size} 种归属角色的牌`);
    }
  }
}

// ---------------------------------------------------------------------------
// 伤害落到 HP 时判定 —— 慈悲 / 独当一面 / 聚焦
// ★ 独当一面与聚焦只认实际掉血(hpLost > 0): 护盾全吸收 / 未命中 / 持续伤害都不登记。
//   聚焦每回合重置目标, 独当一面整场不重置。
// ---------------------------------------------------------------------------
export function noteChallengeDamage(
  state: BattleState,
  sourceId: string | undefined,
  targetId: string,
  hpLost: number,
): void {
  if (!sourceId || state.combatants[sourceId]?.team !== "player") return;
  if (hpLost > MERCY_MAX_DAMAGE) {
    breakChallenge(state, "mercy", `单次攻击造成了 ${hpLost} 点实际伤害`);
  }
  if (hpLost <= 0 || state.combatants[targetId]?.team !== "enemy") return;

  if (state.challengeLoneBladeId == null) state.challengeLoneBladeId = sourceId;
  else if (state.challengeLoneBladeId !== sourceId) {
    breakChallenge(state, "lone_blade", `${state.combatants[sourceId]?.name} 也对敌人造成了伤害`);
  }

  if (state.challengeFocusTargetId == null) {
    state.challengeFocusTargetId = targetId;
    return;
  }
  if (state.challengeFocusTargetId !== targetId) {
    breakChallenge(state, "focus_fire", `本回合伤害同时落在了 ${state.combatants[targetId]?.name} 身上`);
  }
}

// ---------------------------------------------------------------------------
// 胜利瞬间判定 —— 及时治疗。阵亡成员(hp 0 ≠ 体力极限)视为已破。
// ---------------------------------------------------------------------------
export function checkChallengesOnWin(state: BattleState): void {
  for (const id of state.playerIds) {
    const ally = state.combatants[id];
    if (!ally) continue;
    if (!ally.alive) {
      breakChallenge(state, "untouched", `${ally.name} 已阵亡`);
      return;
    }
    if (ally.hp !== ally.hpLimit) {
      breakChallenge(state, "untouched", `${ally.name} 生命 ${ally.hp} / 体力极限 ${ally.hpLimit}`);
      return;
    }
  }
}
