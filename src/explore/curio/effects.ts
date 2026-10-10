import { getItemDef, makeRolledItemStack } from "@/data";
import { rngPick, rngPickWeighted } from "@/engine/core/rng";
import { consumeItems } from "@/items/inventory";
import type { ExploreEffect } from "../types";
import { addPendingLoot, applyEffect } from "../session";
import type { ExploreState } from "../types";
import { rewardPool } from "@/data/curios/rules/rewardPools";
import { getMapDifficulty } from "@/data/maps/mapDifficulty";
import type { ActorTarget, CurioEffect, CurioEffectContext } from "@/data/curios/types";
import { CURIO_ALARM_TIER } from "@/data/curios/rules/curioRules";
import { queueAlarm } from "../corridor/alarm";
import { fuseEquipment, upgradeRelic } from "./fusion";
import { revealAdjacent, revealDungeon } from "./reveal";
import { grantTemporaryRelic } from "./temporaryRelic";
import { rollEffects } from "./roll";
import { convertToExp, salvage } from "./conversion";
import { lightWaystone } from "./waystone";
import { placeBet } from "./arcade";

function targetIds(s: ExploreState, target: ActorTarget, ctx: CurioEffectContext): string[] {
  const alive = s.party.filter((member) => member.alive);
  if (target === "party") return alive.map((member) => member.charId);
  if (target === "actor") return ctx.actorId ? [ctx.actorId] : [];
  if (target === "random") return alive.length ? [rngPick(s, alive).charId] : [];
  return alive.some((member) => member.charId === target.job) ? [target.job] : [];
}

function damageMember(s: ExploreState, charId: string, percent: number): string {
  const member = s.party.find((candidate) => candidate.charId === charId && candidate.alive);
  if (!member) return "无人受到伤害";
  const damage = Math.max(1, Math.round(member.maxHp * percent));
  member.hp -= damage;
  if (member.hp <= 0) {
    member.hp = 0;
    member.alive = false;
    return `${member.name} 倒下了`;
  }
  return `${member.name} 损失 ${Math.round(percent * 100)}% 生命`;
}

/** 按权重抽奖励池；先剔除当前难度禁投的物品。 */
function rollPoolItem(
  s: ExploreState,
  pool: Extract<CurioEffect, { type: "GAIN_POOL_ITEM" }>,
): string | null {
  const excludes = getMapDifficulty(s.difficulty).curioPoolExcludes;
  const entries = rewardPool(pool.pool).filter((entry) => !excludes.includes(entry.itemId));
  if (!entries.length) return null;
  const entry = rngPickWeighted(s, [...entries], (candidate) => candidate.weight);
  return entry.itemId;
}

function applyExploreEffect(s: ExploreState, effect: ExploreEffect): string {
  return applyEffect(s, effect, true);
}

export function applyCurioEffect(
  s: ExploreState,
  effect: CurioEffect,
  ctx: CurioEffectContext,
): string {
  switch (effect.type) {
    case "GAIN_POOL_ITEM": {
      const made: ReturnType<typeof makeRolledItemStack>[] = [];
      for (let i = 0; i < Math.max(0, effect.count); i += 1) {
        const itemId = rollPoolItem(s, effect);
        if (itemId) made.push(makeRolledItemStack(s, itemId, 1));
      }
      if (!made.length) return "奖励池为空";
      addPendingLoot(s, made);
      return `获得 ${made.map((stack) => getItemDef(stack.itemId).name).join("、")}，已放入待拾取框`;
    }
    case "DAMAGE_MEMBER_PERCENT": {
      const ids = targetIds(s, effect.target, ctx);
      const notes = ids.map((id) => damageMember(s, id, effect.percent));
      return notes.join("；") || "无人受到伤害";
    }
    case "ADJUST_POLLUTION": {
      const ids = targetIds(s, effect.target, ctx);
      for (const charId of ids) s.pendingPollution.push({ charId, amount: effect.amount });
      const names = ids
        .map((charId) => s.party.find((member) => member.charId === charId)?.name)
        .filter((name): name is string => Boolean(name));
      return ids.length
        ? `${names.join("、")}污染 ${effect.amount >= 0 ? "+" : ""}${effect.amount}`
        : "没有可调整污染的角色";
    }
    case "REVEAL_MAP":
      revealDungeon(s, effect.threats);
      return effect.threats ? "完整地图与战斗、陷阱位置已揭示" : "完整地图已揭示";
    case "FUSE_EQUIPMENT":
      return fuseEquipment(s, ctx.offered);
    case "UPGRADE_RELIC":
      return upgradeRelic(s, ctx.offered);
    case "FORGE_DRAW_TAINTED":
      s.pendingActions.push({ kind: "forgeDraw", contaminate: Math.max(0, effect.contaminate) });
      return effect.contaminate > 0
        ? `获得一次卡牌三选一奖励，候选生成时全队污染 ${effect.contaminate} 张卡牌`
        : "获得一次卡牌三选一奖励";
    case "REPLACE_CARD_COMMON":
      s.pendingActions.push({ kind: "replaceCard" });
      return "获得一次将卡牌替换为普通卡的机会";
    case "TUNE_EQUIPMENT":
      s.pendingActions.push({ kind: "equipmentTune", mode: effect.mode, foodCost: effect.foodCost });
      return `请选择装备${effect.mode === "bond" ? "重铸羁绊" : "重置完美度"}，确认后支付食品 ×${effect.foodCost}`;
    case "GRANT_DISPOSABLE_RELIC":
      return grantTemporaryRelic(s);
    case "CONSUME_ITEM": {
      const before = s.backpack.reduce((sum, stack) => sum + (stack.itemId === effect.itemId ? stack.count : 0), 0);
      const amount = Math.min(before, Math.max(0, effect.count));
      if (!amount) return `没有${getItemDef(effect.itemId).name}，本次不扣除`;
      s.backpack = consumeItems(s.backpack, effect.itemId, amount);
      return `消耗 ${getItemDef(effect.itemId).name} ×${amount}`;
    }
    case "ALARM_BATTLE":
      queueAlarm(s, CURIO_ALARM_TIER);
      return "警报引来了守卫，结算后将立即遭遇战斗";
    case "ROLL_EFFECTS":
      return rollEffects(s, effect).map((picked) => applyCurioEffect(s, picked, ctx)).join("；");
    case "REVEAL_ADJACENT":
      return revealAdjacent(s);
    case "OPEN_COIN_EXCHANGE":
      s.coinExchangeOpen = true;
      return "兑换已开启，离开前可以反复兑换";
    case "CONVERT_TO_EXP":
      return convertToExp(s, ctx.offered);
    case "SALVAGE":
      return salvage(s, ctx.offered);
    case "LIGHT_WAYSTONE":
      return lightWaystone(s);
    case "WAYSTONE_TRAVEL":
      // 传送由界面在黑场过渡里直接调用 travelByWaystone, 不经过普通结算。
      return "";
    case "PLACE_BET":
      return placeBet(s, effect.goal, ctx.offered);
    default:
      return applyExploreEffect(s, effect);
  }
}
