// 敌人 AI: 随机抽招与行动执行。敌人招式复用效果系统。

import type { AnimHit, BattleState, Enemy, FxRecorder, Intent } from "../types";
import { getEnemyDef, type EnemyMove } from "@/data";
import { resolveEffects } from "../effects/effects";
import { alliesOf, chooseRandomTarget, foesOf } from "../combat/targeting";
import { allIds, cleanup, ctxFor, getStatus, log, markDead, ops } from "../core/ops";
import { STATUS_DEFS } from "../core/hookRegistry";
import { runEnemyTempo } from "../combat/statusLifecycle";
import { attackDamage, enemyActDelay, statOf } from "../combat/stats";
import { withHitRecorder } from "../core/animHits";
import { pickAllyTarget, pickScriptedTarget } from "./enemyMovePick";
import { pickScriptedMove, updateAiMemory } from "./enemyScript";
import { chooseNextMove, hasSoulLock, SOUL_LOCK_STATUS } from "./apPick";
import { applyGrudgeDoll } from "./grudgeDoll";
import { noteRhythmMove } from "./enemyRhythm";
import { arkPrimaryTarget, pickMothFollowUp, prepareArkIntent } from "../ecoArk/moves";
import { ARK, isArkMinion } from "../ecoArk/shared";
import { endBarrage, noteSentryMove } from "../ecoArk/sentry";
import { clearBurstBuff } from "../ecoArk/burstBuff";
import { emperorCollapse } from "../bonds/bondTargets";

// 按行动点抽取下一招并开始蓄力(开蓄即扣点); 抽不到 = 本回合停手攒点。
// firstOfRound: 回合开始的第一次抽招, 必定出招(每回合至少行动一次)。
export function startCharge(state: BattleState, enemyId: string, firstOfRound = false): void {
  const e = state.combatants[enemyId] as Enemy;
  const def = getEnemyDef(e.enemyDefId);
  const move = e.alive ? chooseNextMove(state, e, def, firstOfRound) : null;
  if (!move) {
    clearBurstBuff(e);
    e.nextActTick = null;
    return;
  }

  if (def.ai) updateAiMemory(e, move, def.ai);
  e.ap -= move.cost;
  // 锁魂只管一次抽招: 抽到招式后移除。
  if (hasSoulLock(e)) e.statuses = e.statuses.filter((status) => status.id !== SOUL_LOCK_STATUS);

  const dmgEff = move.effects.find((x) => x.type === "DAMAGE");
  const shieldEff = move.effects.find((x) => x.type === "GAIN_SHIELD");
  // 攻击意图预览 = 施法者视角的伤害(倍率牌按攻击力换算) + 力量。
  // ⚠ 只算施法者这一侧 —— 目标的防御/格挡/闪避是逐个目标的, 意图里给不出确定值。
  const str = getStatus(e, "strength")?.stacks ?? 0;
  let value: number | undefined;
  if (dmgEff) {
    const base =
      dmgEff.amount != null ? dmgEff.amount : attackDamage(statOf(e, "attack"), dmgEff.multiplier ?? 1);
    value = Math.round(base + str);
  } else if (shieldEff) value = shieldEff.amount ?? 0;

  const intent: Intent = {
    moveId: move.id,
    name: move.name,
    emoji: move.emoji,
    kind: move.kind,
    value,
  };
  e.intent = intent;
  prepareArkIntent(state, e, move);
  e.nextActTick = state.tick + enemyActDelay(state, e, move.delay + e.moveDelayDelta);
  runEnemyStatusHook(state, e, "onCharge");
  // 方舟小怪的最终蓄力固定限制在 1–4 拍，包含先手差与蓄力状态修正。
  if (isArkMinion(e) && e.nextActTick !== null) {
    e.nextActTick = state.tick + Math.max(1, Math.min(4, e.nextActTick - state.tick));
  }
}

// 敌人身上状态的出招周期钩子(迟滞的蓄力推迟 / 出招计次)。
function runEnemyStatusHook(state: BattleState, e: Enemy, hook: "onCharge" | "onAfterAct"): void {
  for (const inst of [...e.statuses]) {
    if (!e.alive) break;
    STATUS_DEFS[inst.id]?.hooks?.[hook]?.(ctxFor(state, e.id, inst));
  }
  cleanup(e);
}

