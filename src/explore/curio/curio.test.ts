import { describe, expect, it } from "vitest";
import { CORRIDOR_CURIOS } from "@/data/curios";
import { makeItemStack } from "@/data";
import { matchOffering } from "./offering";
import { canOfferAny, visibleDecisions } from "./visibility";
import { buyFromMerchant, createMerchantShelf } from "./merchant";
import { offerToCurio } from "./resolve";
import { chooseCurioDecision } from "./resolve";
import { enterRoom } from "../dungeon/session";
import { openCorridorObject } from "../corridor/session";
import { isRoomExplored } from "../dungeon/session";
import { createSession } from "../session";
import type { ExploreState, PartySnapshot } from "../types";

const party: PartySnapshot[] = [
  { charId: "swordsman", name: "剑士", emoji: "⚔️", hp: 100, hpLimit: 100, maxHp: 100, alive: true, burdenAdapt: 0 },
  { charId: "prophet", name: "预言家", emoji: "🔮", hp: 100, hpLimit: 100, maxHp: 100, alive: true, burdenAdapt: 0 },
];

function sessionWith(kind: "safe" | "modBench" | "merchant", backpack: ReturnType<typeof makeItemStack>[] = []): ExploreState {
  const s = createSession("tutorial", party, 123, backpack);
  const room = s.dungeon!.rooms[s.dungeon!.currentRoomId];
  room.curios[0].kind = kind;
  if (kind === "merchant") room.curios[0].shelf = createMerchantShelf(s, []);
  return s;
}

describe("物件放入匹配", () => {
  it("必须完全匹配种类和数量", () => {
    const recipe = [[{ match: { itemIds: ["bread"] }, count: 2 }]];
    expect(matchOffering(recipe, [makeItemStack("bread", 2)])).toBe(true);
    expect(matchOffering(recipe, [makeItemStack("bread", 2), makeItemStack("milk")])).toBe(false);
  });

  it("职业门槛只对存活队员显示，背包满足条件才显示放入入口", () => {
    const s = sessionWith("modBench", [makeItemStack("bread", 2)]);
    expect(visibleDecisions(s, CORRIDOR_CURIOS.modBench).some((decision) => decision.id === "breadModule")).toBe(true);
    expect(canOfferAny(s, CORRIDOR_CURIOS.modBench)).toBe(true);
    s.party[0].alive = false;
    expect(visibleDecisions(s, CORRIDOR_CURIOS.modBench).some((decision) => decision.id === "fuseEquipment")).toBe(true);
  });

  it("放错物品会被吞掉并让物件耗尽，同时扣除交互粒子", () => {
    const s = sessionWith("modBench", [makeItemStack("milk")]);
    const room = s.dungeon!.rooms[s.dungeon!.currentRoomId];
    enterRoom(s, room.id);
    s.corridor!.playerX = s.corridor!.objects[0].x;
    expect(openCorridorObject(s, s.corridor!.objects[0].id)).toBe(true);
    const before = s.energy;
    expect(offerToCurio(s, [{ uid: s.backpack[0].uid, count: 1 }])).toBe(true);
    expect(s.backpack).toHaveLength(0);
    expect(s.corridor!.objects[0].used).toBe(true);
    expect(s.energy).toBe(before - 2);
  });

  it("兜底风险按物件自己的概率判定", () => {
    const s = sessionWith("safe");
    const room = s.dungeon!.rooms[s.dungeon!.currentRoomId];
    enterRoom(s, room.id);
    s.corridor!.playerX = s.corridor!.objects[0].x;
    expect(openCorridorObject(s, s.corridor!.objects[0].id)).toBe(true);
    const decision = CORRIDOR_CURIOS.safe.decisions[0];
    const originalRisk = decision.risk;
    decision.risk = { chance: 1, effects: originalRisk?.effects ?? [] };
    try {
      expect(chooseCurioDecision(s, decision.id)).toBe(true);
      expect(s.pendingNotes).toContain("黑盒的反应比预期更糟");
    } finally {
      decision.risk = originalRisk;
    }
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
