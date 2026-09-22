// 交互失败拉响的警报: 结算期间只登记档位, 玩家确认结算回到场景后才生成守卫战,
// 避免遭遇演出打断结算面板与待拾取物品。
import { corridorAlarmEvent } from "../../data/curios";
import type { BattleTier, ExploreState } from "../types";
import { spawnCorridorEncounter } from "./ambush";

export function queueAlarm(s: ExploreState, tier: BattleTier): void {
  if (s.corridor) s.corridor.pendingAlarm = tier;
}

/** 回到场景(atNode)后调用: 有待触发的警报就立刻进入守卫战遭遇。 */
export function releasePendingAlarm(s: ExploreState): boolean {
  const corridor = s.corridor;
  const tier = corridor?.pendingAlarm;
  if (!corridor || !tier || s.phase !== "atNode") return false;
  corridor.pendingAlarm = undefined;
  return spawnCorridorEncounter(s, corridorAlarmEvent(tier), corridor.playerX, corridor.facing);
}
