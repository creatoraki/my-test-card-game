// 事件效果结算 —— ExploreEffect → 会话直接修改。物件效果(curio/effects.ts)未识别的类型也回落到这里。

import { allowsCardRemoval } from "../../data/curios/growthBalance";
import { getItemDef, makeRolledItemStack } from "../../data";
import { rngInt } from "../../engine/rng";
import { rollDropTable } from "../../items/drops";
import { rollEquipCrate, rollModuleCrate } from "../boons";
import { changeEnergy } from "../energy";
import { EXPLORE_RULES } from "../rules";
import type { EventOutcome, ExploreEffect, ExploreState } from "../types";
import { addItems, addPendingLoot, forceDiscardSlots } from "./backpack";
import { dropCoefficient, dropContext } from "./drops";
import { BATTLE_TIER_NAME, rewardMultiplier } from "./energy";
import { damagePartyPercent, healParty } from "./party";
import {
  deferEffectLoot,
  grantRelic,
  randomRelicId,
  rollEquipOffers,
  rollRelicOffers,
  summarizeItems,
} from "./rewards";

// 加权抽一个结果分支(weight 缺省为 1)。
export function rollOutcome(s: ExploreState, outcomes: EventOutcome[]): EventOutcome | null {
  if (!outcomes.length) return null;
  const total = outcomes.reduce((sum, item) => sum + Math.max(0, item.weight ?? 1), 0);
  if (total <= 0) return outcomes[0];
  let roll = rngInt(s, Math.ceil(total * 1000)) / 1000;
  for (const item of outcomes) {
    roll -= Math.max(0, item.weight ?? 1);
    if (roll < 0) return item;
  }
  return outcomes[outcomes.length - 1];
}

