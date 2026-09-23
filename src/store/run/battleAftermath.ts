// 战斗之后 —— 结算回填、重开、战中撤退与胜利面板确认。

import type { Ally, BattleState, Enemy } from "@/engine";
import { earnedChallengeBonus, getStatus } from "@/engine";
import { getEnemyDef } from "@/data";
import { dropCoefficient, energyTier, rewardMultiplier } from "@/explore/session";
import { useBattleStore } from "../battle/battleStore";
import { settleFallenGear } from "../explore/exploreAftermath";
import { useExploreStore } from "../explore/exploreStore";
import { useTownStore } from "../town/townStore";
import { bankEverything, settleClear, settleRetreatScreen } from "./expeditionEnd";
import { launchBattle } from "./launchBattle";
import { syncMemberStats } from "./party";
import { CLEARED_BATTLE_REPORT, type RunSet, type RunState } from "./types";

// 战斗单位的最终三段生命 → 探索层的回填口径。
// ★ 正常结算(resolveBattle)与战斗中撤退(retreatFromBattle)共用 —— 两处各抄一份迟早对不上。
function survivorsFrom(
  battle: BattleState,
  session: { party: { charId: string; hpLimit: number }[] },
) {
  return battle.playerIds.map((id) => {
    const a = battle.combatants[id] as Ally;
    const previous = session.party.find((member) => member.charId === a.charId);
    return {
      charId: a.charId,
      hp: a.hp,
      hpLimit: a.hpLimit,
      limitLoss: Math.max(0, (previous?.hpLimit ?? a.hpLimit) - a.hpLimit),
      alive: a.alive,
    };
  });
}

// 战斗单位的污染/生病/怪癖 → 城镇存档。回填口径同样由结算与撤退共用。
function syncConditionsFrom(battle: BattleState): void {
  useTownStore.getState().syncBattleConditions(
    battle.playerIds.map((id) => {
      const a = battle.combatants[id] as Ally;
      return { charId: a.charId, pollution: a.pollution, sick: a.sick, quirks: a.quirks };
    }),
  );
}

function syncPartyStatsFrom(battle: BattleState): void {
  for (const id of battle.playerIds) {
    syncMemberStats((battle.combatants[id] as Ally).charId);
  }
}

// 战斗结束: 回填血量 / 结算积分与经验 / 推进会话。
export function resolveBattle(get: () => RunState, set: RunSet): void {
  if (get().screen !== "battle") return; // 幂等护栏: 防重复触发重复发经验
  if (get().battleSettled) return;
  const battle = useBattleStore.getState().battle;
  const session = useExploreStore.getState().session;
  if (!battle || !session?.pendingEncounterId) return;
  if (battle.phase !== "won" && battle.phase !== "lost") return;

  const won = battle.phase === "won";
  const challengeBonus = won ? earnedChallengeBonus(battle) : 0;
  const bountyHunterStacks = battle.playerIds.reduce((total, id) => {
    const status = getStatus(battle.combatants[id], "bountyHunter");
    return total + (status?.stacks ?? 0);
  }, 0);
  const bountyBonus = won ? bountyHunterStacks * 0.3 : 0;
  const lastDropK = dropCoefficient(session, challengeBonus, bountyBonus);
  const lastDropTier = energyTier(session.energy);
  const lastChallenges = battle.challenges.map((run) => ({ ...run }));
  // ★ 从战斗单位而非遭遇战定义里取敌人 defId —— 遭遇战改造器(EncounterModifier.extraEnemies)
  //   追加进来的敌人不在 EncounterDef.enemies 里, 也要计入经验与掉落。
  const enemyDefIds = battle.enemyIds
    .filter((id) => !(battle.combatants[id] as Enemy).fled)
    .map((id) => (battle.combatants[id] as Enemy).enemyDefId);

  syncConditionsFrom(battle);

  const wasBoss = session.pendingIsBoss;
  // 档位同样要在 settleBattle 之前取快照 —— finishBattle 会把 pendingBattleTier 清空。
  const battleTier = session.pendingBattleTier;
  const explore = useExploreStore.getState();
  explore.settleBattle(won, survivorsFrom(battle, session), enemyDefIds, challengeBonus, bountyBonus, battle.round);
  settleFallenGear();
  syncPartyStatsFrom(battle);
  // 战斗消耗(explore/core/exploreRules.ts energyPerBattleRound + energyPerBattleTier): 打得越久、档位越高, 粒子掉得越多。
  // ★ 必须在 settleBattle 之后 —— 掉落系数/经验倍率读的是战前能量, 提前扣会削掉本场收益。
  // ★ BOSS 战豁免(胜负均不扣): 那一场打完远征就结束了。
  if (!wasBoss) explore.spendBattleEnergy(battle.round, battleTier);
  const after = useExploreStore.getState().session;

  if (!won) {
    if (wasBoss) return settleRetreatScreen(set);
    // 战败即团灭。背包已在 settleBattle 里丢干净, 这里只把寄回的落袋。
    if (after) bankEverything(after, set);
    set({
      screen: "defeat",
      lastResult: "lost",
      lastClearReward: [],
      expReport: [],
      lastLoot: 0,
      lastDrops: [],
      ...CLEARED_BATTLE_REPORT,
    });
    return;
  }

  // 经验按能量档位倍率即时入账(与积分不同 —— 积分要活着回城才落袋, 经验打完就是你的)
  const mult = rewardMultiplier(session.energy);
  const baseExp = enemyDefIds.reduce((sum, id) => sum + getEnemyDef(id).exp, 0);
  const expReport = useTownStore.getState().grantExp(
    session.party.filter((p) => p.alive).map((p) => p.charId),
    Math.round(baseExp * mult),
  );
  useExploreStore.getState().recordExpGain(expReport.reduce((total, gain) => total + gain.gained, 0));

  set({
    screen: "battle",
    battleSettled: true,
    expReport,
    lastResult: "won",
    lastLoot: (after?.loot ?? 0) - session.loot,
    lastDrops: after?.pendingLoot ?? [],
    lastDropK,
    lastDropTier: {
      tier: lastDropTier.tier,
      name: lastDropTier.name,
      color: lastDropTier.color,
      rewardMultiplier: lastDropTier.rewardMultiplier,
    },
    lastChallengeBonus: challengeBonus,
    lastBountyBonus: bountyBonus,
    lastChallenges,
  });
}

