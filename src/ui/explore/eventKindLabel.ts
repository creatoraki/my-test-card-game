import type { EventCategory, NodeEventKind } from "@/explore/types";

export const eventKindLabel: Record<NodeEventKind, string> = {
  hazard: "风险事件",
  loot: "成长事件",
  heal: "生存事件",
  merchant: "经济事件",
  route: "路线事件",
  energy: "能量事件",
  retreat: "撤离事件",
  battle: "战斗事件",
  trial: "挑战事件",
  empty: "空节点",
};

export const eventCategoryLabel: Record<EventCategory, string> = {
  survival: "生存",
  growth: "成长",
  economy: "交易",
  route: "路线",
  energy: "能量",
  hazard: "风险",
  battle: "战斗",
  endgame: "终局",
  trial: "挑战",
  empty: "空节点",
};
