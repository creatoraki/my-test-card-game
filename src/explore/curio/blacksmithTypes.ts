import type { Card } from "@/engine";

export type BlacksmithService = "draw" | "replace" | "remove" | "copy";

export interface BlacksmithResult {
  charId: string;
  before?: Card;
  after?: Card;
}

/** 抽牌候选: 全队混合抽, 每张带归属角色。 */
export interface BlacksmithOffer {
  charId: string;
  card: Card;
}

/**
 * 随房间保存。换牌 / 删牌 / 复制: 选择服务即付费并锁定(paid)，之后在卡组面板里选人选卡；
 * 抽牌: 选择服务即付费并直接生成全队混合候选进入 drawing(不选人)，候选不能通过重新打开刷新。
 * 放弃不退款，直接 completed 且没有 result。
 */
export interface BlacksmithState {
  services: [BlacksmithService, BlacksmithService];
  status: "available" | "paid" | "drawing" | "completed";
  selected?: BlacksmithService;
  offers?: BlacksmithOffer[];
  result?: BlacksmithResult;
}

export const BLACKSMITH_SERVICES = {
  draw: { name: "三选一抽牌", food: 1, description: "从全队角色卡池混合抽出三张候选，领取一张加入对应角色的卡组。" },
  replace: { name: "换牌", food: 3, description: "将一张卡牌替换为随机普通卡，原卡及其模组会被移除。" },
  remove: { name: "删牌", food: 2, description: "删除一张卡牌及其模组，卡组不能低于最小张数。" },
  copy: { name: "卡牌复制", food: 3, description: "复制一张干净的同名卡，不继承模组与污染，遵守卡组数量限制。" },
} as const;
