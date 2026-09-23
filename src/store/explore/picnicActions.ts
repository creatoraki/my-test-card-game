import type { PicnicResult } from "@/explore/resources/picnic";
import { applyPendingPollution } from "./exploreAftermath";
import { useExploreStore } from "./exploreStore";

/** 野餐结算后立刻落地遗物登记的污染变化(防尘口罩)，污染值属于城镇侧状态。 */
export function runPicnic(picks: Record<string, number>): PicnicResult | null {
  const result = useExploreStore.getState().picnic(picks);
  if (result) applyPendingPollution();
  return result;
}
