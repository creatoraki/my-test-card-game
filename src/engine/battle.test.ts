import { describe, it, expect } from "vitest";
import {
  createBattle,
  playCard,
  endRound,
  partyHandLimit,
  partyDrawCount,
  partyOpeningDrawCount,
  statOf,
  hitChance,
  critChance,
  defenseMultiplier,
  RULES,
} from "./index";
import type { AllyInit, BattleSetup, BattleState } from "./index";
import { CHARACTERS, makeCard } from "../data";

function allies(): AllyInit[] {
  return CHARACTERS.map((c) => ({
    id: c.id,
    charId: c.id,
    name: c.name,
    emoji: c.emoji,
    stats: c.base,
  }));
}

// 用同种卡填充牌库, 使手牌内容可预测(与随机种子无关)
function deckOf(cardId: string, n: number) {
  return Array.from({ length: n }, () => makeCard(cardId));
}

function battleWith(deckCardId: string, n = 12): BattleState {
  const setup: BattleSetup = { allies: allies(), deck: deckOf(deckCardId, n) };
  return createBattle("e1", setup, 42);
}

describe("战斗初始化", () => {
  it("回合1/时刻1, 抽开局张数, 法力水晶=每回合量, 2 个敌人", () => {
    const b = battleWith("whirlwind-slash");
    expect(b.round).toBe(1);
    expect(b.tick).toBe(RULES.timeline.startTick);
    // 第 1 回合抽 partyOpeningDrawCount 张(抽到手牌上限为止)
    expect(b.hand.length).toBe(Math.min(partyOpeningDrawCount(b), partyHandLimit(b)));
    expect(b.resources.mana).toBe(RULES.resource.perRound);
    expect(b.enemyIds.length).toBe(2);
    expect(b.playerIds.length).toBe(CHARACTERS.length);
  });

  it("我方面板来自角色基础值, 不含任何等级/加点来源", () => {
    const b = battleWith("whirlwind-slash");
    const sw = b.combatants["swordsman"];
    expect(sw.maxHp).toBe(50);
    expect(statOf(sw, "attack")).toBe(20);
    expect(statOf(sw, "defense")).toBe(10);
    expect(statOf(sw, "initiative")).toBe(10);
  });
});

describe("属性口径", () => {
  it("防御 10 ⇒ 减伤 10/(10+50)", () => {
    const b = battleWith("whirlwind-slash");
    expect(defenseMultiplier(b.combatants["swordsman"])).toBeCloseTo(1 - 10 / 60, 6);
  });

  it("命中率截断在 5%~100% 之间", () => {
    const b = battleWith("whirlwind-slash");
    const sw = b.combatants["swordsman"];
    const enemy = b.combatants[b.enemyIds[0]];
    const p = hitChance(b, sw, enemy);
    expect(p).toBeGreaterThanOrEqual(RULES.combat.hitFloorPct);
    expect(p).toBeLessThanOrEqual(RULES.combat.hitCeilPct);
  });

  // 负重是我方自己背的包 —— 它只该削我方的命中/暴击, 不该顺手削掉敌人的。
  it("负重只扣我方: 我方命中下降, 敌人打我方反而更准", () => {
    const light = battleWith("whirlwind-slash");
    const heavy = { ...battleWith("whirlwind-slash"), burdenPenalty: 20 };
    const sw = heavy.combatants["swordsman"];
    const enemy = heavy.combatants[heavy.enemyIds[0]];

    // 我方进攻: 命中被扣 20 个百分点
    expect(hitChance(light, light.combatants["swordsman"], light.combatants[light.enemyIds[0]]) - hitChance(heavy, sw, enemy)).toBeCloseTo(20, 6);
    // 我方暴击同样被扣, 且不会被扣成负数
    expect(critChance(heavy, sw)).toBe(Math.max(0, statOf(sw, "critRate") - 20));
    expect(critChance(heavy, enemy)).toBe(statOf(enemy, "critRate")); // 敌人不受影响
    // 敌人进攻我方: 我方闪避被扣 ⇒ 敌人更容易命中(但闪避先钳到 0, 不会反向加成)
    expect(hitChance(heavy, enemy, sw)).toBeGreaterThanOrEqual(
      hitChance(light, light.combatants[light.enemyIds[0]], light.combatants["swordsman"]),
    );
  });

  it("概率类属性最终值封顶在 probCapPct", () => {
    const b = battleWith("whirlwind-slash");
    const sw = b.combatants["swordsman"];
    sw.mods = { flat: { critRate: 500 } };
    expect(statOf(sw, "critRate")).toBe(RULES.combat.probCapPct);
  });
});

describe("时刻推进(核心机制)", () => {
  it("普通牌推进 1 时刻并造成倍率伤害", () => {
    const b = battleWith("lightning-infused"); // 雷灌: 普通牌, 1.0 倍攻击力
    const enemyId = b.enemyIds[0];
    const enemy = b.combatants[enemyId];
    const hpBefore = enemy.hp;
    playCard(b, b.hand[0], enemyId);
    expect(b.tick).toBe(2); // +1
    // 剑士攻击力 20, 敌人有 0~5 点防御 ⇒ 掉血在 (0, 20] 之间(可能因闪避为 0, 因暴击更高)
    expect(enemy.hp).toBeLessThanOrEqual(hpBefore);
    expect(hpBefore - enemy.hp).toBeLessThanOrEqual(Math.round(20 * 1.5));
  });

  it("速攻牌不推进时刻", () => {
    const b = battleWith("quick-slash"); // 疾刺: fast
    playCard(b, b.hand[0], b.enemyIds[0]);
    expect(b.tick).toBe(RULES.timeline.startTick);
  });
});

describe("回合结束冲刷: 未行动的敌人各打一次", () => {
  it("玩家不出牌直接过合, 会挨两次攻击", () => {
    const b = battleWith("whirlwind-slash");
    const before = b.combatants["swordsman"].hp;
    endRound(b);
    // ★ 无仇恨 —— 敌人随机选目标; 单人上阵时两次都落在剑士身上。
    // 具体掉血受命中/暴击/格挡影响, 只断言"确实挨打了"。
    expect(b.combatants["swordsman"].hp).toBeLessThan(before);
  });
});

describe("小队资源", () => {
  it("手牌上限与抽牌数 = 上阵角色求和 + 全队修正", () => {
    const b = battleWith("whirlwind-slash");
    const sumHand = b.playerIds.reduce((s, id) => s + b.combatants[id].stats.handLimit, 0);
    const sumDraw = b.playerIds.reduce((s, id) => s + b.combatants[id].stats.drawCount, 0);
    expect(partyHandLimit(b)).toBe(sumHand + RULES.hand.partyBonusHandLimit);
    expect(partyDrawCount(b)).toBe(sumDraw + RULES.hand.partyBonusDrawCount);
  });
});
