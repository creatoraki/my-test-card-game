// ============================================================================
// 探索会话 —— 纯 TS, 无 React、无副作用。所有函数直接修改传入的 ExploreState,
// 由 store 层负责 structuredClone 后再调用(与 engine/battle.ts 同惯例)。
//
// 核心循环: 牌是资源, 而抽牌权只能靠打仗换。
//   手上有事件卡 ──打出──▶ 收益入袋 + 危险度↑
//        ▲                        │
//        └──胜利抽 2 张──  打出遭遇卡进入战斗(难度按当前危险度)
// ============================================================================

import { rngInt, shuffle } from "../engine/rng";
import type { EncounterModifier } from "../engine/types";
import { getMap, makeExploreCard } from "../data";
import { EXPLORE_RULES, DANGER_TIERS } from "./rules";
import type {
  AbilityId,
  DangerTier,
  ExploreCard,
  ExploreEffect,
  ExploreState,
  PartySnapshot,
} from "./types";

// ---------------------------------------------------------------------------
// 危险度换算 —— 唯一真相点, UI 与战斗生成共用
// ---------------------------------------------------------------------------
export function dangerTier(danger: number): DangerTier {
  let found = DANGER_TIERS[0];
  for (const t of DANGER_TIERS) if (danger >= t.min) found = t;
  return found;
}

// 距离下一档还差多少点; 已在顶档返回 null(供 UI 决定要不要显示"再打 N 张跳档")
export function toNextTier(danger: number): number | null {
  const next = DANGER_TIERS.find((t) => t.min > danger);
  return next ? next.min - danger : null;
}

export function rewardMultiplier(danger: number): number {
  return dangerTier(danger).rewardMultiplier;
}

// 危险度 → 遭遇战改造。引擎侧只认这一个结构(见 engine/types.ts EncounterModifier)。
export function encounterModifier(
  danger: number,
  isBoss: boolean,
  fillerEnemyIds: string[],
): EncounterModifier {
  const t = dangerTier(danger);
  const extra: string[] = [];
  if (fillerEnemyIds.length) {
    // 追加敌人用确定性取模而非随机 —— 同一危险度下阵容稳定, 玩家看得懂自己招来了什么
    for (let i = 0; i < t.extraEnemies; i++) extra.push(fillerEnemyIds[i % fillerEnemyIds.length]);
    if (isBoss && t.tier >= EXPLORE_RULES.boss.guardFromTier) extra.push(fillerEnemyIds[0]);
  }
  return {
    extraEnemies: extra,
    enemyStatuses: t.enemyStatuses.map((s) => ({ ...s })),
    castTickDelta: t.castTickDelta,
    hpMultiplier: isBoss ? 1 + EXPLORE_RULES.boss.hpPerTier * (t.tier - 1) : 1,
  };
}

// ---------------------------------------------------------------------------
// 建立会话
// ---------------------------------------------------------------------------
export function createSession(
  mapId: string,
  party: PartySnapshot[],
  carryCardIds: string[] = [],
  seed?: number,
): ExploreState {
  const map = getMap(mapId);
  const s: ExploreState = {
    mapId,
    danger: 0,
    loot: 0,
    cards: {},
    draw: [],
    hand: [],
    route: [],
    trail: [],
    party: party.map((p) => ({ ...p })),
    bossUid: "",
    bossRevealed: false,
    encountersLeft: map.encounterCount,
    pendingEncounterId: null,
    pendingIsBoss: false,
    pendingDiscard: null,
    phase: "exploring",
    rngState: (seed ?? (Date.now() & 0xffffffff)) >>> 0,
    log: [],
  };

  const register = (card: ExploreCard) => {
    s.cards[card.uid] = card;
    return card.uid;
  };

  // ── 路线牌: 直接入手, 不进牌库 ──
  // 遭遇卡开局就绑定具体 encounter 并亮在卡面上 ⇒ 玩家可以自选先打哪一场(先啃软的攒资源, 还是趁危险度低啃硬的)
  const pool = [...map.encounterPool];
  for (let i = 0; i < map.encounterCount; i++) {
    const encounterId = pool.length ? pool[rngInt(s, pool.length)] : map.encounterPool[0];
    const card = makeExploreCard("route-encounter");
    card.encounterId = encounterId;
    s.route.push(register(card));
  }
  s.route.push(register(makeExploreCard("route-retreat")));

  // BOSS 卡先造好但不入 route —— 3 张遭遇卡打完后才揭示
  const boss = makeExploreCard("route-boss");
  boss.encounterId = map.bossEncounterId;
  s.bossUid = register(boss);

  // ── 牌库: 地图卡池 + 玩家随身卡, 洗匀 ──
  const deckUids = [...map.explorePool, ...carryCardIds].map((id) => register(makeExploreCard(id)));
  s.draw = shuffle(s, deckUids);

  logLine(s, `进入 ${map.name}`);
  drawCards(s, EXPLORE_RULES.openingDraw);
  return s;
}