// 重新开始这场战斗。战果只在 resolveBattle 才回填探索层, 所以此刻 session.party 仍是
// **进战前**的三段生命 —— 直接照它重新建局即可, 不需要任何回滚。
// ⚠ launchBattle 里的 applyPendingContamination 在首次建局时已把待结算污染消费干净,
//   这里拿到的是空请求, 不会重复污染卡组。
// ⓘ battleStore.init 会把 seq +1, BattleScreen 的 [battleSeq] effect 随即取消在途 timeline、
//   清定时器并重置全部分镜/手牌状态 —— 与「换一场战斗」同一条路径, 故演出播放中重开也安全。
export function restartBattle(get: () => RunState): void {
  if (get().screen !== "battle" || get().battleSettled) return;
  const battle = useBattleStore.getState().battle;
  if (!battle || battle.phase === "won" || battle.phase === "lost") return;
  const session = useExploreStore.getState().session;
  if (!session?.pendingEncounterId) return;
  launchBattle(session.pendingEncounterId);
}

// 战斗中撤退 = 本场作废 + 整趟远征就此收尾。落袋与结算走的是和探索页撤离**完全相同**
// 的那条路(bankEverything → victory 页 + lastResult: "retreat"), 只是入口不同。
export function retreatFromBattle(get: () => RunState, set: RunSet): void {
  if (get().screen !== "battle" || get().battleSettled) return;
  const battle = useBattleStore.getState().battle;
  if (!battle || battle.phase === "won" || battle.phase === "lost") return;
  const session = useExploreStore.getState().session;
  if (!session) return;

  syncConditionsFrom(battle);
  useExploreStore.getState().retreatFromBattle(survivorsFrom(battle, session));
  settleFallenGear();
  syncPartyStatsFrom(battle);
  settleRetreatScreen(set);
}

// 战斗小结确认 → 回探索场景, 或(BOSS 战胜)进通关结算。
export function confirmExpReport(set: RunSet): void {
  const session = useExploreStore.getState().session;
  if (!session) return set({ screen: "town" });
  if (session.pendingLoot.length || session.pendingBoons.length || session.pendingCardOffer) return;

  if (session.phase === "cleared") {
    const reward = settleClear(set);
    if (!reward) return;
    useBattleStore.getState().clear();
    set({ screen: "victory", lastResult: "won", lastClearReward: reward, ...CLEARED_BATTLE_REPORT });
    return;
  }
  useBattleStore.getState().clear();
  set({ screen: "explore", expReport: [], ...CLEARED_BATTLE_REPORT });
}
