// ============================================================================
// 探索会话 —— 纯 TS, 无 React、无副作用。所有函数直接修改传入的 ExploreState,
// 由 store 层负责 structuredClone 后再调用(与 engine/battle.ts 同惯例)。
//
// 一段的生命周期(设计文档 §1.2):
//   generateSegment ──▶ generating ──finishGenerating──▶ sealed ──startReveal──▶ revealing
//                                                                                │
//        routing ◀──chooseEntry── choosing ◀──finishReveal──────────────────────┘
//           │
//           └──finishRouting──▶ landed ──chooseOption──▶ resolving
//                                (分支是战斗则先去 inBattle; 是撤离则直接 retreated)  │
//                          下一段 / cleared / retreated / wiped ◀──nextSegment──────┘
//
// ★ generating / sealed 是「新签路的浮现仪式」那两拍: 图先花 2 秒逐层画出来(此时全锁),
//   画完横线仍然遮着 —— 玩家必须主动按「探索路线」才开始限时展示, 一段只能按一次。
//
// ★ landed 是「已经知道落在哪张卡上, 但什么都还没发生」的那一拍: 浮层在这里给出两个分支,
//   战斗也不例外 —— 玩家点了「迎战」才进战斗页。
//
// 净化粒子(energy)是**唯一**的难度轴与时限, 只降不升(少数事件例外)。
// ============================================================================

import { rngInt, shuffle } from "../engine/rng";
import type { EncounterModifier } from "../engine/types";
import { getEventPool, getMap } from "../data";
import { generateCrossbars, exitLaneOf } from "./route";
import { EXPLORE_RULES, ENERGY_TIERS } from "./rules";
import type {
  EnergyTier,
  EventChoice,
  ExploreEffect,
  ExploreState,
  PartySnapshot,
  RouteBoard,
  RouteEvent,
} from "./types";

// ---------------------------------------------------------------------------
// 能量换算 —— 唯一真相点, UI 与战斗生成共用
// ---------------------------------------------------------------------------
// ENERGY_TIERS 按 min 降序排列(80 / 60 / 40 / 20 / 0), 故第一个 min <= energy 的就是当前档。
export function energyTier(energy: number): EnergyTier {
  for (const t of ENERGY_TIERS) if (energy >= t.min) return t;
  return ENERGY_TIERS[ENERGY_TIERS.length - 1];
}

// 再掉多少点就跌入下一档; 已在末档返回 null(供 UI 决定要不要显示跨档预警)。
export function toNextTier(energy: number): number | null {
  const cur = energyTier(energy);
  const next = ENERGY_TIERS.find((t) => t.tier === cur.tier + 1);
  return next ? energy - next.min + 1 : null;
}

// 即设计文档 §5.1 的 K_energy。P0 只用它缩放经验与居民积分;
// 掉落率与品质要等实物战利品(P1)接进来才有第二个消费方。
export function rewardMultiplier(energy: number): number {
  return energyTier(energy).rewardMultiplier;
}

// 实际生效的污染层数 = 档位自带的下限 与 事件累积值 取大者。
// ⚠ P0 只做**记录与显示**: 把「受伤 +6%/层、治疗 -10%/层」真的打进战斗需要引擎侧的
//   我方修正器(EncounterModifier 目前只能改敌人), 那是 P1 的活。
export function effectiveTaint(s: ExploreState): number {
  return Math.min(EXPLORE_RULES.taint.max, Math.max(energyTier(s.energy).taint, s.taint));
}

