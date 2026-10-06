import type { Card, DamageCtx, StatusCtx, StatusDef } from "../types";
import { foesOf } from "../combat/targeting";
import { applyPierce, applyVenomArrow } from "../combat/pierce";
import { restoreHpLimit } from "../core/hpLimit";

// 菌丝网络: 每名敌人每回合最多因中毒结算获得的穿孔层数。
export const MYCELIUM_PIERCE_CAP_PER_ROUND = 2;
// 根系网络: 培育牌枯萎时为生命比例最低的队友修复的体力极限。
export const ROOT_NETWORK_HP_LIMIT = 2;
// 孢子护幕: 受到带有中毒的敌人攻击时的伤害倍率。
export const SPORE_VEIL_DAMAGE_MULT = 0.75;
// 锋芒: 攻击力加成(百分点), 固定数值, 卡牌只改变持续回合。
export const EDGE_ATTACK_PCT = 20;
// 淬毒: 附加中毒的持续拍数。
export const ENVENOM_POISON_DURATION = 2;

// 出牌结算期间 playedThisRound 尚未追加本张牌, 回合号 + 已出牌数即可唯一标识"这张牌"。
// 返回 true 表示这是持有者本张攻击牌第一次命中敌人。
function firstEnemyHitOfCard(c: StatusCtx, dmg: DamageCtx): boolean {
  if (!dmg.isAttack || dmg.missed || dmg.sourceId !== c.ownerId) return false;
  const target = c.state.combatants[dmg.targetId];
  if (!target?.alive || target.team !== "enemy") return false;
  const data = (c.inst.data ??= {});
  const playKey = c.state.round * 1000 + c.state.playedThisRound.length;
  if (data.playKey === playKey) return false;
  data.playKey = playKey;
  return true;
}

function poisoned(c: StatusCtx, id: string | undefined): boolean {
  const unit = id ? c.state.combatants[id] : undefined;
  return unit?.statuses.some((status) => status.id === "poison" && status.stacks > 0) ?? false;
}

