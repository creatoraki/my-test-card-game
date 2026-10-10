import { getItemDef } from "@/data";
import type { CurioDecision } from "@/data/curios/types";
import { WAYSTONE_RULES } from "@/data/curios/rules/serviceBalance";
import { canSelectFor, decisionLockReason, feedFoodFor } from "@/explore/curio/visibility";
import { decisionFoodNeed, serviceFoodCount } from "@/explore/curio/foodPayment";
import { expForOffer, salvageSummary, salvageYield } from "@/explore/curio/conversion";
import type { ExploreState } from "@/explore/types";
import type { ItemStack } from "@/items/types";
import { useRunStore } from "@/store/run/runStore";
import type { DossierAction, DossierIconName } from "@/ui/explore/EventDossier";

const DECISION_ICONS: DossierIconName[] = ["claim", "upgrade", "detail"];

/** 需要先挑物品的选项(配方熔合或自由投入)。 */
export function needsPicking(decision: CurioDecision): boolean {
  return Boolean(decision.select || decision.offer);
}

export function isTravelDecision(decision: CurioDecision): boolean {
  return decision.effects.some((effect) => effect.type === "WAYSTONE_TRAVEL");
}

function decisionIcon(decision: CurioDecision, index: number): DossierIconName {
  if (decision.feed || needsPicking(decision)) return "offer";
  if (isTravelDecision(decision)) return "leave";
  return DECISION_ICONS[index % DECISION_ICONS.length];
}

/** 按钮下方的小字：锁定原因优先，其次是喂养食物、食品价格与传送粒子。 */
function decisionCost(session: ExploreState, decision: CurioDecision, lock: string | null): string | undefined {
  if (lock) return lock;
  const feedFood = feedFoodFor(session, decision);
  if (feedFood && decision.feed) return `消耗 ${getItemDef(feedFood).name} ×${decision.feed.count}`;
  // 服务类选项(换卡 / 装备调校)确认目标时才扣食品, 但入口就要拦住: 否则进了面板才发现付不起。
  const foodNeed = decisionFoodNeed(decision);
  if (foodNeed > 0) return `需要临期食品 ×${foodNeed}，当前持有 ${serviceFoodCount(session)} 份`;
  if (isTravelDecision(decision)) return `净化粒子 −${WAYSTONE_RULES.travelEnergy}`;
  return undefined;
}

export function decisionAction(
  session: ExploreState,
  decision: CurioDecision,
  index: number,
  executorId: string | null,
  onSelect: (decisionId: string) => void,
  onTravel: () => void,
): DossierAction {
  const lock = decisionLockReason(session, decision);
  const foodShort = decisionFoodNeed(decision) > serviceFoodCount(session);
  return {
    id: decision.id,
    label: decision.label,
    icon: decisionIcon(decision, index),
    cost: decisionCost(session, decision, lock),
    costTone: lock || foodShort ? "red" : undefined,
    sfx: "confirm",
    disabled: !executorId
      || foodShort
      || Boolean(lock)
      || Boolean(decision.select && !canSelectFor(session, decision)),
    onClick: () => {
      if (!executorId) return;
      if (isTravelDecision(decision)) onTravel();
      else if (needsPicking(decision)) onSelect(decision.id);
      else useRunStore.getState().chooseCurio(decision.id, executorId);
    },
  };
}

/** 选物页左栏说明。 */
export function pickingLines(decision: CurioDecision): string[] {
  const offer = decision.offer;
  if (!offer) return [decision.label, "种类和数量完全符合条件时才能确认。"];
  const range = offer.max === undefined ? `至少放入 ${offer.min} 件，数量不限。` : `放入 ${offer.min}～${offer.max} 件。`;
  return [decision.label, range];
}

/** 选物页底部的结果预告；没有可预告的内容时返回 null。 */
export function offerPreview(decision: CurioDecision, stacks: ItemStack[]): string | null {
  for (const effect of decision.effects) {
    if (effect.type === "CONVERT_TO_EXP") return `预计全队每人获得经验 +${expForOffer(stacks)}`;
    if (effect.type === "SALVAGE") return `预计拆出 ${salvageSummary(salvageYield(stacks)) || "无"}`;
    if (effect.type === "PLACE_BET") {
      const coins = stacks.reduce((sum, stack) => sum + stack.count, 0);
      return `押上 ${coins} 枚钱币，押中后每枚升 ${effect.goal} 级`;
    }
  }
  return null;
}
