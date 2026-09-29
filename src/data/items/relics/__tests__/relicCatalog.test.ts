// 遗物目录一致性 —— 守住 data/items/relics/index.ts 顶部约定的标准格式。
import { describe, expect, it } from "vitest";
import { BOSS_ENEMIES } from "@/data/enemies";
import { RELIC_BEHAVIORS } from "@/engine/relics/relicBehaviors";
import { EXPLORE_RELIC_BEHAVIORS } from "@/explore/relics/relicBehaviors";
import { EXPLORE_MODIFIER_RELIC_IDS } from "@/explore/relics/relicModifiers";
import type { ItemDef } from "@/items/types";
import { relicChannelOf } from "@/items/types";
import { RANDOM_RELIC_POOL, RELIC_ITEM_DEFS } from "..";

// 说明文字里不允许出现的获取途径 / 生命周期措辞 —— 这些信息由 channel 与实例标记表达。
const FORBIDDEN_DESC = /所得|获得途径|来源|仅本趟|本趟远征有效|一次性物品/;

function hasDeclarativeMechanic(def: ItemDef): boolean {
  const spec = def.relic;
  return Boolean(spec?.mods || spec?.squadMods || spec?.effects?.length);
}

describe("遗物目录", () => {
  it("id 唯一且以 relic- 开头", () => {
    const ids = RELIC_ITEM_DEFS.map((def) => def.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id.startsWith("relic-")).toBe(true);
  });

  it("说明文字只写效果并以句号结尾", () => {
    for (const def of RELIC_ITEM_DEFS) {
      expect(def.desc.endsWith("。"), def.id).toBe(true);
      expect(FORBIDDEN_DESC.test(def.desc), def.id).toBe(false);
    }
  });

  it("每件遗物至少有一种效果实现", () => {
    for (const def of RELIC_ITEM_DEFS) {
      const implemented =
        hasDeclarativeMechanic(def) ||
        def.id in RELIC_BEHAVIORS ||
        def.id in EXPLORE_RELIC_BEHAVIORS ||
        EXPLORE_MODIFIER_RELIC_IDS.includes(def.id);
      expect(implemented, def.id).toBe(true);
    }
  });

  it("随机池只含普通渠道的祝福遗物", () => {
    for (const def of RANDOM_RELIC_POOL) {
      expect(def.relic?.polarity, def.id).toBe("blessing");
      expect(def.relic && relicChannelOf(def.relic), def.id).toBe("normal");
    }
  });

  it("首领掉落限定的遗物必须出现在首领掉落表里", () => {
    const bossDropped = new Set(
      BOSS_ENEMIES.flatMap((enemy) => enemy.dropTable ?? []).flatMap((entry) =>
        entry.kind === "item" ? [entry.itemId] : [],
      ),
    );
    for (const def of RELIC_ITEM_DEFS) {
      if (def.relic && relicChannelOf(def.relic) === "bossDrop") expect(bossDropped.has(def.id), def.id).toBe(true);
    }
  });
});