// ---------------------------------------------------------------------------
// 内部原语
// ---------------------------------------------------------------------------
function logLine(s: ExploreState, text: string): void {
  s.log.push(text);
}

// 抽满即止: 手牌已满时剩余抽牌数直接作废, 不弃牌、不让玩家做无意义的取舍。
function drawCards(s: ExploreState, n: number): number {
  let drawn = 0;
  for (let i = 0; i < n; i++) {
    if (s.hand.length >= EXPLORE_RULES.handSize) break;
    const uid = s.draw.shift();
    if (!uid) break;
    s.hand.push(uid);
    drawn++;
  }
  return drawn;
}

function changeDanger(s: ExploreState, delta: number): void {
  s.danger = Math.max(0, Math.min(EXPLORE_RULES.dangerMax, s.danger + delta));
}

function healParty(s: ExploreState, percent: number): void {
  for (const p of s.party) {
    if (!p.alive) continue; // 回血不复活阵亡者
    p.hp = Math.min(p.maxHp, p.hp + Math.ceil(p.maxHp * percent));
  }
}

function damageParty(s: ExploreState, amount: number): void {
  for (const p of s.party) {
    if (!p.alive) continue;
    p.hp -= amount;
    if (p.hp <= 0) {
      p.hp = 0;
      p.alive = false;
      logLine(s, `${p.name} 倒下了`);
    }
  }
}

function discardRandom(s: ExploreState, n: number): void {
  for (let i = 0; i < n && s.hand.length; i++) {
    s.hand.splice(rngInt(s, s.hand.length), 1); // 打出即离场, 不回牌库
  }
}

// 全队阵亡 = 团灭。事件卡的 DAMAGE_PARTY 也可能触发, 故每次改动队伍后都要查。
function checkWipe(s: ExploreState): void {
  if (s.phase !== "exploring") return;
  if (s.party.every((p) => !p.alive)) {
    s.phase = "wiped";
    s.loot = Math.floor(s.loot * EXPLORE_RULES.wipe.lootKept);
    logLine(s, "全队失去意识……");
  }
}

// 单条效果 → 一句结算摘要(写进轨迹, 悬停可见)
function applyEffect(s: ExploreState, e: ExploreEffect): string {
  switch (e.type) {
    case "GAIN_LOOT":
      s.loot += e.amount;
      return `残片 +${e.amount}`;
    case "DRAW": {
      const n = drawCards(s, e.amount);
      return n < e.amount ? `抽 ${n} 张(手牌已满/牌库见底)` : `抽 ${n} 张`;
    }
    case "DISCARD":
      discardRandom(s, e.amount);
      return `随机弃 ${e.amount} 张`;
    case "HEAL_PARTY":
      healParty(s, e.percent);
      return `全队回复 ${Math.round(e.percent * 100)}%`;
    case "DAMAGE_PARTY":
      damageParty(s, e.amount);
      return `全队受到 ${e.amount} 伤害`;
    case "MODIFY_DANGER":
      changeDanger(s, e.amount);
      return `危险度 ${e.amount > 0 ? "+" : ""}${e.amount}`;
  }
}