// 能量档位 → 遭遇战改造。引擎侧只认这一个结构(见 engine/types.ts EncounterModifier)。
export function encounterModifier(
  energy: number,
  isBoss: boolean,
  fillerEnemyIds: string[],
): EncounterModifier {
  const t = energyTier(energy);
  const extra: string[] = [];
  if (fillerEnemyIds.length) {
    // 追加敌人用确定性取模而非随机 —— 同一档位下阵容稳定, 玩家看得懂自己招来了什么
    for (let i = 0; i < t.extraEnemies; i++) extra.push(fillerEnemyIds[i % fillerEnemyIds.length]);
    if (isBoss && t.tier >= EXPLORE_RULES.boss.guardFromTier) extra.push(fillerEnemyIds[0]);
  }
  return {
    extraEnemies: extra,
    enemyStatuses: t.enemyStatuses.map((st) => ({ ...st })),
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
  seed?: number,
): ExploreState {
  const map = getMap(mapId);
  const s: ExploreState = {
    mapId,
    energy: map.startingEnergy,
    taint: 0,
    loot: 0,
    segment: 1,
    segmentCount: map.routeSegments,
    board: null,
    party: party.map((p) => ({ ...p })),
    history: [],
    entryLane: null,
    exitLane: null,
    pendingNotes: [],
    pendingEncounterId: null,
    pendingIsBoss: false,
    skipSegmentCost: false,
    bossAvailable: false,
    phase: "generating", // 占位: 下面的 generateSegment 会重新打一次(第一段也走完整演出)
    rngState: (seed ?? (Date.now() & 0xffffffff)) >>> 0,
    log: [],
  };

  logLine(s, `接入 ${map.name}`);
  generateSegment(s);
  return s;
}

// ---------------------------------------------------------------------------
// 内部原语
// ---------------------------------------------------------------------------
function logLine(s: ExploreState, text: string): void {
  s.log.push(text);
}

function changeEnergy(s: ExploreState, delta: number): void {
  s.energy = Math.max(0, Math.min(EXPLORE_RULES.energyMax, s.energy + delta));
}

function healParty(s: ExploreState, percent: number): void {
  for (const p of s.party) {
    if (!p.alive) continue; // 回血不复活阵亡者
    p.hp = Math.min(p.maxHp, p.hp + Math.ceil(p.maxHp * percent));
  }
}

function damagePartyPercent(s: ExploreState, percent: number): void {
  for (const p of s.party) {
    if (!p.alive) continue;
    p.hp -= Math.max(1, Math.round(p.maxHp * percent));
    if (p.hp <= 0) {
      p.hp = 0;
      p.alive = false;
      logLine(s, `${p.name} 倒下了`);
    }
  }
}

// 全队阵亡 = 团灭。事件掉血也可能触发, 故每次改动队伍后都要查。返回是否刚刚团灭。
function checkWipe(s: ExploreState): boolean {
  if (s.phase === "wiped" || s.phase === "cleared" || s.phase === "retreated") return false;
  if (!s.party.every((p) => !p.alive)) return false;
  s.phase = "wiped";
  s.loot = Math.floor(s.loot * EXPLORE_RULES.wipe.lootKept);
  logLine(s, "全队失去意识……");
  return true;
}

// 单条效果 → 一句结算摘要(写进本段记录与结算浮层)。
// ⚠ START_BATTLE 与 RETREAT 会改变 phase, 由 chooseOption 单独处理, 不走这里。
function applyEffect(s: ExploreState, e: ExploreEffect): string {
  switch (e.type) {
    case "HEAL_PARTY":
      healParty(s, e.percent);
      return `全队回复 ${Math.round(e.percent * 100)}% 生命`;
    case "HEAL_ONE_FULL": {
      const alive = s.party.filter((p) => p.alive);
      if (!alive.length) return "无人可治疗";
      // 优先治疗伤得最重的那个 —— 随机指定只会让玩家觉得系统在跟自己作对
      const target = alive.reduce((a, b) => (a.hp / a.maxHp <= b.hp / b.maxHp ? a : b));
      target.hp = target.maxHp;
      for (const p of alive) {
        if (p === target) continue;
        p.hp = Math.min(p.maxHp, p.hp + Math.ceil(p.maxHp * e.othersPercent));
      }
      return `${target.name} 回满, 其余回复 ${Math.round(e.othersPercent * 100)}%`;
    }
    case "DAMAGE_PARTY_PERCENT":
      damagePartyPercent(s, e.percent);
      return `全队损失 ${Math.round(e.percent * 100)}% 生命`;
    case "GAIN_LOOT": {
      const gain = Math.round(e.amount * rewardMultiplier(s.energy));
      s.loot += gain;
      return `居民积分 +${gain}`;
    }
    case "MODIFY_ENERGY":
      changeEnergy(s, e.amount);
      return `净化粒子 ${e.amount > 0 ? "+" : ""}${e.amount}`;
    case "MODIFY_TAINT":
      s.taint = Math.max(0, Math.min(EXPLORE_RULES.taint.max, s.taint + e.amount));
      return `污染层数 ${e.amount > 0 ? "+" : ""}${e.amount}`;
    case "SKIP_SEGMENT_COST":
      s.skipSegmentCost = true;
      return "本段免除基础能量消耗";
    // 这两个由 chooseOption 拦截, 走不到这里; 列出来让 switch 保持穷尽
    case "START_BATTLE":
    case "RETREAT":
      return "";
  }
}

// ---------------------------------------------------------------------------
// 一段的生成
// ---------------------------------------------------------------------------
// 段在远征里的位置 → 展示时长与横线数(设计文档 §2.2)。
function stageOf(segment: number, segmentCount: number) {
  const ratio = segment / segmentCount;
  const st = EXPLORE_RULES.stages;
  if (ratio <= st.early.untilRatio) return st.early;
  if (ratio <= st.mid.untilRatio) return st.mid;
  return st.late;
}

// 事件保底(设计文档 §2.3):
//   · 每段至少 1 个生存、1 个成长、1 个战斗终点;
//   · 纯负面最多 1 个, 纯负面 + 高风险合计不超过 2 个;
//   · 精英 / 高额奖励只在中后段(靠事件自己的 minSegment 声明);
//   · BOSS 接入后, BOSS 接入点与撤离升降机必现 —— 玩家永远有把东西带回去的机会;
//   · 能量跌到第 5 档(枯竭)时撤离升降机同样必现(§4.2 的枯竭档保护)。
function pickEvents(s: ExploreState, poolId: string, bossAvailable: boolean): RouteEvent[] {
  const pool = getEventPool(poolId);
  const usable = (list: RouteEvent[]) =>
    list.filter((e) => !e.disabled && (e.minSegment ?? 1) <= s.segment);

  const picked: RouteEvent[] = [];
  const has = (id: string) => picked.some((e) => e.id === id);
  const take = (list: RouteEvent[]): boolean => {
    const avail = list.filter((e) => !has(e.id) && withinRiskCap(picked, e));
    if (!avail.length) return false;
    picked.push(avail[rngInt(s, avail.length)]);
    return true;
  };
  const takeById = (id: string) => {
    const found = usable(pool.endgame).find((e) => e.id === id);
    if (found && !has(found.id)) picked.push(found);
  };

  // ① 必现项
  if (bossAvailable) {
    takeById("boss-uplink");
    takeById("evac-lift");
  } else if (energyTier(s.energy).tier >= 5) {
    takeById("evac-lift");
  }

  // ② 三条保底
  take(usable(pool.survival));
  take(usable(pool.growth));
  take(usable(pool.battle));

  // ③ 剩下的名额从全池补, 受风险上限约束
  const filler = shuffle(s, [
    ...usable(pool.survival),
    ...usable(pool.growth),
    ...usable(pool.battle),
    ...usable(pool.economy),
    ...usable(pool.energy),
    ...usable(pool.hazard),
    ...(bossAvailable ? usable(pool.endgame) : []),
  ]);
  while (picked.length < EXPLORE_RULES.laneCount) {
    if (!take(filler)) break;
  }

  // 终点顺序打散 —— 否则「最左边永远是生存」会让整套记忆玩法失去意义
  return shuffle(s, picked).slice(0, EXPLORE_RULES.laneCount);
}

function withinRiskCap(picked: RouteEvent[], e: RouteEvent): boolean {
  if (!e.risk) return true;
  const negatives = picked.filter((p) => p.risk === "negative").length;
  const risky = picked.filter((p) => p.risk).length;
  if (e.risk === "negative" && negatives >= 1) return false;
  return risky < 2;
}

export function generateSegment(s: ExploreState): void {
  const map = getMap(s.mapId);
  const stage = stageOf(s.segment, s.segmentCount);
  const [minBars, maxBars] = stage.bars;
  const barCount = minBars + rngInt(s, maxBars - minBars + 1);

  s.bossAvailable = s.segment >= map.bossAvailableFrom;

  const board: RouteBoard = {
    segment: s.segment,
    laneCount: EXPLORE_RULES.laneCount,
    rowCount: EXPLORE_RULES.rowCount,
    crossbars: generateCrossbars(s, EXPLORE_RULES.laneCount, EXPLORE_RULES.rowCount, barCount),
    events: pickEvents(s, map.eventPoolId, s.bossAvailable),
    revealDurationMs: stage.revealMs,
    blockedLanes: [],
  };

  s.board = board;
  s.entryLane = null;
  s.exitLane = null;
  s.pendingNotes = [];
  s.skipSegmentCost = false;
  // ★ 新图不是立刻可看的: 先播 2 秒逐层绘制(generating), 再停在遮蔽态(sealed)等玩家主动揭示。
  s.phase = "generating";
}

// ---------------------------------------------------------------------------
// 一段的推进
// ---------------------------------------------------------------------------
// 生成演出播完 —— 由 UI 侧的 2 秒定时器触发(时长见 RouteBoard.GENERATE_MS)。
// 图这时已经完整画在屏幕上了, 但横线仍然遮蔽 —— 只是从「锁死」变成「等玩家出手」。
export function finishGenerating(s: ExploreState): boolean {
  if (s.phase !== "generating") return false;
  s.phase = "sealed";
  return true;
}

// 玩家按下「探索路线」—— 唯一进入 revealing 的入口。
// ★ 一段只能看一次: 阶段单向流转 sealed → revealing → choosing, 再也回不到 sealed,
//   所以「限次」不需要额外的计数字段, 拿 phase 卡住就够了。
export function startReveal(s: ExploreState): boolean {
  if (s.phase !== "sealed") return false;
  s.phase = "revealing";
  return true;
}

// 展示计时结束 —— 由 UI 侧的定时器触发(时长取 board.revealDurationMs)。
export function finishReveal(s: ExploreState): boolean {
  if (s.phase !== "revealing") return false;
  s.phase = "choosing";
  return true;
}

export function chooseEntry(s: ExploreState, lane: number): boolean {
  if (s.phase !== "choosing" || !s.board) return false;
  if (lane < 0 || lane >= s.board.laneCount) return false;
  if (s.board.blockedLanes.includes(lane)) return false;
  s.entryLane = lane;
  s.exitLane = exitLaneOf(s.board, lane);
  s.phase = "routing";
  return true;
}

// 走线动画播完 —— **只落点, 不结算**。效果要等玩家在浮层里挑完分支才生效(见 chooseOption)。
// ⚠ 战斗终点同样停在这里: 「还没看清落在哪张卡上就已经在打了」是上一版最大的问题。
export function finishRouting(s: ExploreState): boolean {
  if (s.phase !== "routing" || !s.board || s.entryLane == null || s.exitLane == null) return false;
  s.pendingNotes = [];
  s.phase = "landed";
  return true;
}

// 落点分支的可选项。事件没写 choices 时退化成「只有主选项」, 结算行为与上一版完全一致。
export function landedChoices(s: ExploreState): EventChoice[] {
  const ev = landedEvent(s);
  if (!ev) return [];
  if (ev.choices?.length) return ev.choices;
  return [
    {
      id: "proceed",
      label: "继续",
      desc: "按事件本身的结果处理",
      energyDelta: ev.energyDelta,
      effects: ev.effects,
    },
  ];
}

// 玩家在落点浮层里选了一支 —— 这里才真的扣能量、跑效果、写记录。
// 战斗类分支把会话切进 inBattle, 真正建局由 store 层做(只有它认识 battleStore)。
export function chooseOption(s: ExploreState, index: number): boolean {
  if (s.phase !== "landed" || !s.board || s.entryLane == null || s.exitLane == null) return false;

  const ev = s.board.events[s.exitLane];
  const choice = landedChoices(s)[index];
  if (!choice) return false;

  const energyBefore = s.energy;
  changeEnergy(s, choice.energyDelta);

  const notes: string[] = [];
  if (choice.energyDelta !== 0) {
    notes.push(`净化粒子 ${choice.energyDelta > 0 ? "+" : ""}${choice.energyDelta}`);
  }

  let battle: { encounterId: string; boss?: boolean } | null = null;
  let leaving = false;
  for (const e of choice.effects) {
    if (e.type === "START_BATTLE") {
      battle = { encounterId: e.encounterId, boss: e.boss };
      continue;
    }
    if (e.type === "RETREAT") {
      leaving = true;
      continue;
    }
    const note = applyEffect(s, e);
    if (note) notes.push(note);
  }

  s.pendingNotes = notes;
  // 记录里带上所选分支 —— 结算页回顾整趟远征时, 玩家要读得出自己当时做了什么决定。
  s.history.push({
    segment: s.segment,
    entryLane: s.entryLane,
    exitLane: s.exitLane,
    eventId: ev.id,
    eventTitle: ev.title,
    energyBefore,
    energyAfter: s.energy, // 本段的基础消耗还没扣, nextSegment 里会回填
    note: [choice.label, notes.join(" · ") || "无结算"].join(" · "),
  });
  logLine(s, `第 ${s.segment} 段: ${ev.title} · ${choice.label}`);

  if (checkWipe(s)) return true;

  if (leaving) {
    s.phase = "retreated";
    logLine(s, "搭上撤离升降机");
    return true;
  }

  if (battle) {
    s.pendingEncounterId = battle.encounterId;
    s.pendingIsBoss = !!battle.boss;
    s.phase = "inBattle";
    return true;
  }

  s.phase = "resolving";
  return true;
}

// 玩家在结算浮层点「继续」 —— 扣本段基础能量, 推进到下一段或收尾。
export function nextSegment(s: ExploreState): boolean {
  if (s.phase !== "resolving") return false;

  if (!s.skipSegmentCost) changeEnergy(s, -EXPLORE_RULES.energyPerSegment);
  const last = s.history[s.history.length - 1];
  if (last) last.energyAfter = s.energy;

  if (s.segment >= s.segmentCount) {
    // 走完全部段数仍没打 BOSS 也没坐升降机 —— 视为自行撤离, 收益照常带回。
    s.phase = "retreated";
    logLine(s, "路由网络到此为止, 原路返回");
    return true;
  }

  s.segment += 1;
  generateSegment(s);
  return true;
}

// sealed 与 choosing 同类(都是不限时的待决策阶段, 此时撤离不逃避任何代价);
// generating 演出期与 revealing 限时期一律不许 —— 前者锁交互, 后者是核心机制的计时窗口。
export function retreat(s: ExploreState): boolean {
  if (s.phase !== "sealed" && s.phase !== "choosing" && s.phase !== "resolving") return false;
  s.phase = "retreated";
  logLine(s, "主动撤离了这片区域");
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

  // 血量跨段与跨战斗继承 —— 这是整套设计的地基
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
    s.pendingIsBoss = false;
    logLine(s, "战斗失利, 远征中断");
    return { loot: 0 };
  }

  const wasBoss = s.pendingIsBoss;
  const mult = rewardMultiplier(s.energy);
  let loot = Math.round(enemyCount * EXPLORE_RULES.loot.perEnemy * mult);
  if (wasBoss) loot += Math.round(EXPLORE_RULES.loot.bossBonus * mult);
  s.loot += loot;

  s.pendingEncounterId = null;
  s.pendingIsBoss = false;
  s.pendingNotes = [...s.pendingNotes, `战斗胜利 · 居民积分 +${loot}`];

  const last = s.history[s.history.length - 1];
  if (last) last.note = `${last.note} · 居民积分 +${loot}`;

  if (wasBoss) {
    s.phase = "cleared";
    logLine(s, "回收总控已停机");
    return { loot };
  }

  s.phase = "resolving";
  return { loot };
}

