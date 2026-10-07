import type { Card } from "@/engine";

export type BlacksmithService = "draw" | "replace" | "remove" | "copy";

export interface BlacksmithResult {
  charId: string;
  before?: Card;
  after?: Card;
}

/** 随房间保存，抽牌一经付费便锁定候选，不能通过重新打开刷新。 */
export interface BlacksmithState {
  services: [BlacksmithService, BlacksmithService];
  status: "available" | "drawing" | "completed";
  selected?: BlacksmithService;
  charId?: string;
  offers?: Card[];
  result?: BlacksmithResult;
}

export const BLACKSMITH_SERVICES = {
  draw: { name: "三选一抽牌", food: 1, description: "选择一名角色，从角色专属候选中领取一张卡牌。" },
  replace: { name: "换牌", food: 3, description: "将一张卡牌替换为随机普通卡，原卡及其模组会被移除。" },
  remove: { name: "删牌", food: 2, description: "删除一张卡牌及其模组，卡组不能低于最小张数。" },
  copy: { name: "卡牌复制", food: 3, description: "复制一张干净的同名卡，不继承模组与污染，遵守卡组数量限制。" },
} as const;
