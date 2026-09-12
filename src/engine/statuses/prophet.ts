import type { StatusDef } from "../types";

export const PROPHET_STATUS_DEFS: Record<string, StatusDef> = {
  zenithStar: {
    id: "zenithStar",
    name: "天顶星",
    emoji: "🌠",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "override",
    desc: "下一张带瀑布效果的牌无视费用比较触发瀑布，随后移除。",
  },
  gravityLens: {
    id: "gravityLens",
    name: "引力透镜",
    emoji: "🔭",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "override",
    desc: "下一张实际触发瀑布的牌，其瀑布效果额外结算一次，随后移除。",
  },
  drift: {
    id: "drift",
    name: "漂流",
    emoji: "🛟",
    kind: "buff",
    stackMode: "max",
    refreshMode: "override",
    desc: "瀑布触发时，获得来源治愈力 20% 的护盾。",
  },
};
