import type { NodeEventKind } from "@/explore/types";

export const eventKindLabel: Record<NodeEventKind, string> = {
  hazard: "风险事件",
  loot: "成长事件",
  heal: "生存事件",
  merchant: "经济事件",
  route: "路线事件",
  energy: "能量事件",
  retreat: "撤离事件",
  battle: "战斗事件",
  empty: "空节点",
};