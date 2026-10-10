import { GROWTH_BALANCE as balance } from "../rules/growthBalance";
import type { CurioKind } from "@/explore/corridor/types";
import type { CurioDef } from "../types";

export const GROWTH_CURIOS = {
  bondWorkbench: {
    name: "紫晶织梦机", role: "service", verb: "重织", size: 210,
    description: `消耗任意临期食品 ${balance.bondFood} 份，重新编织一条随机装备羁绊；指定系别时只在该系别内重掷，消耗翻倍。装备属性和完美度保持不变，选择装备后才扣款。`,
    decisions: [{ id: "bond", label: "选择装备重织羁绊", story: "紫晶梭开始读取装备上的羁绊纹路，等待小队指定目标。",
      effects: [{ type: "TUNE_EQUIPMENT", mode: "bond", foodCost: balance.bondFood }] }],
  },
  perfectnessWorkbench: {
    name: "萤光记忆坛", role: "service", verb: "回溯", size: 215,
    description: `消耗任意临期食品共 ${balance.perfectnessFood} 份，重新随机装备完美度。保留羁绊与负面代价，尽量沿原属性方向增减数值；结果可能变好或变差。选择装备后才扣款。`,
    decisions: [{ id: "calibrate", label: "选择装备回溯记忆", story: "坛上的星球缓缓转动，准备让装备回想起锻造时的样子，等待小队指定目标。",
      effects: [{ type: "TUNE_EQUIPMENT", mode: "perfectness", foodCost: balance.perfectnessFood }] }],
  },
} satisfies Partial<Record<CurioKind, CurioDef>>;
