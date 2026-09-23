// 场景事件 —— 房间内黑影的开战结算, 以及物件 / 黑影结算完毕后的「确认」回场景。
// 物件的决策结算在 curio/resolve.ts, 这里只处理 sceneEvents 里自带选项的事件(黑影、警报守卫、暗雷)。

import { consumeItems, countByItemId } from "@/items/inventory";
import { releasePendingAlarm } from "../../corridor/alarm";
import { currentRoom, syncRoomFromScene } from "../../dungeon/dungeonSession";
import { changeEnergy } from "../../resources/energy";
import { interactionCost } from "../../resources/energyCost";
import type { BattleTier, EventChoice, ExploreState, NodeEvent } from "../../types";
import { encounterForTier, pickRoomBattleTier } from "./battle";
import { applyEffect, rollOutcome } from "./effects";
import { logLine } from "./log";
import { checkWipe } from "./party";

// 当前落点的场景事件(没有打开任何物件 / 黑影时返回 null)。
export function landedEvent(s: ExploreState): NodeEvent | null {
  if (s.landedIndex == null) return null;
  return s.sceneEvents[s.landedIndex] ?? null;
}

// 事件没写 choices 时退化成「只有主选项」。
function eventChoices(ev: NodeEvent): EventChoice[] {
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

// 结算落点事件的第 index 个选项 —— 扣粒子、跑效果、写记录。
// ★ 粒子消耗 = 交互基础消耗(freeNodes 可免) + 该分支自己的 energyDelta。
// 效果里带 START_NODE_BATTLE 时直接进入战斗, 否则进 resolving 等玩家确认。
function resolveSceneEvent(s: ExploreState, index: number): boolean {
  const ev = landedEvent(s);
  const choice = ev ? eventChoices(ev)[index] : undefined;
  if (s.phase !== "landed" || s.landedIndex == null || !ev || !choice) {
    console.warn("[explore] 选项未被接受：当前阶段、落点或选项无效", {
      index,
      phase: s.phase,
      landedIndex: s.landedIndex,
      eventId: ev?.id,
    });
    return false;
  }

  if (choice.cost) {
    const count = Math.max(1, Math.floor(choice.cost.count));
    if (countByItemId(s.backpack, choice.cost.itemId) < count) return false;
    s.backpack = consumeItems(s.backpack, choice.cost.itemId, count);
  }

  const notes: string[] = [];
  const historyNotes: string[] = [];

  // ① 交互的基础消耗(见 energyCost.interactionCost)。「隐匿通道」这类效果免的就是这一份。
  if (s.freeNodes > 0) {
    s.freeNodes -= 1;
  } else {
    changeEnergy(s, -interactionCost(s));
  }

  // ② 分支自己的额外增减
  if (choice.energyDelta !== 0) {
    changeEnergy(s, choice.energyDelta);
    notes.push(`净化粒子 ${choice.energyDelta > 0 ? "+" : ""}${choice.energyDelta}`);
  }

  let battleTier: BattleTier | null = null;
  let pinnedEncounterId: string | null = null;
  const outcome = choice.outcomes?.length ? rollOutcome(s, choice.outcomes) : null;
  const effects = outcome?.effects ?? choice.effects ?? ev.effects ?? [];
  if (choice.story) s.pendingStory.push(choice.story);
  if (outcome?.text) s.pendingStory.push(outcome.text);
  for (const e of effects) {
    if (e.type === "START_NODE_BATTLE") {
      battleTier = e.tier ?? pickRoomBattleTier(s);
      pinnedEncounterId = e.encounterId ?? null;
      continue;
    }
    try {
      const note = applyEffect(s, e, true);
      if (!note) continue;
      notes.push(note);
      if (e.type !== "MODIFY_ENERGY" && e.type !== "SKIP_NODE_COST" && e.type !== "OPEN_CHUTE") {
        historyNotes.push(note);
      }
    } catch (err) {
      console.error("[explore] 事件效果异常（已跳过）", { effectType: e.type, error: err });
      notes.push("事件效果异常（已跳过）");
    }
  }

  s.pendingNotes = notes;
  if (s.corridor?.activeObjectId) {
    const object = s.corridor.objects.find((candidate) => candidate.id === s.corridor?.activeObjectId);
    if (object) object.used = true;
    syncRoomFromScene(s); // 「已探索」标记读的是房间图, 场景里的进度必须回写
  }
  // 记录里带上所选分支 —— 结算页回顾整趟远征时, 玩家要读得出自己当时做了什么决定。
  s.history.push({
    slot: "node",
    round: s.round,
    segment: s.landedIndex,
    lane: 0,
    roomLabel: currentRoom(s)?.label,
    eventId: ev.id,
    eventTitle: ev.title,
    eventKind: ev.kind,
    choiceIndex: index,
    choiceLabel: choice.label,
    notes: historyNotes,
  });
  logLine(s, `${currentRoom(s)?.label ?? "?"} 号房间: ${ev.title} · ${choice.label}`);

  if (checkWipe(s)) return true;

  if (battleTier) {
    s.roundBattleTier = battleTier; // HUD 与结算读的是这一个
    s.pendingBattleTier = battleTier;
    s.pendingEncounterId = pinnedEncounterId ?? encounterForTier(s, battleTier);
    if (!s.pendingEncounterId) return false;
    s.pendingIsBoss = false;
    s.battleSource = "room";
    s.phase = "inBattle";
    return true;
  }

  s.phase = "resolving";
  return true;
}

/**
 * 黑影演出结束 → 真正建立战斗(由 store 在动画回调里调用, 与开始演出分开以免重复建局)。
 * 这里只处理房间内的黑影; BOSS 红门由 session/battle.ts 的 challengeBoss 直接开战。
 */
export function engageRoomThreat(s: ExploreState): boolean {
  if (s.phase !== "encounter" || !s.corridor?.encounterId) return false;
  const encounterId = s.corridor.encounterId;
  const threat = s.corridor.threats.find((candidate) => candidate.id === encounterId);
  if (!threat) return false;
  s.landedIndex = threat.nodeIndex;
  s.pendingNotes = [];
  s.pendingStory = [];
  s.phase = "landed";
  return resolveSceneEvent(s, 0);
}

// 结算浮层点「确认」→ 回到场景自由行走。
// ⚠ 背包满时不许继续 —— pendingPickup 是必须当场处理完的取舍(设计文档 §6.4)。
export function confirmNode(s: ExploreState): boolean {
  if (s.phase !== "resolving") return false;
  if (s.pendingPickup.length || s.pendingLoot.length || s.pendingActions.length) return false;
  s.pendingStory = [];
  s.chuteOpen = false; // 投递口只在开启它的那次交互有效
  s.phase = "atNode";
  // 物件交互失败拉响的警报: 回到场景立即生成守卫战。
  releasePendingAlarm(s);
  return true;
}
