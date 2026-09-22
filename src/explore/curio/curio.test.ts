import { describe, expect, it } from "vitest";
import { CORRIDOR_CURIOS } from "@/data/curios";
import { makeItemStack } from "@/data";
import type { CurioDecision } from "@/data/curios/types";
import { matchOffering } from "./offering";
import { canSelectFor, visibleDecisions } from "./visibility";
import { buyFromMerchant, createMerchantShelf } from "./merchant";
import { chooseCurioDecision, selectForCurio } from "./resolve";
import { resolveFailure } from "./failure";
import { curioAtLevel, scaleEffect } from "./leveling";
import { enterRoom } from "../dungeon/session";
import { openCorridorObject } from "../corridor/session";
import { isRoomExplored } from "../dungeon/session";
import { createSession } from "../session";
import { interactionCost } from "../energyCost";
import type { ExploreState, PartySnapshot } from "../types";
import type { CurioKind } from "../corridor/types";

const party: PartySnapshot[] = [
  { charId: "swordsman", name: "剑士", emoji: "⚔️", hp: 100, hpLimit: 100, maxHp: 100, alive: true, burdenAdapt: 0 },
  { charId: "prophet", name: "预言家", emoji: "🔮", hp: 100, hpLimit: 100, maxHp: 100, alive: true, burdenAdapt: 0 },
];

function sessionWith(kind: CurioKind, backpack: ReturnType<typeof makeItemStack>[] = [], mapId = "tutorial"): ExploreState {
  const s = createSession(mapId, party, 123, backpack);
  const room = s.dungeon!.rooms[s.dungeon!.currentRoomId];
  room.curios[0].kind = kind;
  if (kind === "merchant") room.curios[0].shelf = createMerchantShelf(s, []);
  return s;
}

function openFirst(s: ExploreState): void {
  const room = s.dungeon!.rooms[s.dungeon!.currentRoomId];
  enterRoom(s, room.id);
  s.corridor!.playerX = s.corridor!.objects[0].x;
  expect(openCorridorObject(s, s.corridor!.objects[0].id)).toBe(true);
}

describe("物件选物匹配", () => {
  it("必须完全匹配种类和数量", () => {
    const recipe = [[{ match: { itemIds: ["bread"] }, count: 2 }]];
    expect(matchOffering(recipe, [makeItemStack("bread", 2)])).toBe(true);
    expect(matchOffering(recipe, [makeItemStack("bread", 2), makeItemStack("milk")])).toBe(false);
  });

  it("喂养选项只在背包有足量对应食物时出现，熔合需凑齐三件装备才可点", () => {
    const s = sessionWith("modBench", [makeItemStack("bread", 2)]);
    const ids = visibleDecisions(s, CORRIDOR_CURIOS.modBench).map((decision) => decision.id);
    expect(ids).toContain("feedBeetle");
    const fuse = CORRIDOR_CURIOS.modBench.decisions.find((decision) => decision.id === "fuseEquipment")!;
    expect(canSelectFor(s, fuse)).toBe(false);
    s.backpack = [];
    expect(visibleDecisions(s, CORRIDOR_CURIOS.modBench).some((decision) => decision.id === "feedBeetle")).toBe(false);
  });

  it("所选物品不符合配方时不结算、不扣物品也不扣粒子", () => {
    const s = sessionWith("modBench", [makeItemStack("milk")]);
    openFirst(s);
    const before = s.energy;
    expect(selectForCurio(s, "fuseEquipment", "swordsman", [{ uid: s.backpack[0].uid, count: 1 }])).toBe(false);
    expect(s.backpack).toHaveLength(1);
    expect(s.corridor!.objects[0].used).toBe(false);
    expect(s.energy).toBe(before);
  });
});

