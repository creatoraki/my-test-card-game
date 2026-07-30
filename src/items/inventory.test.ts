// 物品层。断言集中在三件事:
//   ① 占格换算 —— 32 格背包的容量口径, 也是负重惩罚的输入;
//   ② 视觉排布 —— 跨 2 格的装备不许跨行, 行末塞不下要留 gap;
//   ③ 掉落 —— finalChance > 1 时的「整数保底 + 小数再掷」, 以及品质在族内的右移。

import { describe, expect, it } from "vitest";
import { getItemDef, getItemFamily, makeItemStack } from "../data";
import { pickByQuality, rollCount, rollDropTable } from "./drops";
import { addToContainer, layoutBackpack, occupiedSlots, removeByUid } from "./inventory";
import type { ItemRarity } from "./types";

const stack = (id: string) => makeItemStack(id);

describe("占格", () => {
  it("装备占 2 格, 其余占 1 格", () => {
    expect(occupiedSlots([stack("scrap-piece")], getItemDef)).toBe(1);
    expect(occupiedSlots([stack("armor-plate-c")], getItemDef)).toBe(2);
    expect(occupiedSlots([stack("scrap-piece"), stack("prybar-c")], getItemDef)).toBe(3);
  });

  it("容量满了就溢出, 不会静默丢弃", () => {
    const full = Array.from({ length: 31 }, () => stack("scrap-piece"));
    // 剩 1 格, 收得下 1 格的废件, 收不下 2 格的装备
    const a = addToContainer(full, [stack("armor-plate-c")], getItemDef, 32);
    expect(a.taken).toHaveLength(0);
    expect(a.overflow).toHaveLength(1);

    const b = addToContainer(full, [stack("scrap-piece")], getItemDef, 32);
    expect(b.taken).toHaveLength(1);
    expect(b.overflow).toHaveLength(0);
    expect(occupiedSlots(b.next, getItemDef)).toBe(32);
  });

  it("不传容量 = 无上限(仓库)", () => {
    const many = Array.from({ length: 200 }, () => stack("armor-plate-c"));
    const r = addToContainer([], many, getItemDef);
    expect(r.overflow).toHaveLength(0);
    expect(occupiedSlots(r.next, getItemDef)).toBe(400);
  });

  it("removeByUid 找不到时原样返回(调用方靠引用判断成败)", () => {
    const list = [stack("scrap-piece")];
    expect(removeByUid(list, "不存在")).toBe(list);
    expect(removeByUid(list, list[0].uid)).toHaveLength(0);
  });
});

describe("背包排布", () => {
  it("至少铺满容量, 空位补 empty", () => {
    const cells = layoutBackpack([stack("scrap-piece")], getItemDef, 32, 8);
    expect(cells).toHaveLength(32);
    expect(cells[0].kind).toBe("item");
    expect(cells[1].kind).toBe("empty");
  });

  // 行末让出的 gap 是视觉格、不计入 occupiedSlots ⇒ 总格数可能超过 32。
  // 这时**宁可多画一行也不能截断**, 否则最后一件东西会整个消失。
  it("满包 + 行末 gap 时不截断, 补齐到整行", () => {
    const stacks = [
      ...Array.from({ length: 7 }, () => stack("scrap-piece")),
      stack("armor-plate-c"), // 行末塞不下 ⇒ 留一个 gap 再换行
      ...Array.from({ length: 23 }, () => stack("scrap-piece")),
    ];
    expect(occupiedSlots(stacks, getItemDef)).toBe(32);
    const cells = layoutBackpack(stacks, getItemDef, 32, 8);
    expect(cells.length).toBeGreaterThan(32);
    expect(cells.length % 8).toBe(0);
    // 32 件东西一件都没少
    expect(cells.filter((c) => c.kind === "item")).toHaveLength(31);
  });

  it("跨 2 格的装备后面跟一个 covered —— 渲染时要跳过, 否则整行会被挤下去", () => {
    const cells = layoutBackpack([stack("armor-plate-c")], getItemDef, 32, 8);
    expect(cells[0]).toMatchObject({ kind: "item", span: 2 });
    expect(cells[1].kind).toBe("covered");
    expect(cells[2].kind).toBe("empty");
  });

  it("行末塞不下 2 格装备时先留 gap 再换行 —— 装备不跨行", () => {
    // 前 7 格放废件, 第 8 格(行末)放不下装备
    const stacks = [...Array.from({ length: 7 }, () => stack("scrap-piece")), stack("prybar-c")];
    const cells = layoutBackpack(stacks, getItemDef, 32, 8);
    expect(cells[7].kind).toBe("gap"); // 行末那一格被让出来
    expect(cells[8]).toMatchObject({ kind: "item", span: 2 }); // 装备从下一行行首开始
    expect(cells[9].kind).toBe("covered");
  });
});

describe("掉落", () => {
  it("finalChance > 1 时整数部分保底, 小数部分再掷一次", () => {
    const rng = { rngState: 12345 };
    // 1.0 × 2 = 2.0 ⇒ 恒定两次, 小数部分为 0 不再掷
    expect(rollCount(rng, 1, 2)).toBe(2);
    // 0.6 × 1 ⇒ 只可能是 0 或 1
    for (let i = 0; i < 50; i++) expect([0, 1]).toContain(rollCount(rng, 0.6, 1));
    // 1.6 ⇒ 只可能是 1 或 2(必掉 1 件 + 60% 再掉 1 件)
    for (let i = 0; i < 50; i++) expect([1, 2]).toContain(rollCount(rng, 0.8, 2));
  });

  it("同种子的掉落逐件复现", () => {
    const table = [
      { kind: "item" as const, itemId: "scrap-piece", chance: 0.6, min: 1, max: 2 },
      { kind: "family" as const, familyId: "armor-plate", chance: 0.8 },
    ];
    const ctx = {
      weights: { common: 60, fine: 25, rare: 10, epic: 4, legendary: 1 } as Record<
        ItemRarity,
        number
      >,
      getDef: getItemDef,
      getFamily: getItemFamily,
      makeStack: (id: string, n: number) => makeItemStack(id, n),
    };
    const run = () => rollDropTable({ rngState: 777 }, table, 1.5, ctx).map((s) => s.itemId);
    expect(run()).toEqual(run());
  });

  it("品质权重右移: 高档位掉同族里更好的货", () => {
    const family = getItemFamily("armor-plate");
    const count = (weights: Record<ItemRarity, number>) => {
      const rng = { rngState: 99 };
      let good = 0;
      for (let i = 0; i < 400; i++) {
        if (pickByQuality(rng, family, weights).rarity !== "common") good += 1;
      }
      return good;
    };
    const low = count({ common: 85, fine: 14, rare: 1, epic: 0, legendary: 0 });
    const high = count({ common: 38, fine: 43, rare: 15, epic: 3, legendary: 1 });
    expect(high).toBeGreaterThan(low);
  });

  it("整族权重都为 0 时退回最低档, 不掉空", () => {
    const family = getItemFamily("armor-plate");
    const def = pickByQuality({ rngState: 1 }, family, {
      common: 0,
      fine: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
    });
    expect(def.rarity).toBe("common");
  });
});
