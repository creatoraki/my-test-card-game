// 敌人 AI: 随机抽招与行动执行。敌人招式复用效果系统。

import type { AnimHit, BattleState, Enemy, FxRecorder, Intent } from "./types";
import { getEnemyDef, type EnemyMove } from "../data";
import { resolveEffects } from "./effects";
import { alliesOf, chooseRandomTarget, foesOf } from "./targeting";
import { allIds, getStatus, log, markDead } from "./ops";
import { runEnemyTempo } from "./statusLifecycle";
import { attackDamage, enemyActDelay, statOf } from "./stats";
import { rngPickWeighted } from "./rng";
import { withHitRecorder } from "./animHits";
import { pickScriptedMove, pickScriptedTarget, updateAiMemory } from "./enemyScript";

// 消耗一个行动点, 随机抽取下一招并开始蓄力。
export function startCharge(state: BattleState, enemyId: string): void {
  const e = state.combatants[enemyId] as Enemy;
  if (!e.alive || e.actsThisRound >= e.actsPerRound) {
    e.nextActTick = null;
    return;
  }

  const def = getEnemyDef(e.enemyDefId);
  const move = def.ai
    ? pickScriptedMove(state, e, def)
    : rngPickWeighted(state, def.moves, (m) => m.weight ?? 1);
  if (def.ai) updateAiMemory(e, move, def.ai);
  e.actsThisRound += 1;

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
  e.nextActTick = state.tick + enemyActDelay(state, e, move.delay + e.moveDelayDelta);
}

// 敌人行动结果 —— 供帧记录器构造动画帧(不影响引擎结算)。
export interface EnemyActResult {
  actorId: string;
  enemyDefId: string;
  moveId: string;
  targetIds: string[]; // 受影响单位(用于闪特效): foe→[primary]; self→[self]; 群体→解析集合; 眩晕→[self]
  missedIds: string[];
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

// 敌人执行它当前的意图。返回本次行动的描述(供动画帧记录)。
// phase 已在外部跑过时直接复用, 不再重复推进节拍。
export function enemyAct(state: BattleState, enemyId: string, phase?: TempoPhase): EnemyActResult {
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
    log(state, `💫 ${e.name} 被眩晕, 无法行动`);
    startCharge(state, enemyId);
    return { actorId: enemyId, enemyDefId, moveId: e.intent.moveId, targetIds: [enemyId], missedIds: [] };
  }

  const def = getEnemyDef(e.enemyDefId);
  const scriptedMove = def.ai && e.aiMemory?.justBrokeShell ? pickScriptedMove(state, e, def) : undefined;
  const move = scriptedMove ?? def.moves.find((m) => m.id === e.intent.moveId) ?? def.moves[0];
  if (scriptedMove) {
    e.intent = { moveId: move.id, name: move.name, emoji: move.emoji, kind: move.kind };
    updateAiMemory(e, move, def.ai);
  }

  let primaryId: string | undefined;
  if (move.targeting === "foe")
    primaryId = pickScriptedTarget(state, e, move) ?? chooseRandomTarget(state, enemyId);
  else if (move.targeting === "ally") primaryId = enemyId; // 简化: 支援自身

  // 在结算前归纳受影响单位(此时目标仍存活, 死掉的目标也应闪特效)
  const targetIds = collectMoveTargets(state, e, move, primaryId);

  log(state, `${e.emoji} ${e.name} 使用 ${move.name}`);
  const moveHitBonus = move.hitBonus ?? 0;
  const effects = moveHitBonus
    ? move.effects.map((eff) =>
        eff.type === "DAMAGE" && eff.hitBonus == null ? { ...eff, hitBonus: moveHitBonus } : eff,
      )
    : move.effects;
  const resolution = resolveEffects(state, effects, enemyId, primaryId);

  if (e.hp <= 0) markDead(state, e);
  startCharge(state, enemyId);
  const hitIds = new Set(resolution.hit);
  return {
    actorId: enemyId,
    enemyDefId,
    moveId: move.id,
    targetIds,
    missedIds: [...new Set(resolution.missed)].filter((id) => !hitIds.has(id)),
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
            hpDelta: (beforeHp[id] ?? 0) - state.combatants[id].hp,
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
    snapshot: structuredClone(state),
  });
}
