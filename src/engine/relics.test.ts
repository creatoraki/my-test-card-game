import { describe, expect, it } from "vitest";
import { CHARACTERS, getItemDef, makeCard } from "../data";
import { createBattle, fireRelic, startRound, type AllyInit, type BattleSetup } from "./index";
import { ops } from "./ops";

function allies(): AllyInit[] {
  return CHARACTERS.map((character) => ({
    id: character.id,
    charId: character.id,
    name: character.name,
    emoji: character.emoji,
    stats: character.base,
  }));
}

describe("遗物触发", () => {
  it("旧式发条只在 3 的倍数回合开始额外抽牌", () => {
    const setup: BattleSetup = {
      allies: allies(),
      deck: Array.from({ length: 20 }, () => makeCard("swordsman-basic-attack")),
      relics: ["relic-old-clockwork"],
    };
    const battle = createBattle("n-t1-scout", setup, 42);
    const initial = battle.hand.length;
    startRound(battle);
    expect(battle.hand.length).toBe(initial + 2);
    startRound(battle);
    expect(battle.hand.length).toBe(initial + 5);
  });

  it("递归触发超过安全深度后停止", () => {
    const id = "relic-sport-shoes";
    const def = getItemDef(id);
    const originalSpec = def.relic;
    const originalDealDamage = ops.dealDamage;
    let calls = 0;
    def.relic = {
      polarity: "blessing",
      scope: "battle",
      on: "enemyKilled",
      effects: [{ type: "DAMAGE", amount: 1, target: "self" }],
    };
    const battle = createBattle(
      "n-t1-scout",
      { allies: allies(), deck: [makeCard("swordsman-basic-attack")], relics: [id] },
      42,
    );
    const mockedDealDamage: typeof ops.dealDamage = (state, sourceId, targetId, amount, options) => {
      calls += 1;
      ops.fireRelic(state, { type: "enemyKilled", targetId });
      return null;
    };
    ops.dealDamage = mockedDealDamage;
    try {
      fireRelic(battle, { type: "enemyKilled", targetId: battle.enemyIds[0] });
      expect(calls).toBeLessThan(10);
    } finally {
      ops.dealDamage = originalDealDamage;
      def.relic = originalSpec;
    }
  });
});
