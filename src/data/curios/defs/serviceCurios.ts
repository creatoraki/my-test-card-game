import type { CurioKind } from "@/explore/corridor/types";
import { EXPLORE_RULES } from "@/explore/core/exploreRules";
import type { CurioDef } from "../types";

export const SERVICE_CURIOS = {
  blacksmith: {
    name: "锻造师",
    role: "service",
    verb: "交谈",
    size: 390,
    description: "锻造师提供两种随机卡牌服务。每次相遇只能选择一种，费用以临期食品支付。",
    persistent: true,
    decisions: [],
  },
  dispatch: {
    name: "羽翼信使",
    role: "service",
    verb: "启用",
    size: 320,
    description: `支付 ${EXPLORE_RULES.chute.foodCost} 个食品，可投递最多 ${EXPLORE_RULES.chute.maxItems} 件物品回城。物品存放在额外包裹中，回城后统一结算，团灭也不会丢失。`,
    decisions: [{
      id: "send",
      label: "委托投递",
      story: "羽翼信使展开收件口，请选择投递物品和用于支付的食品。",
      effects: [{ type: "OPEN_CHUTE" }],
    }],
  },
  merchant: {
    name: "流浪货商",
    role: "service",
    verb: "查看",
    size: 220,
    description: "货商把一辆旧推车停在房间角落，六个货架格位里摆着装备、卡牌和奇怪的补给。",
    persistent: true,
    decisions: [],
  },
} satisfies Partial<Record<CurioKind, CurioDef>>;
