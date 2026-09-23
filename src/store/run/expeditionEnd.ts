// 远征收尾 —— 落袋、通关奖励与结算页切换。撤离 / 通关 / 团灭 / 战中撤退都从这里出去。

import { getItemDef } from "@/data";
import { relicScrapSellBonus } from "@/explore/relics/relicModifiers";
import type { ExploreState } from "@/explore/types";
import type { ItemStack } from "@/items/types";
import { useBattleStore } from "../battle/battleStore";
import { commitTownBackup } from "./expeditionBackup";
import { applyPendingContamination, settleFallenGear } from "../explore/exploreAftermath";
import { useExploreStore } from "../explore/exploreStore";
import { SORTIE_RELIC_LIMIT } from "../sortie/sortieStore";
import { useTownStore } from "../town/townStore";
import { CLEARED_BATTLE_REPORT, type RunSet, type RunState } from "./types";

// 远征收尾的落袋 —— 积分 + 实物一起进城镇, 只有这一个出口。
// ★ 团灭时 session.backpack 与 session.loot 已被 explore/session loseEverything 清零,
//   所以这里**无条件**调用即可: 惩罚的真相点只在 EXPLORE_RULES.wipe 一处, 不在这里再判一次。
//   投递口寄回的 shipped 不受团灭影响, 因此照样入仓 —— 那是背包玩法唯一的保险手段(§6.5)。
// ★ 生命三段的前两段一并落档: 撤离/通关/团灭都走这里, 所以「打掉的血与体力极限跨日传承」
//   这条规则只有这一个出口。阵亡成员不再回填, 由 markFallen 接管。
export function bankEverything(session: ExploreState, set: RunSet): void {
  const town = useTownStore.getState();
  town.syncExpeditionStatus(
    session.party.filter((member) => member.alive).map((member) => ({
      charId: member.charId,
      hp: member.hp,
      hpLimit: member.hpLimit,
      // 污染值始终由城镇侧即时维护，这里在回城时和最终 HP 一起明确落档。
      pollution: town.characters[member.charId]?.pollution ?? 0,
    })),
  );
  const fallenIds = session.party.filter((member) => !member.alive).map((member) => member.charId);
  if (fallenIds.length) town.markFallen(fallenIds);
  town.bankLoot(session.loot);
  if (session.phase !== "wiped") {
    // 团灭时背包已被 loseEverything 清空，记录空数组会把上一次有效的默认配置抹掉。
    town.recordSortieRelics(
      session.backpack
        .filter((stack) => !stack.disposable && getItemDef(stack.itemId).category === "relic")
        .map((stack) => stack.itemId)
        .slice(0, SORTIE_RELIC_LIMIT),
    );
  }
  // 配额物资在探索途中仍可使用，故不能提前删除；这里是远征结束时统一销毁它们的唯一真相点。
  // ★ 换金物在这一步**直接变现**(town.depositHaul), 不进仓库 —— 它带回据点后本来就只有
  //   「去回收台卖掉」一条路; 其余物资照旧入仓。结算页展示的换金价值用同一套 sellPriceOf 现算。
  town.depositHaul(
    [...session.shipped, ...session.backpack].filter((stack) => !stack.disposable),
    relicScrapSellBonus(session),
  );
  const exp = town.grantExpEach(useExploreStore.getState().consumePendingExp());
  useExploreStore.getState().recordExpGain(exp.reduce((total, gain) => total + gain.gained, 0));
  if (exp.length) set({ expReport: exp });
  // 探索期对 townStore 的散点写入到这里才正式落袋, 同时提交出击快照。
  commitTownBackup();
}

// 撤离结算页(探索页撤离、战斗中撤退、BOSS 战败共用)。
// ⚠ 这里**刻意不写 expReport** —— bankEverything 刚把本趟的经验结算写进来,
//   在这个 set 里带上 expReport: [] 会当场清掉它。
export function settleRetreatScreen(set: RunSet): void {
  const session = useExploreStore.getState().session;
  if (session) bankEverything(session, set);
  useBattleStore.getState().clear();
  set({ screen: "victory", lastResult: "retreat", ...CLEARED_BATTLE_REPORT });
}

// BOSS 通关: 领取每日通关奖励并入账, 标记通关。返回本趟的通关奖励(结算页单独标注来源)。
export function settleClear(set: RunSet): ItemStack[] | null {
  const session = useExploreStore.getState().session;
  if (!session) return null;
  const town = useTownStore.getState();
  const reward = town.takeDailyClearReward(session.mapId, session.difficulty);
  useExploreStore.getState().receiveClearReward(reward);
  const rewardedSession = useExploreStore.getState().session;
  if (!rewardedSession) return null;
  bankEverything(rewardedSession, set);
  town.markMapCleared(session.mapId);
  town.markDifficultyCleared(session.mapId, session.difficulty);
  return reward;
}

// 会话自己走到了终局(主动撤离 / 事件掉血团灭 / 通关)时由 ExploreScreen 调用。
// 撤离与通关一样落袋; 团灭时 session.loot 已被清零, 这里照样 bank 即可,
// 不必再判一次 —— 惩罚的真相点只有 EXPLORE_RULES.wipe 一处。
export function finishExpedition(get: () => RunState, set: RunSet): void {
  if (get().screen !== "explore") return; // 幂等护栏: 同一趟只结算一次
  const session = useExploreStore.getState().session;
  if (!session) return set({ screen: "town" });
  if (session.phase !== "wiped" && session.phase !== "retreated" && session.phase !== "cleared") return;

  applyPendingContamination(session.party.map((p) => p.charId));
  settleFallenGear();
  const settledSession = useExploreStore.getState().session;
  if (!settledSession) return set({ screen: "town" });

  if (settledSession.phase === "wiped") {
    // 团灭: session.backpack 已被 loseEverything 清空, 但**投递口寄回的仍然算数**(§6.5)。
    bankEverything(settledSession, set);
    set({ screen: "defeat", lastResult: "lost", expReport: [], lastLoot: 0, lastDrops: [], ...CLEARED_BATTLE_REPORT });
    return;
  }
  if (settledSession.phase === "cleared") {
    const reward = settleClear(set);
    if (!reward) return;
    set({ lastClearReward: reward, screen: "victory", lastResult: "won" });
    return;
  }
  bankEverything(settledSession, set);
  set({ screen: "victory", lastResult: "retreat", lastClearReward: [] });
}
