// 消耗品 —— 远征途中使用背包里的物品。

import { getItemDef } from "@/data";
import { findByUid, removeByUid } from "@/items/inventory";
import type { ItemStack } from "@/items/types";
import { rollModuleCrate } from "../../core/boons";
import type { ExploreEffect, ExploreState, PartySnapshot } from "../../types";
import { dropContext } from "./drops";
import { applyEffect } from "../core/effects";
import { restoreLimit } from "../core/party";
import { logLine } from "../core/log";

// 消耗品的可用阶段 ⊂ canOpenBackpack: 设计文档 §6.4 只点名「不限时的待决策阶段」。
export function canUseItem(s: ExploreState): boolean {
  return (
    s.phase === "landed" ||
    s.phase === "shopping" ||
    s.phase === "resolving" ||
    s.phase === "atNode"
  );
}

// 使用一件消耗品的结算结果。★ 污染值存在城镇侧(townStore), 探索会话是纯 TS 摸不到它,
//   故只记录「要降谁、降多少」, 由 exploreStore.useItem 转交 townStore 落地 —— 与
//   pendingActions 的 reducePollution 是同一套分工。note 是效果摘要(不含物品名),
//   完整展示文案由 store 拼「物品名 · 摘要」。
export interface ItemUseResult {
  itemName: string;
  note: string; // 效果摘要; 污染类会被 store 按实际落地值重建
  pollution?: { charId: string; name: string; amount: number };
  /** 开模组箱: 开出的那件(已原地放进箱子那一格), 供 UI 做开箱演出。 */
  opened?: ItemStack;
}

// 指定角色的效果共用: 目标必须是本次远征队伍里**存活**的成员(治疗/修复/降污染都不复活)。
function aliveTargetOf(s: ExploreState, charId: string | undefined): PartySnapshot | null {
  if (!charId) return null;
  return s.party.find((p) => p.charId === charId && p.alive) ?? null;
}

// 使用一件消耗品。★ 不额外消耗净化粒子 —— 携带成本已由负重收过一次, 不重复收费(§6.4)。
// 需要指定目标的 ItemUse 必须带 targetCharId, 否则返回 null(物品不消耗);
// 目标状态无效(满血 / 体力极限与生命皆满)同样返回 null 且不消耗; 用不了返回 null。
export function useItem(s: ExploreState, uid: string, targetCharId?: string): ItemUseResult | null {
  if (!canUseItem(s)) return null;
  const st = findByUid(s.backpack, uid);
  if (!st) return null;
  const def = getItemDef(st.itemId);
  if (!def.use) return null;

  // ItemUse → 会话直接修改。★ 翻译表只有这一处 —— items/ 刻意不认识 ExploreState。
  // ⚠ 设计文档《消耗品》§五: 使用前先检查目标与效果是否有效, 检查失败**不消耗物品**。
  const u = def.use;
  let note: string;
  let pollution: ItemUseResult["pollution"];
  switch (u.kind) {
    case "healOne": {
      const target = aliveTargetOf(s, targetCharId);
      if (!target) return null;
      if (target.hp >= target.hpLimit) return null; // 满血无效果
      target.hp = Math.min(target.hpLimit, target.hp + Math.ceil(target.maxHp * u.percent));
      note = `${target.name} 回复 ${Math.round(u.percent * 100)}% 生命`;
      break;
    }
    case "healLimitOne": {
      const target = aliveTargetOf(s, targetCharId);
      if (!target) return null;
      // 体力极限与当前生命都已满才算无效果(§2.2: 无合法目标); 只满其一照样可用。
      if (target.hpLimit >= target.maxHp && target.hp >= target.hpLimit) return null;
      const amount = Math.max(0, Math.floor(u.amount));
      restoreLimit(target, amount);
      note = `${target.name} 体力极限修复 ${amount} 点`;
      break;
    }
    case "reducePollutionOne": {
      const target = aliveTargetOf(s, targetCharId);
      if (!target) return null;
      // 污染值在城镇侧, 有效性检查(目标污染 > 0)由 exploreStore 在进会话前完成;
      // 这里只记录「要降谁、降多少」, 由 store 按实际落地值重建文案。
      pollution = { charId: target.charId, name: target.name, amount: Math.max(0, Math.floor(u.amount)) };
      note = `${target.name} 污染 −${pollution.amount}`;
      break;
    }
    case "openModuleCrate": {
      // 开出的模组**原地替换**箱子那一格: 箱子与模组都是 maxStack 1、各占 1 格, 净 0 格,
      // 背包再满也不会溢出; 也省得玩家再去待拾取框里拿一次。
      const opened = rollModuleCrate(s, dropContext(s), u.tier);
      if (!opened) return null;
      s.backpack = st.count > 1
        ? [...s.backpack.map((stack) => (stack.uid === uid ? { ...stack, count: stack.count - 1 } : stack)), opened]
        : s.backpack.map((stack) => (stack.uid === uid ? opened : stack));
      note = `开出 ${getItemDef(opened.itemId).name}`;
      logLine(s, `打开了 ${def.name} · ${note}`);
      return { itemName: def.name, note, opened };
    }
    default: {
      // 无需目标的效果(healParty / healOneFull / gainEnergy)沿用 applyEffect 翻译。
      const effect: ExploreEffect =
        u.kind === "healParty"
          ? { type: "HEAL_PARTY", percent: u.percent }
          : u.kind === "healOneFull"
            ? { type: "HEAL_ONE_FULL", othersPercent: u.othersPercent }
            : { type: "MODIFY_ENERGY", amount: u.amount };
      note = applyEffect(s, effect);
    }
  }

  s.backpack = st.count > 1
    ? s.backpack.map((stack) => (stack.uid === uid ? { ...stack, count: stack.count - 1 } : stack))
    : removeByUid(s.backpack, uid);
  logLine(s, `使用了 ${def.name} · ${note}`);
  return { itemName: def.name, note, pollution };
}
