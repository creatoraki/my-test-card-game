import type { DecorKind, PropInfo, PropKind } from "../types";

/** 建筑尺度: 后墙满高, 前墙剖切成矮墙; 楼板有厚度, 剖面可见。 */
export const STRUCTURE = {
  wallHeight: 3,
  cutHeight: 0.62,
  wallThickness: 0.24,
  slabThickness: 0.34,
  doorHeight: 2.3,
  /** 门洞外可走的通道深度, 走到一半即触发过门。 */
  doorChannel: 1.2,
  doorTrigger: 0.45,
} as const;

export const PROP_INFO: Record<PropKind, PropInfo> = {
  filingCabinet: { name: "翻倒的档案柜", verb: "搜寻" },
  vendingMachine: { name: "故障售货机", verb: "撬开" },
  remains: { name: "探险者遗骸", verb: "检查" },
};

/** 碰撞占地 [本地 x 宽, 本地 z 深]。 */
export const PROP_FOOTPRINT: Record<PropKind, [number, number]> = {
  filingCabinet: [1.45, 1.5],
  vendingMachine: [1.05, 0.9],
  remains: [1.1, 1.3],
};

/** 装饰的默认碰撞占地; null 表示可以踩过去。可碰撞装饰带 size 时以 size 为准。 */
export const DECOR_FOOTPRINT: Record<DecorKind, [number, number] | null> = {
  desk: [1.4, 0.72],
  partition: [1.6, 0.1],
  chair: [0.62, 0.62],
  table: [1.05, 1.05],
  plant: [0.5, 0.5],
  boxes: [0.8, 0.7],
  bench: [1.7, 0.55],
  counter: [3, 0.66],
  water: [0.42, 0.42],
  shelf: [2, 0.52],
  board: null,
  elevator: null,
  stairs: [2, 4],
  pipes: null,
  extinguisher: null,
  debris: null,
  papers: null,
  puddle: null,
  glass: null,
  tape: null,
  cable: null,
  sign: null,
};
