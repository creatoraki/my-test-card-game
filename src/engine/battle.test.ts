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
    const b = battleWith("whirlwind-slash");
    expect(b.round).toBe(1);
    expect(b.tick).toBe(RULES.timeline.startTick);
    expect(b.hand.length).toBe(RULES.hand.size);
    expect(b.resources.mana).toBe(RULES.resource.perRound);
    expect(b.enemyIds.length).toBe(2);
    expect(b.playerIds.length).toBe(CHARACTERS.length);
  });
});

describe("时刻推进(核心机制)", () => {
  it("普通牌推进 1 时刻", () => {
    const b = battleWith("whirlwind-slash"); // 回旋斩: 普通, 对全体造成 8 点
    const enemy = b.enemyIds[0];
    const hpBefore = b.combatants[enemy].hp;
    playCard(b, b.hand[0], enemy);
    expect(b.tick).toBe(2); // +1
    expect(b.combatants[enemy].hp).toBe(hpBefore - 8);
  });
});

describe("回合结束冲刷: 未行动的敌人各打一次", () => {
  it("两个史莱姆都攻击最高仇恨的剑士", () => {
    const b = battleWith("whirlwind-slash");
    // 玩家不做任何输出直接结束回合
    endRound(b);
    // 剑士(仇恨16)被两个史莱姆各撞 6 点
    expect(b.combatants["swordsman"].hp).toBe(70 - 12);
  });
});