// 敌人行动结果 —— 供帧记录器构造动画帧(不影响引擎结算)。
export interface EnemyActResult {
  actorId: string;
  enemyDefId: string;
  moveId: string;
  targetIds: string[]; // 受影响单位(用于闪特效): foe→[primary]; self→[self]; 群体→解析集合; 眩晕→[self]
  missedIds: string[];
  snapshotBeforeExtra?: BattleState;
  extra?: { moveId: string; hits: AnimHit[]; snapshot: BattleState };
  extraTempo?: { hits: AnimHit[]; snapshot: BattleState };
}

// 归纳一次招式受影响的单位(用于 UI 闪特效)。在结算前按存活集合归纳, 不消耗 RNG。
function collectMoveTargets(
  state: BattleState,
  e: Enemy,
  move: EnemyMove,
  primaryId: string | undefined,
): string[] {
  const set = new Set<string>();
  for (const eff of move.effects) {
    switch (eff.target ?? "primary") {
      case "primary":
        if (primaryId) set.add(primaryId);
        break;
      case "self":
        set.add(e.id);
        break;
      case "allFoes":
      case "randomFoe": // 随机目标无法在结算前确定, 近似为全体以供闪特效
        for (const c of foesOf(state, e)) set.add(c.id);
        break;
      case "allAllies":
      case "randomAlly":
        for (const c of alliesOf(state, e)) set.add(c.id);
        break;
    }
  }
  return [...set];
}

// 一次行动的拍点阶段结果。拆出来是为了让 actAndRecord 能把 DOT 掉血单独录成一帧。
export interface TempoPhase {
  stunnedBefore: boolean; // 拍点处理**前**是否眩晕(1 拍眩晕靠它确实跳过本次行动)
  alive: boolean; // 拍点结算后是否仍存活; false = 被 DOT 打死, 本次行动取消
}

// 行动前推进敌人节拍(DOT/HOT 在此结算)。顺序不可调换: 先读眩晕快照, 再跑拍点。
export function runEnemyTempoPhase(state: BattleState, enemyId: string): TempoPhase {
  const e = state.combatants[enemyId] as Enemy;
  if (!e.alive) return { stunnedBefore: false, alive: false };
  const stunnedBefore = (getStatus(e, "stun")?.stacks ?? 0) > 0;
  return { stunnedBefore, alive: runEnemyTempo(state, enemyId) };
}

function runBeforeActHooks(state: BattleState, e: Enemy): void {
  for (const inst of [...e.statuses]) {
    if (!e.alive) break;
    STATUS_DEFS[inst.id]?.hooks?.onBeforeAct?.(ctxFor(state, e.id, inst));
  }
  cleanup(e);
  if (e.alive && e.hp <= 0) markDead(state, e);
}

