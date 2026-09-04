// demo 假数据 —— 测试页的存档通常是空的, 所以这里自造一份, 不接 useTownStore。
//
// ★ 用的全是**真实 ItemDef id**, roll 也走真实的 rollEquipment ⇒ 数值口径与线上完全一致,
//   替换正式面板时只要把数据源换成 store, 组件一行都不用改。
// ★ pick 是固定种子的线性同余, 每次刷新结果一样, 便于逐次对比排版。

import { getCharacter, getItemDef } from "@/data";
import { rollEquipment } from "@/items/equipRoll";
import type { ItemStack } from "@/items/types";

export interface DemoEquip {
  stack: ItemStack;
  /** 已被某名队员穿戴; 留空表示躺在仓库里。 */
  ownerName?: string;
}

function makePick(seed: number): (n: number) => number {
  let state = seed >>> 0;
  return (n) => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return n > 0 ? state % n : 0;
  };
}

interface DemoSpec {
  itemId: string;
  affinity?: string;
  ownerId?: string;
}

// 覆盖面: 三个槽位 / 五档稀有度 / 带负面词条的极端族 / 已满阶的传说件 / 有无羁绊。
const SPECS: DemoSpec[] = [
  { itemId: "deflection-blade-rare", affinity: "strength", ownerId: "swordsman" },
  { itemId: "glass-dagger-rare", affinity: "fool" },
  { itemId: "saber-fine" },
  { itemId: "cross-sword-fine" },
  { itemId: "heavy-cannon-epic", affinity: "judgement" },
  { itemId: "mobile-armor-rare", ownerId: "prophet" },
  { itemId: "hazmat-suit-common" },
  { itemId: "composite-armor-epic", affinity: "tower" },
  { itemId: "tactical-goggles-epic", affinity: "priestess" },
  { itemId: "life-thorn-ring-rare" },
  { itemId: "critical-prism-legendary", affinity: "chariot" }, // 已达本族最高阶
];

export const DEMO_EQUIPS: DemoEquip[] = SPECS.map((spec, index) => {
  const def = getItemDef(spec.itemId);
  return {
    stack: {
      uid: `demo-${index}`,
      itemId: spec.itemId,
      count: 1,
      affinity: spec.affinity,
      roll: rollEquipment(def, makePick(0x5eed + index * 977)),
    },
    ownerName: spec.ownerId ? getCharacter(spec.ownerId).name : undefined,
  };
});

// 仓库材料。★ 故意让「魔方」与「红色水晶」不够 —— 用来看缺料态的表现。
const MATERIAL_STOCK: [string, number][] = [
  ["standard-gear", 6],
  ["coil-spring", 5],
  ["magnet", 4],
  ["logic-cube", 2],
  ["standard-battery", 5],
  ["blue-crystal", 3],
  ["red-crystal", 1],
  ["neon-tube", 2],
];

export const DEMO_STORAGE: ItemStack[] = MATERIAL_STOCK.map(([itemId, count], index) => ({
  uid: `demo-mat-${index}`,
  itemId,
  count,
}));

/** 居民积分。够 rare/epic 的升阶, 不够传说的 2400 —— 同样是为了看不足态。 */
export const DEMO_LOOT = 1500;