// ---------------------------------------------------------------------------
// 出牌
// ---------------------------------------------------------------------------
export function canPlay(s: ExploreState, uid: string): boolean {
  if (s.phase !== "exploring" || s.pendingDiscard) return false;
  return s.hand.includes(uid) || s.route.includes(uid);
}

// 打出一张事件卡: 结算 → 危险度变化 → 进轨迹(不洗回牌库)。
// 路线牌走 playRoute(需要 store 层配合切界面), 这里直接拒绝。
export function playEvent(s: ExploreState, uid: string): boolean {
  if (!canPlay(s, uid) || !s.hand.includes(uid)) return false;
  const card = s.cards[uid];
  if (!card || card.kind !== "event") return false;

  const dangerBefore = s.danger;
  s.hand = s.hand.filter((x) => x !== uid);
  changeDanger(s, card.danger);

  const notes = card.effects.map((e) => applyEffect(s, e)).filter(Boolean);
  s.trail.push({
    name: card.name,
    emoji: card.emoji,
    kind: card.kind,
    dangerBefore,
    dangerAfter: s.danger,
    note: notes.join(" · ") || "无结算",
  });
  logLine(s, `打出 ${card.name}`);
  checkWipe(s);
  return true;
}

// 打出遭遇/BOSS 卡 —— 只把会话切进 inBattle, 真正建局由 store 层做(它才认识 battleStore)。
export function playRoute(s: ExploreState, uid: string): boolean {
  if (!canPlay(s, uid) || !s.route.includes(uid)) return false;
  const card = s.cards[uid];
  if (!card?.encounterId) return false; // 撤退卡没有 encounterId, 走 retreat()

  s.route = s.route.filter((x) => x !== uid);
  s.pendingEncounterId = card.encounterId;
  s.pendingIsBoss = card.kind === "boss";
  s.phase = "inBattle";
  s.trail.push({
    name: card.name,
    emoji: card.emoji,
    kind: card.kind,
    dangerBefore: s.danger,
    dangerAfter: s.danger,
    note: card.kind === "boss" ? "最终战" : "遭遇战",
  });
  logLine(s, `打出 ${card.name}`);
  return true;
}

export function retreat(s: ExploreState): boolean {
  if (s.phase !== "exploring") return false;
  s.phase = "retreated";
  s.trail.push({
    name: "撤退",
    emoji: "🚪",
    kind: "retreat",
    dangerBefore: s.danger,
    dangerAfter: s.danger,
    note: `带回残片 ${s.loot}`,
  });
  logLine(s, "撤离了这片区域");
  return true;
}

// ---------------------------------------------------------------------------
// 战斗回填 —— 由 store 层在战斗结束后调用
// ---------------------------------------------------------------------------
export function finishBattle(
  s: ExploreState,
  won: boolean,
  survivors: { charId: string; hp: number; alive: boolean }[],
  enemyCount: number,
): { loot: number } {
  if (s.phase !== "inBattle") return { loot: 0 };

  // 血量跨战斗继承 —— 这是整套设计的地基
  for (const p of s.party) {
    const found = survivors.find((x) => x.charId === p.charId);
    if (!found) continue;
    p.hp = Math.max(0, found.hp);
    p.alive = found.alive && found.hp > 0;
  }

  if (!won) {
    s.phase = "wiped";
    s.loot = Math.floor(s.loot * EXPLORE_RULES.wipe.lootKept);
    s.pendingEncounterId = null;
    logLine(s, "战斗失利, 远征中断");
    return { loot: 0 };
  }

  const wasBoss = s.pendingIsBoss;
  const mult = rewardMultiplier(s.danger);
  let loot = Math.round(enemyCount * EXPLORE_RULES.loot.perEnemy * mult);
  if (wasBoss) {
    const t = dangerTier(s.danger);
    loot += Math.round(
      EXPLORE_RULES.loot.bossBonus * (1 + EXPLORE_RULES.boss.lootPerTier * (t.tier - 1)),
    );
  }
  s.loot += loot;

  s.pendingEncounterId = null;
  s.pendingIsBoss = false;

  if (wasBoss) {
    s.phase = "cleared";
    logLine(s, "BOSS 已击杀");
    return { loot };
  }

  s.encountersLeft = Math.max(0, s.encountersLeft - 1);
  drawCards(s, EXPLORE_RULES.drawPerBattle);

  // 3 张遭遇卡全部打完 → BOSS 入手。此后玩家仍可继续刷事件卡把它喂肥, 或立刻开打, 或带着残片撤退。
  if (s.encountersLeft === 0 && !s.bossRevealed) {
    s.bossRevealed = true;
    s.route.unshift(s.bossUid);
    logLine(s, "深处的东西听见了动静");
  }

  s.phase = "exploring";
  checkWipe(s);
  return { loot };
}

