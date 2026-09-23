import { rngInt } from "../rng";
import { getStatus, ops } from "../ops";
import { RULES } from "../rules";
import { addMod } from "../stats";
import type { BattleState } from "../types";
import type { RelicBehavior } from "./types";
import { aliveAllyIds, randomAliveEnemy, relicData } from "./shared";

const FAMILY_PHOTO_BONUS = 10;

// 全家福: 直接写战斗修正而不走 applyStatMod, 避免战斗日志里出现属性键名。
function applyFamilyBonus(state: BattleState, sign: 1 | -1): void {
  for (const id of aliveAllyIds(state)) {
    const ally = state.combatants[id];
    addMod(ally, "attack", FAMILY_PHOTO_BONUS * sign);
    addMod(ally, "healPower", FAMILY_PHOTO_BONUS * sign);
  }
}

export const UNCOMMON_RELIC_BEHAVIORS: Record<string, RelicBehavior> = {
  "relic-stun-hammer": {
    onShuffle: ({ state }) => {
      const allies = aliveAllyIds(state);
      const ownerId = allies[rngInt(state, allies.length)];
      if (ownerId) ops.addCardToHand(state, "temp-stun-hammer", ownerId);
    },
  },
  "relic-insurance-contract": {
    onDownedFatal: (ctx, dmg) => {
      const data = relicData(ctx);
      if (data.used) return;
      data.used = 1;
      dmg.fatal = false;
    },
  },
  "relic-entropy-battery": {
    onRoundEnd: (ctx) => {
      relicData(ctx).carry = Math.min(2, ctx.state.resources[RULES.resource.name] ?? 0);
    },
    onRoundStart: (ctx) => {
      const data = relicData(ctx);
      if (!data.carry) return;
      const resource = RULES.resource.name;
      ctx.state.resources[resource] = (ctx.state.resources[resource] ?? 0) + data.carry;
      data.carry = 0;
    },
  },
  // 本张牌此时尚未写入 playedThisRound, 与前两张记录拼成「连续三张」。
  "relic-double-socket": {
    afterCardPlay: (ctx, card) => {
      const { state } = ctx;
      const data = relicData(ctx);
      if (data.round === state.round) return;
      const owners = [...state.playedThisRound.slice(-2).map((played) => played.ownerCharId), card.ownerCharId];
      if (owners.length < 3 || new Set(owners).size < 3) return;
      data.round = state.round;
      ops.log(state, "双头插座：连续打出三名队员的卡牌，抽 1 张牌");
      ops.draw(state, 1);
    },
  },
  "relic-overload-fuse": {
    onRoundStart: ({ state }) => {
      if (state.round === 1) ops.draw(state, 1);
    },
  },
  "relic-prism-shard": {
    onCrit: ({ state }, dmg) => {
      const source = dmg.sourceId ? state.combatants[dmg.sourceId] : undefined;
      if (source?.team !== "player" || state.combatants[dmg.targetId]?.team !== "enemy") return;
      const amount = Math.round((dmg.hpLost + dmg.blocked) * 0.3);
      const targetId = randomAliveEnemy(state, dmg.targetId);
      if (amount > 0 && targetId) ops.dealDamage(state, undefined, targetId, amount, { fixed: true });
    },
  },
  "relic-petri-dish": {
    onEnemyKilled: ({ state }, deadId) => {
      const dead = state.combatants[deadId];
      const half = Math.floor((dead ? getStatus(dead, "poison")?.stacks ?? 0 : 0) / 2);
      const targetId = half > 0 ? randomAliveEnemy(state, deadId) : undefined;
      if (!targetId) return;
      ops.log(state, `培养皿：${half} 层中毒转移`);
      ops.applyStatus(state, targetId, "poison", half);
    },
  },
  "relic-family-photo": {
    onRoundStart: (ctx) => {
      const { state } = ctx;
      if (state.round !== 1 || state.fallenAllies > 0) return;
      if (aliveAllyIds(state).length !== state.playerIds.length) return;
      relicData(ctx).active = 1;
      applyFamilyBonus(state, 1);
      ops.log(state, `全家福：全队攻击力与治愈力 +${FAMILY_PHOTO_BONUS}`);
    },
    onAllyDeath: (ctx) => {
      const data = relicData(ctx);
      if (!data.active) return;
      data.active = 0;
      applyFamilyBonus(ctx.state, -1);
      ops.log(ctx.state, "全家福：有队员阵亡，加成失效");
    },
  },
};
