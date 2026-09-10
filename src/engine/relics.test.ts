import { describe, expect, it } from "vitest";
import { CHARACTERS, getItemDef, makeCard } from "../data";
import { createBattle, fireRelic, type AllyInit, type BattleSetup } from "./index";
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
  it("every=2 只在第 2、4 次回合开始结算", () => {
    const setup: BattleSetup = {
      allies: allies(),
      deck: Array.from({ length: 20 }, () => makeCard("swordsman-basic-attack")),
      relics: ["relic-even-draw"],
    };
    const battle = createBattle("n-t1-scout", setup, 42);
    const initial = battle.hand.length;
    fireRelic(battle, { type: "roundStart" });
    expect(battle.hand.length).toBe(initial);
    fireRelic(battle, { type: "roundStart" });
    expect(battle.hand.length).toBe(initial + 1);
    fireRelic(battle, { type: "roundStart" });
    expect(battle.hand.length).toBe(initial + 1);
    fireRelic(battle, { type: "roundStart" });
    expect(battle.hand.length).toBe(initial + 2);
    expect(battle.relics[0].counter).toBe(0);
  });

  it("递归触发超过安全深度后停止", () => {
    const id = "relic-safety-latch";
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