// ---------------------------------------------------------------------------
// 场地能力 —— 永远可用(代价不足时 UI 置灰), 保证「牌库空 + 手牌空」的死局不成立
// ---------------------------------------------------------------------------
export function canUseAbility(s: ExploreState, id: AbilityId): boolean {
  if (s.phase !== "exploring" || s.pendingDiscard) return false;
  const a = EXPLORE_RULES.abilities;
  if (id === "scout") return s.draw.length > 0 && s.hand.length < EXPLORE_RULES.handSize;
  if (id === "rest") return s.hand.length >= a.rest.discard;
  return s.hand.length >= a.conceal.discard;
}

// 搜寻立即结算; rest/conceal 的代价是弃牌, 而「弃哪两张」本身就是决策 ——
// 故进入 pendingDiscard 等玩家点选, 不做随机弃牌(随机弃牌等于没有决策)。
export function useAbility(s: ExploreState, id: AbilityId): boolean {
  if (!canUseAbility(s, id)) return false;
  const a = EXPLORE_RULES.abilities;

  if (id === "scout") {
    changeDanger(s, a.scout.danger);
    drawCards(s, a.scout.draw);
    logLine(s, "搜寻: 危险度 +1, 抽 1 张");
    return true;
  }

  s.pendingDiscard = { ability: id, count: id === "rest" ? a.rest.discard : a.conceal.discard, picked: [] };
  return true;
}

export function toggleDiscardPick(s: ExploreState, uid: string): boolean {
  const pd = s.pendingDiscard;
  if (!pd || !s.hand.includes(uid)) return false;
  if (pd.picked.includes(uid)) pd.picked = pd.picked.filter((x) => x !== uid);
  else if (pd.picked.length < pd.count) pd.picked.push(uid);
  return true;
}

export function confirmDiscard(s: ExploreState): boolean {
  const pd = s.pendingDiscard;
  if (!pd || pd.picked.length !== pd.count) return false;
  const a = EXPLORE_RULES.abilities;

  s.hand = s.hand.filter((uid) => !pd.picked.includes(uid));
  if (pd.ability === "rest") {
    healParty(s, a.rest.healPercent);
    logLine(s, `休整: 弃 ${pd.count} 张, 全队回血`);
  } else {
    changeDanger(s, a.conceal.danger);
    logLine(s, `隐匿: 弃 ${pd.count} 张, 危险度 -1`);
  }
  s.pendingDiscard = null;
  return true;
}

export function cancelDiscard(s: ExploreState): boolean {
  if (!s.pendingDiscard) return false;
  s.pendingDiscard = null;
  return true;
}

// ---------------------------------------------------------------------------
// 查询辅助(UI 用)
// ---------------------------------------------------------------------------
// 悬停手牌时预演危险度落点 —— 卡面与仪表据此提示「⚠ 将进入〔警戒〕」
export function previewDanger(s: ExploreState, uid: string): number {
  const card = s.cards[uid];
  if (!card) return s.danger;
  let d = s.danger + card.danger;
  for (const e of card.effects) if (e.type === "MODIFY_DANGER") d += e.amount;
  return Math.max(0, Math.min(EXPLORE_RULES.dangerMax, d));
}

