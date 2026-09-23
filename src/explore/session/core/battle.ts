// 战斗 —— 档位抽取、BOSS 红门开战、撤离, 以及战斗结束后的回填与掉落。
// 房间内黑影的开战入口在 session/scene.ts(它先走一遍场景事件结算, 再落到这里的抽档)。

import { difficultyMapConfig, getEncounter, getEnemyDef } from "@/data";
import { rngFloat, rngInt, shuffle } from "@/engine/core/rng";
import { rollDropTable } from "@/items/drops";
import type { ItemStack } from "@/items/types";
import { rollBoons } from "../../core/boons";
import { hasCorridorRewards, settleCorridorEncounter } from "../../corridor/corridorSession";
import { currentRoom, syncRoomFromScene } from "../../dungeon/dungeonSession";
import { fireExploreRelic } from "../../relics/relics";
import { EXPLORE_RULES } from "../../core/exploreRules";
import type { BattleTier, ExploreState } from "../../types";
import { addPendingLoot } from "../loot/backpack";
import { dropCoefficient, dropContext } from "../loot/drops";
import { BATTLE_TIER_NAME, rewardMultiplier } from "./energy";
import { logLine } from "./log";
import { applySurvivors, loseEverything, type BattleSurvivor } from "./party";
import { summarizePendingItems } from "../loot/rewards";

function pickWeighted<T extends { weight: number }>(s: ExploreState, options: readonly T[]): T {
  const total = options.reduce((sum, option) => sum + Math.max(0, option.weight), 0);
  if (total <= 0) return options[0];
  let roll = rngInt(s, Math.ceil(total * 1000)) / 1000;
  for (const option of options) {
    roll -= Math.max(0, option.weight);
    if (roll < 0) return option;
  }
  return options[options.length - 1];
}

// 战斗房的档位: 按**当前房间的深度**在权重表里抽。越深越难, 深度超表长取最后一档。
export function pickRoomBattleTier(s: ExploreState): BattleTier {
  const rows = EXPLORE_RULES.battleTierWeights;
  const depth = currentRoom(s)?.depth ?? 0;
  return pickWeighted(s, rows[Math.min(Math.max(depth, 0), rows.length - 1)]).tier;
}

// 按档位抽遭遇战。t1-t3 有一定概率被本图的宝箱怪替换。
export function encounterForTier(s: ExploreState, tier: BattleTier): string | null {
  const map = difficultyMapConfig(s.mapId, s.difficulty);
  const treasure = map.treasureEncounters ?? [];
  if (
    treasure.length &&
    EXPLORE_RULES.treasureEncounter.tiers.includes(tier) &&
    rngFloat(s) < EXPLORE_RULES.treasureEncounter.chance
  ) {
    return shuffle(s, [...treasure])[0] ?? null;
  }
  return shuffle(s, map.battleEncounters[tier] ?? [])[0] ?? null;
}

// BOSS 红门的战斗: 默认 t5, 固定蓝图守卫可覆盖档位与遭遇; 胜利后结束整趟远征。
function engageBossBattle(s: ExploreState): boolean {
  const guard = currentRoom(s)?.guard;
  const tier = guard?.tier ?? "t5";
  const encounterId = guard?.encounterId ?? encounterForTier(s, tier);
  if (!encounterId) return false;
  const eventTitle = getEncounter(encounterId).name;

  s.roundBattleTier = tier;
  s.history.push({
    slot: "battle",
    round: s.round,
    segment: -1,
    lane: -1,
    roomLabel: currentRoom(s)?.label,
    eventId: encounterId,
    eventTitle,
    eventKind: "battle",
    choiceIndex: -1,
    choiceLabel: "",
    notes: [],
  });
  s.pendingBattleTier = tier;
  s.pendingEncounterId = encounterId;
  s.pendingIsBoss = true;
  s.battleSource = "boss";
  s.phase = "inBattle";
  logLine(s, `迎战「${eventTitle}」→ ${BATTLE_TIER_NAME[tier]}`);
  return true;
}

/** 开启 BOSS 红门后的挑战接缝：保留红门状态，直接建立 BOSS 战。 */
export function challengeBoss(s: ExploreState): boolean {
  if (s.phase !== "atNode" || !s.corridor?.bossGateOpen || hasCorridorRewards(s)) return false;
  syncRoomFromScene(s);
  return engageBossBattle(s);
}

// 撤离远征的阶段白名单 = 全部「不限时、等玩家操作」的阶段。
// ★ 独立导出是给 UI 用的: 按钮的禁用条件必须与这里同源, 各写一份迟早对不上。
export function canRetreat(s: ExploreState): boolean {
  return s.phase === "resolving" || s.phase === "atNode";
}

export function retreat(s: ExploreState): boolean {
  if (!canRetreat(s)) return false;
  s.phase = "retreated";
  logLine(s, "主动撤离了这片区域");
  return true;
}

