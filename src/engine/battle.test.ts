import { describe, it, expect } from "vitest";
import { createBattle, playCard, endRound, getStatus, RULES } from "./index";
import type { AllyInit, BattleSetup, BattleState } from "./index";
import { CHARACTERS, makeCard } from "../data";

function allies(): AllyInit[] {
  return CHARACTERS.map((c) => ({
    id: c.id,
    charId: c.id,
    name: c.name,
    emoji: c.emoji,
    maxHp: c.maxHp,
    threat: c.threat,
  }));
}

// 用同种卡填充牌库, 使手牌内容可预测(与随机种子无关)
function deckOf(cardId: string, n: number) {
  return Array.from({ length: n }, () => makeCard(cardId));
}

function battleWith(deckCardId: string): BattleState {
  const setup: BattleSetup = { allies: allies(), deck: deckOf(deckCardId, RULES.hand.size) };
  return createBattle("e1", setup, 42);
}

describe("战斗初始化", () => {
  it("回合1/时刻1, 补满手牌, 法力水晶=每回合量, 2 个敌人", () => {
    const b = battleWith("spark");
    expect(b.round).toBe(1);
    expect(b.tick).toBe(RULES.timeline.startTick);
    expect(b.hand.length).toBe(RULES.hand.size);
    expect(b.resources.mana).toBe(RULES.resource.perRound);
    expect(b.enemyIds.length).toBe(2);
    expect(b.playerIds.length).toBe(CHARACTERS.length);
  });
});

describe("时刻推进(核心机制)", () => {
  it("速攻牌不推进时刻", () => {
    const b = battleWith("spark"); // spark: 速攻, 造成 5 点
    const enemy = b.enemyIds[0];
    const hpBefore = b.combatants[enemy].hp;
    playCard(b, b.hand[0], enemy);
    expect(b.tick).toBe(1); // 不变
    expect(b.combatants[enemy].hp).toBe(hpBefore - 5);
  });

  it("普通牌推进 1 时刻", () => {
    const b = battleWith("shot"); // shot: 普通, 造成 7 点
    const enemy = b.enemyIds[0];
    const hpBefore = b.combatants[enemy].hp;
    playCard(b, b.hand[0], enemy);
    expect(b.tick).toBe(2); // +1
    expect(b.combatants[enemy].hp).toBe(hpBefore - 7);
  });
});

describe("状态: 中毒在回合开始结算", () => {
  it("毒箭施加中毒, 下回合开始扣血且层数-1", () => {
    const b = battleWith("poisonarrow"); // 造成3 + 中毒3
    const slime0 = "slime#0";
    playCard(b, b.hand[0], slime0);
    expect(b.combatants[slime0].hp).toBe(30 - 3);
    expect(getStatus(b.combatants[slime0], "poison")?.stacks).toBe(3);

    endRound(b); // 敌人冲刷行动 → 进入第2回合 → 中毒结算
    expect(b.round).toBe(2);
    expect(b.combatants[slime0].hp).toBe(27 - 3); // 中毒再扣 3
    expect(getStatus(b.combatants[slime0], "poison")?.stacks).toBe(2);
  });
});

describe("回合结束冲刷: 未行动的敌人各打一次", () => {
  it("两个史莱姆都攻击最高仇恨的剑士", () => {
    const b = battleWith("guard"); // guard 是自我护盾, 不推进时刻, 不伤敌
    // 玩家不做任何输出直接结束回合
    endRound(b);
    // 剑士(仇恨16)被两个史莱姆各撞 6 点
    expect(b.combatants["swordsman"].hp).toBe(70 - 12);
  });
});