// ---------------------------------------------------------------------------
// 查询辅助(UI 用)
// ---------------------------------------------------------------------------
// ⚠ 背包开放时机是**硬约束**(设计文档 §6.3): 展示线路时开背包等于无限延长观察时间,
//   直接废掉核心机制。故必须在这里拦截, 不能只靠 UI 隐藏按钮。
// landed / resolving / sealed 同类: 都是「不限时、等玩家操作」的阶段, 开背包不会绕过任何机制
// (sealed 时横线还没揭示, 慢慢翻背包也偷看不到东西)。generating 则一律锁死 —— 演出期不接受输入。
export function canOpenBackpack(s: ExploreState): boolean {
  return (
    s.phase === "sealed" ||
    s.phase === "choosing" ||
    s.phase === "landed" ||
    s.phase === "resolving"
  );
}

// 本段终点事件(尚未走线时返回 null)。
export function landedEvent(s: ExploreState): RouteEvent | null {
  if (!s.board || s.exitLane == null) return null;
  return s.board.events[s.exitLane] ?? null;
}

// 「这段走完能量会掉到哪」—— 供 UI 做跨档预警(§11.2 要求的强提示)。
export function projectedEnergy(s: ExploreState): number {
  const cost = s.skipSegmentCost ? 0 : EXPLORE_RULES.energyPerSegment;
  return Math.max(0, s.energy - cost);
}
