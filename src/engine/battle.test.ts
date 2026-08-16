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
  partyInitiative,
  defenseMultiplier,
  RULES,
} from "./index";
import type { AllyInit, BattleSetup, BattleState } from "./index";
import { CHARACTERS, makeCard } from "../data";
import { dealDamage } from "./ops";

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
  return createBattle("n-crew", setup, 42);
}

describe("战斗初始化", () => {
  it("回合1/时刻1, 抽开局张数, 法力水晶=每回合量, 2 个敌人", () => {
    const b = battleWith("swordsman-basic-attack");
    expect(b.round).toBe(1);
    expect(b.tick).toBe(RULES.timeline.startTick);
    // 第 1 回合抽 partyOpeningDrawCount 张(抽到手牌上限为止)
    expect(b.hand.length).toBe(Math.min(partyOpeningDrawCount(b), partyHandLimit(b)));
    expect(b.resources.mana).toBe(RULES.resource.perRound);
    expect(b.enemyIds.length).toBe(2);
    expect(b.playerIds.length).toBe(CHARACTERS.length);
  });

  it("我方面板来自角色基础值, 不含任何等级/加点来源", () => {
    const b = battleWith("swordsman-basic-attack");
    const sw = b.combatants["swordsman"];
    expect(sw.maxHp).toBe(50);
    expect(statOf(sw, "attack")).toBe(20);
    expect(statOf(sw, "defense")).toBe(10);
    expect(statOf(sw, "initiative")).toBe(20);
  });
});

describe("属性口径", () => {
  it("防御 10 ⇒ 减伤 10/(10+30)", () => {
    const b = battleWith("swordsman-basic-attack");
    expect(defenseMultiplier(b.combatants["swordsman"])).toBeCloseTo(1 - 10 / 40, 6);
  });

  it("命中率截断在 5%~100% 之间", () => {
    const b = battleWith("swordsman-basic-attack");
    const sw = b.combatants["swordsman"];
    const enemy = b.combatants[b.enemyIds[0]];
    const p = hitChance(b, sw, enemy);
    expect(p).toBeGreaterThanOrEqual(RULES.combat.hitFloorPct);
    expect(p).toBeLessThanOrEqual(RULES.combat.hitCeilPct);
  });

  // 负重是我方自己背的包 —— 它只削我方命中与小队先手, 不影响闪避和暴击。
  it("负重只扣我方命中与先手", () => {
    const light = battleWith("swordsman-basic-attack");
    const heavy = { ...battleWith("swordsman-basic-attack"), burden: 20 };
    const sw = heavy.combatants["swordsman"];
    const enemy = heavy.combatants[heavy.enemyIds[0]];

    expect(
      hitChance(light, light.combatants["swordsman"], light.combatants[light.enemyIds[0]]) -
        hitChance(heavy, sw, enemy),
    ).toBeCloseTo(10, 6);
    expect(critChance(heavy, sw)).toBe(statOf(sw, "critRate"));
    expect(hitChance(heavy, enemy, sw)).toBe(
      hitChance(light, light.combatants[light.enemyIds[0]], light.combatants["swordsman"]),
    );
    expect(partyInitiative(light) - partyInitiative(heavy)).toBeCloseTo(4, 6);
  });

  it("粒子污染放大攻击伤害, 且闪避加成受 70% 封顶", () => {
    const clean = createBattle(
      "n-crew",
      { allies: allies(), deck: deckOf("swordsman-basic-attack") },
      42,
      { enemyStatuses: [] },
    );
    const polluted = createBattle(
      "n-crew",
      { allies: allies(), deck: deckOf("swordsman-basic-attack") },
      42,
      { enemyStatuses: [{ id: "pollution", stacks: 4 }] },
    );
    const cleanEnemy = clean.combatants[clean.enemyIds[0]];
    const pollutedEnemy = polluted.combatants[polluted.enemyIds[0]];
    const cleanAlly = clean.combatants["swordsman"];
    const pollutedAlly = polluted.combatants["swordsman"];

    dealDamage(clean, cleanEnemy.id, cleanAlly.id, 10, { isAttack: true, mustHit: true, fixed: true });
    dealDamage(polluted, pollutedEnemy.id, pollutedAlly.id, 10, {
      isAttack: true,
      mustHit: true,
      fixed: true,
    });
    expect(cleanAlly.hp - pollutedAlly.hp).toBe(2);
    expect(hitChance(polluted, pollutedAlly, pollutedEnemy)).toBe(
      hitChance(clean, cleanAlly, cleanEnemy) - 20,
    );

    pollutedEnemy.statuses[0].stacks = 20;
    expect(hitChance(polluted, pollutedAlly, pollutedEnemy)).toBe(
      Math.max(
        RULES.combat.hitFloorPct,
        RULES.combat.baseHitChance +
          statOf(pollutedAlly, "hitRate") +
          statOf(pollutedAlly, "precision") -
          RULES.combat.probCapPct,
      ),
    );
  });

  it("概率类属性最终值封顶在 probCapPct", () => {
    const b = battleWith("swordsman-basic-attack");
    const sw = b.combatants["swordsman"];
    sw.mods = { flat: { critRate: 500 } };
    expect(statOf(sw, "critRate")).toBe(RULES.combat.probCapPct);
  });
});

describe("时刻推进(核心机制)", () => {
  it("普通牌推进 1 时刻并造成倍率伤害", () => {
    const b = battleWith("swordsman-basic-attack"); // 普通攻击: 普通牌, 0.9 倍攻击力
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
    const b = battleWith("swordsman-basic-attack");
    const before = b.combatants["swordsman"].hp;
    endRound(b);
    // ★ 无仇恨 —— 敌人随机选目标; 单人上阵时两次都落在剑士身上。
    // 具体掉血受命中/暴击/格挡影响, 只断言"确实挨打了"。
    expect(b.combatants["swordsman"].hp).toBeLessThan(before);
  });
});

describe("小队资源", () => {
  it("手牌上限与抽牌数 = 上阵角色求和 + 全队修正", () => {
    const b = battleWith("swordsman-basic-attack");
    const sumHand = b.playerIds.reduce((s, id) => s + b.combatants[id].stats.handLimit, 0);
    const sumDraw = b.playerIds.reduce((s, id) => s + b.combatants[id].stats.drawCount, 0);
    expect(partyHandLimit(b)).toBe(sumHand + RULES.hand.baseHandLimit);
    expect(partyDrawCount(b)).toBe(sumDraw + RULES.hand.partyBonusDrawCount);
  });
});