// 敌人执行它当前的意图。返回本次行动的描述(供动画帧记录)。
// phase 已在外部跑过时直接复用, 不再重复推进节拍。
export function enemyAct(state: BattleState, enemyId: string, phase?: TempoPhase, scheduleNext = true): EnemyActResult {
  const e = state.combatants[enemyId] as Enemy;
  const enemyDefId = e.enemyDefId;
  if (!e.alive)
    return { actorId: enemyId, enemyDefId, moveId: e.intent.moveId, targetIds: [], missedIds: [] };

  const tempoPhase = phase ?? runEnemyTempoPhase(state, enemyId);
  const stunned = tempoPhase.stunnedBefore;
  if (!tempoPhase.alive)
    return { actorId: enemyId, enemyDefId, moveId: e.intent.moveId, targetIds: [], missedIds: [] };

  const stun = getStatus(e, "stun");
  if (stunned || stun) {
    clearBurstBuff(e);
    endBarrage(state, e, true);
    log(state, `💫 ${e.name} 被眩晕, 无法行动`);
    if (scheduleNext) startCharge(state, enemyId);
    return { actorId: enemyId, enemyDefId, moveId: e.intent.moveId, targetIds: [enemyId], missedIds: [] };
  }

  // 出招前钩子(捕虫夹): 若因此被击杀, 招式直接取消。
  runBeforeActHooks(state, e);
  if (!e.alive)
    return { actorId: enemyId, enemyDefId, moveId: e.intent.moveId, targetIds: [enemyId], missedIds: [] };

  const def = getEnemyDef(e.enemyDefId);
  const chargedMove = def.moves.find((m) => m.id === e.intent.moveId) ?? def.moves[0];
  // 破壳临时换招: 已扣的蓄力招点数退回, 改扣新招(付得起的范围内挑)。
  const budget = e.ap + chargedMove.cost;
  const scriptedMove =
    def.ai && e.aiMemory?.justBrokeShell ? pickScriptedMove(state, e, def, (m) => m.cost <= budget) : undefined;
  const move = scriptedMove ?? chargedMove;
  if (scriptedMove) {
    e.ap = Math.max(0, budget - scriptedMove.cost);
    e.intent = { moveId: move.id, name: move.name, emoji: move.emoji, kind: move.kind };
    updateAiMemory(e, move, def.ai);
  }

  let primaryId: string | undefined;
  if (isArkMinion(e)) primaryId = arkPrimaryTarget(state, e, move);
  else if (move.targeting === "foe")
    primaryId = pickScriptedTarget(state, e, move) ?? chooseRandomTarget(state, enemyId);
  else if (move.targeting === "ally") primaryId = pickAllyTarget(state, e, move);

  // 咒怨人偶: 攻击招式被反转打向自己(首领改为伤害减半)。须在归纳受影响单位之前决定。
  const grudge = move.kind === "attack" ? applyGrudgeDoll(state, e, move.effects) : null;
  if (grudge?.reversed) primaryId = e.id;

  // 皇帝 8: 本回合第一次纯全体攻击收束为只打生命最高的队友。
  const collapse = grudge?.reversed ? null : emperorCollapse(state, e, grudge?.effects ?? move.effects);
  if (collapse) primaryId = collapse.primaryId;

  // 在结算前归纳受影响单位(此时目标仍存活, 死掉的目标也应闪特效)
  const targetIds = grudge?.reversed ? [e.id] : collapse ? [collapse.primaryId] : collectMoveTargets(state, e, move, primaryId);

  log(state, `${e.emoji} ${e.name} 使用 ${move.name}`);
  // 凶兆: 在招式结算前判定应验 / 落空; 应验时标记在本次结算期间削弱攻击, 结算后移除。
  ops.prophecyEvent(state, { type: "beforeEnemyAct", enemyId, moveKind: move.kind });
  const moveHitBonus = move.hitBonus ?? 0;
  const baseEffects = collapse?.effects ?? grudge?.effects ?? move.effects;
  const effects = moveHitBonus
    ? baseEffects.map((eff) =>
        eff.type === "DAMAGE" && eff.hitBonus == null ? { ...eff, hitBonus: moveHitBonus } : eff,
      )
    : baseEffects;
  const resolution = resolveEffects(state, effects, enemyId, primaryId);
  ops.prophecyEvent(state, { type: "afterEnemyAct", enemyId });
  // 出招节奏按真正发动的招式计(破壳换招后的新招、被眩晕跳过的不算)。
  noteRhythmMove(e, def, move);
  noteSentryMove(e, move.id);

  if (e.hp <= 0) markDead(state, e);
  // 招式发动后移除的状态(捕虫夹等)与出招计次(迟滞) —— 必须早于 startCharge, 否则会拖累下一招。
  e.statuses = e.statuses.filter((inst) => !STATUS_DEFS[inst.id]?.expiresOnAct);
  if (e.alive) runEnemyStatusHook(state, e, "onAfterAct");
  let snapshotBeforeExtra: BattleState | undefined;
  let extraFrame: EnemyActResult["extra"];
  let extraTempo: EnemyActResult["extraTempo"];
  // 追加只从小招选：扣点、不蓄力，仍走每次行动的拍点与状态钩子。
  if (scheduleNext && e.alive && move.id === ARK.groupDance && !getStatus(e, "stun")) {
    const extra = pickMothFollowUp(state, e, def.moves);
    if (extra) {
      snapshotBeforeExtra = structuredClone(state);
      e.ap -= extra.cost;
      const oldIntent = e.intent;
      e.intent = { moveId: extra.id, name: extra.name, emoji: extra.emoji, kind: extra.kind };
      prepareArkIntent(state, e, extra);
      log(state, `${e.name} 立即追加 ${extra.name}`);
      let phase!: TempoPhase;
      const tempoHits = withHitRecorder(() => { phase = runEnemyTempoPhase(state, enemyId); });
      if (tempoHits.length) extraTempo = { hits: tempoHits, snapshot: structuredClone(state) };
      let result!: EnemyActResult;
      const extraHits = withHitRecorder(() => { result = enemyAct(state, enemyId, phase, false); });
      const recordedIds = new Set(extraHits.map((hit) => hit.id));
      const hits = [...extraHits, ...result.targetIds.filter((id) => !recordedIds.has(id))
        .map((id) => ({ id, hpDelta: 0, missed: result.missedIds.includes(id) }))];
      if (phase.alive) extraFrame = { moveId: extra.id, hits, snapshot: structuredClone(state) };
      e.intent = oldIntent;
    }
  }
  if (scheduleNext) startCharge(state, enemyId);
  if (extraFrame) extraFrame.snapshot = structuredClone(state);
  const hitIds = new Set(resolution.hit);
  return {
    actorId: enemyId,
    enemyDefId,
    moveId: move.id,
    targetIds,
    missedIds: [...new Set(resolution.missed)].filter((id) => !hitIds.has(id)),
    snapshotBeforeExtra,
    extra: extraFrame,
    extraTempo,
  };
}

