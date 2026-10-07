import type { BattleState, Card, Enemy, FxRecorder } from "../types";
import { checkEnd, getStatus, log, ops } from "../core/ops";
import { withHitRecorder } from "../core/animHits";
import { attackDamage, statOf } from "../combat/stats";
import { rngPick } from "../core/rng";
import { ARK, arkEnemy, livingEnemies, livingPlayers } from "./shared";
import { BURST_BUFF, setBurstTarget } from "./burstBuff";

export function endBarrage(state: BattleState, enemy: Enemy, cancelled = false): void {
  if (!enemy.ark?.barrage) return;
  delete enemy.ark.barrage;
  enemy.ark.barrageCooldown = 2;
  log(state, `${enemy.name} 的火力封锁${cancelled ? "被取消，剩余弹药清空" : "结束"}`);
}

export function startBarrage(state: BattleState, enemy: Enemy): void {
  if (!enemy.alive || livingEnemies(state).some((other) => other.id !== enemy.id && other.ark?.barrage)) return;
  arkEnemy(enemy).barrage = { ammo: 3, endsAt: state.tick + 3 };
  log(state, `${enemy.name} 开启火力封锁：3 发弹药，持续 3 个时刻`);
}

function shoot(state: BattleState, enemy: Enemy, targetId: string, rec?: FxRecorder): void {
  const barrage = enemy.ark?.barrage;
  if (!barrage || !enemy.alive || !state.combatants[targetId]?.alive) return;
  barrage.ammo -= 1;
  log(state, `${enemy.name} 向 ${state.combatants[targetId].name} 发射封锁弹`);
  const hits = withHitRecorder(() => {
    const amount = attackDamage(statOf(enemy, "attack"), 0.3) + (getStatus(enemy, "strength")?.stacks ?? 0);
    ops.dealDamage(state, enemy.id, targetId, amount, { isAttack: true, single: true });
    ops.applyStatus(state, targetId, "poison", 1, 3, undefined, enemy.id);
  });
  if (enemy.ark?.barrage && enemy.ark.barrage.ammo <= 0) endBarrage(state, enemy);
  checkEnd(state);
  rec?.steps.push({ kind: "enemy", actorId: enemy.id, enemyDefId: enemy.enemyDefId,
    moveId: ARK.barrage, hits, snapshot: structuredClone(state) });
}

export function queueArkCardPlayed(state: BattleState, card: Card): void {
  state.ark.pendingPlays.push(card.uid);
}

// 待选结束后才分发，自动出牌逐张分发；解缠不会进入此入口。
export function flushArkCardPlayed(state: BattleState, rec?: FxRecorder): void {
  if (state.pendingChoice) return;
  while (state.ark.pendingPlays.length > 0) {
    const uid = state.ark.pendingPlays.shift()!;
    const card = state.cards[uid];
    if (!card || state.phase !== "player") continue;
    const owner = livingPlayers(state).find((unit) => unit.team === "player" && unit.charId === card.ownerCharId);
    if (!owner) continue;
    const pods = getStatus(owner, ARK.pods);
    if (pods) {
      ops.applyStatus(state, owner.id, "poison", 1, 2, undefined, pods.sourceId);
    }
    for (const enemy of livingEnemies(state).filter((unit) => unit.enemyDefId === ARK.sentry)) {
      if (getStatus(enemy, BURST_BUFF)) setBurstTarget(state, enemy, owner.id);
      if (getStatus(enemy, "stun")) endBarrage(state, enemy, true);
      if (enemy.ark?.barrage && owner.alive) shoot(state, enemy, owner.id, rec);
    }
  }
}

export function tickBarrages(state: BattleState, rec?: FxRecorder): void {
  for (const enemy of livingEnemies(state)) {
    if (!enemy.ark?.barrage) continue;
    if (getStatus(enemy, "stun")) { endBarrage(state, enemy, true); continue; }
    if (state.tick < enemy.ark.barrage.endsAt) continue;
    while (enemy.ark?.barrage && state.phase === "player") {
      const targets = livingPlayers(state);
      if (!targets.length) { endBarrage(state, enemy); break; }
      shoot(state, enemy, rngPick(state, targets).id, rec);
    }
  }
}

export function noteSentryMove(enemy: Enemy, moveId: string): void {
  if (moveId !== ARK.barrage && enemy.ark && enemy.ark.barrageCooldown > 0) enemy.ark.barrageCooldown -= 1;
}