export const BOTANIST_STATUS_DEFS: Record<string, StatusDef> = {
  thornCrown: {
    id: "thornCrown",
    name: "棘冠",
    emoji: "👑",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "override",
    desc: "受到攻击时，对攻击者施加毒箭 2：附加 2 层穿孔，攻击者中毒时改为 4 层。",
    hooks: {
      onAfterAttacked: (c: StatusCtx, dmg: DamageCtx) => {
        if (dmg.isAttack && dmg.sourceId && dmg.sourceId !== c.ownerId)
          applyVenomArrow(c.state, dmg.sourceId, 2, c.ownerId);
      },
    },
  },
  rootNetwork: {
    id: "rootNetwork",
    name: "根系网络",
    emoji: "🌿",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "override",
    desc: `培育牌成熟时，所有敌人附加穿孔 1；培育牌枯萎时，生命比例最低的队友修复 ${ROOT_NETWORK_HP_LIMIT} 点体力极限。`,
    hooks: {
      onCultivateStage: (c: StatusCtx, _card: Card, stage) => {
        const owner = c.state.combatants[c.ownerId];
        if (!owner?.alive) return;
        if (stage === "mature") {
          for (const foe of foesOf(c.state, owner)) c.ops.applyStatus(c.state, foe.id, "pierce", 1, undefined, undefined, c.ownerId);
        } else if (stage === "withered") {
          const allies = c.state.playerIds
            .map((id) => c.state.combatants[id])
            .filter((ally) => ally?.alive && ally.maxHp > 0);
          const target = allies.reduce<(typeof allies)[number] | undefined>(
            (best, ally) => (!best || ally.hp / ally.maxHp < best.hp / best.maxHp ? ally : best),
            undefined,
          );
          if (target) restoreHpLimit(c.state, target.id, ROOT_NETWORK_HP_LIMIT);
        }
      },
    },
  },
  pollen: {
    id: "pollen",
    name: "花粉",
    emoji: "🌼",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "override",
    desc: "持有者每张攻击牌首次命中敌人时，对其施加毒箭：附加对应层数的穿孔，该敌人中毒时层数翻倍。",
    detailStats: (inst) => [{ label: "毒箭", value: inst.data?.perHit ?? 1, suffix: " 层" }],
    hooks: {
      onAfterAttack: (c: StatusCtx, dmg: DamageCtx) => {
        // 满弓目标不再被本卡附加穿孔。
        if (c.state.fullDraw.hitIds.includes(dmg.targetId) || !firstEnemyHitOfCard(c, dmg)) return;
        applyVenomArrow(c.state, dmg.targetId, c.inst.data?.perHit ?? 1, c.ownerId);
      },
    },
  },
  envenom: {
    id: "envenom",
    name: "淬毒",
    emoji: "🧪",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "override",
    desc: `持有者每张攻击牌首次命中敌人时，为其附加植物学家攻击力 15% 的中毒，持续 ${ENVENOM_POISON_DURATION} 拍。`,
    detailStats: (inst) => [{ label: "中毒", value: Math.round(inst.data?.poison ?? 0), suffix: " 层" }],
    hooks: {
      onAfterAttack: (c: StatusCtx, dmg: DamageCtx) => {
        if (!firstEnemyHitOfCard(c, dmg)) return;
        const stacks = Math.round(c.inst.data?.poison ?? 0);
        if (stacks > 0)
          c.ops.applyStatus(c.state, dmg.targetId, "poison", stacks, ENVENOM_POISON_DURATION, undefined, c.inst.sourceId ?? c.ownerId);
      },
    },
  },
  sporeVeil: {
    id: "sporeVeil",
    name: "孢子护幕",
    emoji: "🌫️",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "override",
    desc: `受到带有中毒的敌人攻击时，本次伤害降低 ${Math.round((1 - SPORE_VEIL_DAMAGE_MULT) * 100)}%。`,
    hooks: {
      modifyIncomingDamage: (c, dmg, mods) => {
        if (dmg.isAttack && dmg.sourceId !== c.ownerId && poisoned(c, dmg.sourceId)) mods.mulTaken(SPORE_VEIL_DAMAGE_MULT);
      },
    },
  },
  deepRoots: {
    id: "deepRoots",
    name: "根深",
    emoji: "🌳",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "override",
    expiresOnRoundEnd: true,
    desc: "本回合受到的伤害不会降低体力极限。",
    hooks: {
      onBeforeHpLoss: (_c: StatusCtx, dmg: DamageCtx) => {
        dmg.keepHpLimit = true;
      },
    },
  },
  edge: {
    id: "edge",
    name: "锋芒",
    emoji: "✴️",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "max",
    statModsPct: { attack: EDGE_ATTACK_PCT },
    desc: `攻击力 +${EDGE_ATTACK_PCT}%。不可叠加，重复获得时持续回合取较大值。`,
  },
  bloom: {
    id: "bloom",
    name: "盛放",
    emoji: "🌸",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "override",
    durationStartsImmediately: true,
    desc: "本回合打出成熟牌时，其成熟效果额外结算一次；嫁接牌的攻击力、治愈力加成按两次计算。",
  },
  myceliumWeb: {
    id: "myceliumWeb",
    name: "菌丝网络",
    emoji: "🍄",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "keep",
    undispellable: true,
    desc: `本场战斗中，敌人的中毒每结算一次（包括毒发），为其附加 1 层穿孔；每名敌人每回合最多因此获得 ${MYCELIUM_PIERCE_CAP_PER_ROUND} 层。`,
    hooks: {
      onFoePoisonTick: (c: StatusCtx, victimId: string) => {
        const holder = c.state.combatants[c.ownerId];
        const victim = c.state.combatants[victimId];
        if (!holder?.alive || !victim || victim.team === holder.team) return;
        const data = (c.inst.data ??= {});
        if (data.round !== c.state.round) {
          for (const key of Object.keys(data)) delete data[key];
          data.round = c.state.round;
        }
        const key = `n:${victimId}`;
        if ((data[key] ?? 0) >= MYCELIUM_PIERCE_CAP_PER_ROUND) return;
        if (applyPierce(c.state, victimId, 1, c.ownerId) > 0) data[key] = (data[key] ?? 0) + 1;
      },
    },
  },
};
