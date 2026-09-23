import type { CurioKind } from "@/explore/corridor/types";
import type { CurioDef } from "../types";

export const SERVICE_CURIOS = {
  dispatch: {
    name: "安全投递柜",
    role: "service",
    verb: "启用",
    size: 250,
    description: "投递柜仍与据点相连。打开后可从背包选择物品寄回，已寄出的物品不会因团灭丢失。",
    decisions: [{
      id: "send",
      label: "开启投递口",
      story: "投递柜的远程锁定解除，里面的物品可以安全寄回据点。",
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