// 单条效果 → 一句结算摘要(写进远征记录与结算浮层)。
// defer = true 时, 指名实物与掉落表产出进待拾取框, 而不是直接塞背包。
export function applyEffect(s: ExploreState, e: ExploreEffect, defer = false): string {
  switch (e.type) {
    case "HEAL_PARTY":
      healParty(s, e.percent);
      return `全队回复 ${Math.round(e.percent * 100)}% 生命`;
    case "HEAL_ONE_FULL": {
      const alive = s.party.filter((p) => p.alive);
      if (!alive.length) return "无人可治疗";
      // 优先治疗伤得最重的那个 —— 随机指定只会让玩家觉得系统在跟自己作对
      const target = alive.reduce((a, b) => (a.hp / a.maxHp <= b.hp / b.maxHp ? a : b));
      target.hp = target.hpLimit;
      for (const p of alive) {
        if (p === target) continue;
        p.hp = Math.min(p.hpLimit, p.hp + Math.ceil(p.maxHp * e.othersPercent));
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
    case "GAIN_ITEM": {
      // 指名实物 ⇒ **不**吃掉落系数: 事件写死给几件就是几件, K 只作用于随机掉落表。
      const count = Math.max(1, e.count ?? 1);
      const def = getItemDef(e.itemId);
      const made = Array.from({ length: count }, () => makeRolledItemStack(s, e.itemId, 1));
      if (defer) return deferEffectLoot(s, made);
      const { taken, overflow } = addItems(s, made);
      return overflow.length
        ? `拾得 ${def.name} ×${taken.length}（${overflow.length} 件背不动了）`
        : `拾得 ${def.name} ×${taken.length}`;
    }
    case "FORCE_ITEM": {
      const count = Math.max(1, e.count ?? 1);
      const def = getItemDef(e.itemId);
      const made = Array.from({ length: count }, () => makeRolledItemStack(s, e.itemId, 1));
      const { taken, overflow } = addItems(s, made);
      return overflow.length
        ? `强制拾取 ${def.name} ×${count}（背包已满, 必须腾出 ${overflow.length} 格）`
        : `强制拾取 ${def.name} ×${taken.length}`;
    }
    case "GRANT_EQUIP": {
      const stack = rollEquipCrate(s, dropContext(s));
      if (!stack) return "装备库存为空";
      addPendingLoot(s, [stack]);
      return `获得随机装备「${getItemDef(stack.itemId).name}」，已放入待拾取框`;
    }
    case "GRANT_MODULE": {
      const stack = rollModuleCrate(s, dropContext(s));
      if (!stack) return "模组库存为空";
      addPendingLoot(s, [stack]);
      return `获得随机模组「${getItemDef(stack.itemId).name}」，已放入待拾取框`;
    }
    case "ROLL_DROP": {
      const rolled = rollDropTable(s, e.table, dropCoefficient(s), dropContext(s));
      if (!rolled.length) return "什么也没找到";
      if (defer) return deferEffectLoot(s, rolled);
      const { taken, overflow } = addItems(s, rolled);
      return summarizeItems(taken, overflow);
    }
    case "DISCARD_SLOTS": {
      const dropped = forceDiscardSlots(s, e.slots);
      return dropped > 0 ? `被迫丢弃 ${dropped} 格物资` : "背包本来就是空的";
    }
    case "OPEN_CHUTE":
      s.chuteOpen = true;
      return `投递口已开启（寄回一批物资 · 净化粒子 −${EXPLORE_RULES.chute.energyCost}）`;
    case "MODIFY_ENERGY":
      changeEnergy(s, e.amount);
      return `净化粒子 ${e.amount > 0 ? "+" : ""}${e.amount}`;
    case "SKIP_NODE_COST":
      s.freeNodes += e.nodes;
      return `接下来 ${e.nodes} 次交互不消耗净化粒子`;
    case "CONTAMINATE_CARDS": {
      const count = Math.max(1, Math.floor(e.count ?? 1));
      if (e.each) {
        s.pendingContaminationEach += count;
        return `每名角色的牌组各有 ${count} 张卡牌被污染`;
      }
      s.pendingContaminationCount += count;
      return `${count} 张卡牌被污染`;
    }
    case "HEAL_ONE":
      s.pendingActions.push({ kind: "healOne", percent: e.percent, full: e.full ?? false });
      return e.full ? "获得一次指定角色生命回满" : `获得一次指定角色治疗 ${Math.round(e.percent * 100)}%`;
    case "HEAL_LIMIT_PARTY": {
      for (const p of s.party) {
        if (!p.alive) continue;
        const amount = Math.ceil(p.maxHp * e.percent);
        p.hpLimit = Math.min(p.maxHp, p.hpLimit + amount);
        p.hp = Math.min(p.hpLimit, p.hp + amount);
      }
      return `全队体力极限恢复 ${Math.round(e.percent * 100)}%`;
    }
    case "HEAL_LIMIT_ONE":
      s.pendingActions.push({
        kind: "healLimitOne",
        percent: e.percent ?? 0,
        full: e.full ?? false,
      });
      return e.full ? "获得一次指定角色体力极限全恢复" : `获得一次指定角色体力极限修复 ${Math.round((e.percent ?? 0) * 100)}%`;
    case "CURE_QUIRK":
      s.pendingActions.push({ kind: "cureQuirk", scope: e.scope, count: Math.max(1, e.count ?? 1) });
      return e.scope === "party" ? `获得全队各治疗 ${Math.max(1, e.count ?? 1)} 个怪癖` : "获得一次指定角色怪癖治疗";
    case "REDUCE_POLLUTION":
      s.pendingActions.push({ kind: "reducePollution", scope: e.scope, amount: Math.max(0, e.amount) });
      return e.scope === "party" ? `获得全队污染值降低 ${Math.max(0, e.amount)}` : `获得一次指定角色污染值降低 ${Math.max(0, e.amount)}`;
    case "PURIFY_CARDS":
      s.pendingActions.push({ kind: "purifyCards", scope: e.scope, count: Math.max(1, e.count ?? 1) });
      return e.scope === "party" ? `获得全队各净化 ${Math.max(1, e.count ?? 1)} 张污染卡` : "获得一次指定角色污染卡净化";
    case "GRANT_RELIC":
      return grantRelic(s, e.relicId);
    case "GRANT_RANDOM_RELIC": {
      const relicId = randomRelicId(s, e.rarity);
      if (!relicId) {
        s.loot += 10;
        return "随机祝福遗物池为空，回落为居民积分 +10";
      }
      return grantRelic(s, relicId);
    }
    case "GAIN_EXP_PARTY": {
      let count = 0;
      for (const p of s.party) {
        if (!p.alive) continue;
        s.pendingExp[p.charId] = (s.pendingExp[p.charId] ?? 0) + e.amount;
        count += 1;
      }
      return `存活角色各获得经验 +${e.amount}（${count} 人）`;
    }
    case "GAIN_EXP_ONE":
      s.pendingActions.push({ kind: "expOne", amount: e.amount });
      return `获得一次指定角色经验 +${e.amount}`;
    case "FORGE_DRAW":
      s.pendingActions.push({ kind: "forgeDraw" });
      return "获得一次免费角色卡组锻造";
    case "FORGE_REMOVE":
      if (!allowsCardRemoval(s)) return "当前探索未开放删卡服务";
      s.pendingActions.push({ kind: "forgeRemove" });
      return "获得一次免费角色删卡机会";
    case "EQUIP_OFFER": {
      const offers = rollEquipOffers(s, e.count, e.slot);
      if (offers.length) {
        s.pendingActions.push({ kind: "equipOffer", offers });
        return `公开 ${offers.length} 件装备候选`;
      }
      return "装备库存为空";
    }
    case "RELIC_OFFER": {
      const count = e.count ?? e.relicIds?.length ?? 3;
      const offers = rollRelicOffers(s, count, e.rarity, e.relicIds);
      if (offers.length) {
        s.pendingActions.push({ kind: "relicOffer", offers });
        return `公开 ${offers.length} 件遗物候选`;
      }
      // 候选全被拿光时保底折积分, 与 grantRelic 的重复处理口径一致。
      s.loot += 10;
      return "没有可提供的新遗物，回落为居民积分 +10";
    }
    case "REFORGE_BOND":
      s.pendingActions.push({ kind: "reforge", bias: e.bias });
      return "获得一次免费装备羁绊重铸";
    // 开战由 session/battle.ts 的场景事件结算拦截, 走到这里只回一句摘要。
    case "START_NODE_BATTLE":
      return `进入${BATTLE_TIER_NAME[e.tier ?? s.roundBattleTier]}`;
  }
}