describe("隐藏失败与门槛", () => {
  const decision: CurioDecision = {
    id: "test",
    label: "测试",
    story: "成功",
    effects: [],
    failure: {
      chance: 1,
      story: "失败",
      effects: [],
      mitigations: [
        { when: { kind: "job", charId: "prophet" }, chanceDelta: -1 },
        { when: { kind: "item", match: { itemIds: ["cola"] } }, convert: { story: "转化", effects: [] } },
      ],
    },
  };

  it("执行者职业门槛可以把失败率压到 0", () => {
    const s = sessionWith("safe");
    expect(resolveFailure(s, decision.failure, 1, "swordsman").failed).toBe(true);
    expect(resolveFailure(s, decision.failure, 1, "prophet").failed).toBe(false);
  });

  it("只负责转化的物品门槛在失败发生时才消耗 1 个", () => {
    const s = sessionWith("safe", [makeItemStack("cola", 2)]);
    const outcome = resolveFailure(s, decision.failure, 1, "swordsman");
    expect(outcome.converted?.story).toBe("转化");
    expect(s.backpack[0].count).toBe(1);
    resolveFailure(s, decision.failure, 1, "prophet");
    expect(s.backpack[0].count).toBe(1);
  });

  it("失败后结算失败文案，并扣除交互粒子", () => {
    // 新手关关闭了交互失败，这里改用普通地图。
    const s = sessionWith("safe", [], "neon-city");
    openFirst(s);
    const target = CORRIDOR_CURIOS.safe.decisions[0];
    const original = target.failure;
    target.failure = { chance: 1, story: "测试失败", effects: [] };
    try {
      const before = s.energy;
      const cost = interactionCost(s);
      expect(chooseCurioDecision(s, target.id, "prophet")).toBe(true);
      expect(s.pendingStory).toEqual(["测试失败"]);
      expect(s.energy).toBe(before - cost);
    } finally {
      target.failure = original;
    }
  });
});

describe("物件等级", () => {
  it("高等级放大奖励数量与惩罚", () => {
    const s = sessionWith("safe");
    const gain = scaleEffect(s, { type: "GAIN_POOL_ITEM", pool: "scrap", count: 2 }, 5);
    expect(gain.type === "GAIN_POOL_ITEM" && gain.count).toBeGreaterThanOrEqual(4);
    const hurt = scaleEffect(s, { type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.1 }, 5);
    expect(hurt.type === "DAMAGE_MEMBER_PERCENT" && hurt.percent).toBeCloseTo(0.2);
  });

  it("5 级手写覆写只在 5 级生效", () => {
    const low = curioAtLevel(CORRIDOR_CURIOS.safe, 4).decisions[0];
    const high = curioAtLevel(CORRIDOR_CURIOS.safe, 5).decisions[0];
    expect(low.effects.some((effect) => effect.type === "GRANT_EQUIP")).toBe(false);
    expect(high.effects.some((effect) => effect.type === "GRANT_EQUIP")).toBe(true);
  });
});

describe("货商房间", () => {
  it("货商不影响房间已探索判定，货架固定六格", () => {
    const s = sessionWith("merchant");
    const room = s.dungeon!.rooms[s.dungeon!.currentRoomId];
    const shelf = room.curios[0].shelf!;
    expect(shelf.slots).toHaveLength(6);
    expect(shelf.foods).toHaveLength(2);
    expect(new Set(shelf.foods).size).toBe(2);
    expect(shelf.slots.every((slot) => shelf.foods.includes(slot.price.itemId))).toBe(true);
    expect(isRoomExplored(room)).toBe(true);
  });

  it("货架商品买完即空，不能重复购买", () => {
    const s = sessionWith("merchant");
    const room = s.dungeon!.rooms[s.dungeon!.currentRoomId];
    const shelf = room.curios[0].shelf!;
    const payment = shelf.slots[0].price;
    s.backpack = [makeItemStack(payment.itemId, payment.count)];
    enterRoom(s, room.id);
    s.corridor!.objects[0].kind = "merchant";
    s.corridor!.objects[0].used = false;
    s.corridor!.activeObjectId = s.corridor!.objects[0].id;
    s.phase = "shopping";
    expect(buyFromMerchant(s, 0)).toBe(true);
    expect(buyFromMerchant(s, 0)).toBe(false);
  });
});