// 执行一次敌人行动, 并(可选)记录一帧动画: 行动者 + 受击掉血量 + 结算后快照。
export function actAndRecord(state: BattleState, enemyId: string, fx?: FxRecorder): void {
  if (!fx) {
    enemyAct(state, enemyId);
    return;
  }
  // 第一段: 拍点(DOT/HOT)。单独成帧, 播在出招之前 —— 玩家才看得到"先中毒掉血, 再挥拳"。
  let phase!: TempoPhase;
  const tempoHits = withHitRecorder(() => {
    phase = runEnemyTempoPhase(state, enemyId);
  });
  if (tempoHits.length)
    fx.steps.push({ kind: "tempo", ownerId: enemyId, hits: tempoHits, snapshot: structuredClone(state) });
  if (!phase.alive) return; // 被 DOT 打死: 只留拍点帧, 不再出招

  // 第二段: 招式本体。beforeHp 必须在这里采样, 否则兜底差值会把上面的 DOT 掉血重复算进来。
  const beforeHp: Record<string, number> = {};
  for (const id of allIds(state)) beforeHp[id] = state.combatants[id].hp;

  let res!: ReturnType<typeof enemyAct>;
  const recorded = withHitRecorder(() => {
    res = enemyAct(state, enemyId, phase);
  });

  // 逐段明细优先(多段招式据此飘多个数字/多声受击); 招式声明的目标里没被记录到的
  // (只吃护盾/状态、或闪避后无 HP 变化), 再按快照前后差值补齐 —— 与改造前口径一致。
  const byId = new Map<string, AnimHit>(recorded.map((hit) => [hit.id, hit]));
  const hits: AnimHit[] = [
    ...res.targetIds
      .filter((id) => state.combatants[id])
      .map(
        (id) =>
          byId.get(id) ?? {
            id,
            hpDelta: (beforeHp[id] ?? 0) - (res.snapshotBeforeExtra ?? state).combatants[id].hp,
            missed: res.missedIds.includes(id),
          },
      ),
    // 招式目标之外也被记录到的单位(荆棘反伤打回施法者、吸血自愈等)照样给特效与飘字。
    ...recorded.filter((hit) => !res.targetIds.includes(hit.id)),
  ];

  fx.steps.push({
    kind: "enemy",
    actorId: res.actorId,
    enemyDefId: res.enemyDefId,
    moveId: res.moveId,
    hits,
    snapshot: res.snapshotBeforeExtra ?? structuredClone(state),
  });
  if (res.extraTempo) fx.steps.push({ kind: "tempo", ownerId: res.actorId, ...res.extraTempo });
  if (res.extra) fx.steps.push({ kind: "enemy", actorId: res.actorId, enemyDefId: res.enemyDefId, ...res.extra });
}