// 清掉「当前这一场」的全部战斗字段。挑战加成除外: 掉落掷点要先读它, 由调用方决定何时清。
function clearPendingBattle(s: ExploreState): void {
  s.pendingEncounterId = null;
  s.pendingIsBoss = false;
  s.pendingBattleTier = null;
  s.battleSource = null;
}

// 战斗进行途中从设置面板主动撤离: 本场战斗作废, 整趟远征就此收尾。
// ★ 与 retreat() 的差别只在「它从 inBattle 出发, 且要先把战斗里打掉的血回填给会话」——
//   之后的落袋、结算与回城都由 store 层走和撤离完全相同的那条路。
// ⚠ 刻意不发经验、不掉落、不扣能量、不写 history 的 battleResult: 这一场没打完, 什么都不算。
export function retreatFromBattle(s: ExploreState, survivors: BattleSurvivor[]): boolean {
  if (s.phase !== "inBattle") return false;
  applySurvivors(s, survivors);
  clearPendingBattle(s);
  s.pendingChallengeBonus = 0;
  s.phase = "retreated";
  logLine(s, "战斗中主动撤离了这片区域");
  return true;
}

// ⚠ 第四参是**敌人 defId 列表**而不是数量: 掉落要查每个敌人自己的 dropTable。
export function finishBattle(
  s: ExploreState,
  won: boolean,
  survivors: BattleSurvivor[],
  enemyDefIds: string[],
  challengeBonus = 0,
  bountyBonus = 0,
  battleRounds = 0,
): { loot: number; items: ItemStack[]; overflow: ItemStack[] } {
  const empty = { loot: 0, items: [], overflow: [] };
  if (s.phase !== "inBattle") return empty;
  const wasBoss = s.pendingIsBoss;
  s.pendingChallengeBonus = won ? challengeBonus : 0;

  applySurvivors(s, survivors);

  if (!won) {
    const last = s.history[s.history.length - 1];
    if (wasBoss && last?.slot === "battle") {
      last.battleResult = "lose";
      last.notes = ["首领挑战失败 · 撤离副本"];
    }
    // BOSS 战失败 = 撤离(背包保住); 其余战斗失败 = 团灭。
    s.phase = wasBoss ? "retreated" : "wiped";
    if (!wasBoss) loseEverything(s);
    clearPendingBattle(s);
    s.pendingChallengeBonus = 0;
    logLine(s, wasBoss ? "首领挑战失败 · 撤离副本" : "战斗失利, 远征中断");
    return empty;
  }

  s.stats.kills += enemyDefIds.length;
  s.battlesWon += 1;
  const wasRoomBattle = s.battleSource === "room";
  const mult = rewardMultiplier(s.energy);
  // ⚠ 设计文档 §6.1: 战斗胜利**只掉物品**。perEnemy 已归零, 这里只剩 BOSS 的通关奖励。
  let loot = Math.round(enemyDefIds.length * EXPLORE_RULES.loot.perEnemy * mult);
  if (wasBoss) loot += Math.round(EXPLORE_RULES.loot.bossBonus * mult);
  s.loot += loot;

  // 实物掉落: 每个敌人各掷自己的表, 走同一条种子链 ⇒ 同种子的一趟远征掉的东西逐件一致。
  const k = dropCoefficient(s, s.pendingChallengeBonus, bountyBonus);
  const ctx = dropContext(s, k);
  const rolled = enemyDefIds.flatMap((id) => rollDropTable(s, getEnemyDef(id).dropTable, k, ctx));
  addPendingLoot(s, rolled);
  s.pendingBoons = rollBoons(s, enemyDefIds.map((id) => getEnemyDef(id).boonTable), k);
  fireExploreRelic(s, { type: "battleVictory", battleRounds });

  // ⚠ 必须在上面的 dropCoefficient / rollDropTable 之后才清挑战加成。
  clearPendingBattle(s);
  s.pendingChallengeBonus = 0;

  const notes: string[] = [];
  if (loot > 0) notes.push(`居民积分 +${loot}`);
  if (rolled.length) notes.push(summarizePendingItems(rolled));
  if (s.pendingBoons.length) notes.push(`额外奖励 ×${s.pendingBoons.length}`);
  s.pendingNotes = [["战斗胜利", ...notes].join(" · ")];

  const last = s.history[s.history.length - 1];
  if (wasBoss) {
    if (last?.slot === "battle") {
      last.battleResult = "win";
      last.notes = ["战斗胜利"];
    }
  } else if (wasRoomBattle && last?.slot === "node" && notes.length) {
    last.notes.push(...notes);
  }

  if (!wasBoss) {
    // 战斗房: 黑影清场, 通行恢复, 玩家留在原房间继续搜。
    settleCorridorEncounter(s);
    syncRoomFromScene(s);
    s.phase = "atNode";
    return { loot, items: rolled, overflow: [] };
  }

  // BOSS 房胜利 = 通关。房间制下没有「下一层」, 打完这一场整趟远征就结束。
  syncRoomFromScene(s);
  s.phase = "cleared";
  logLine(s, "回收总控已停机");
  return { loot, items: rolled, overflow: [] };
}
