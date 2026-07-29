// 探索会话。断言集中在三件事:
//   ① 阶段机(revealing → choosing → routing → resolving/inBattle → 下一段)不会被跳步或绕过;
//   ② 每段终点的**保底规则**成立(设计文档 §2.3) —— 这是「每段都有得选」的唯一保障;
//   ③ 能量档位、血量继承、团灭清算这些跨系统的口子表现稳定。

import { describe, expect, it } from "vitest";
import { EXPLORE_RULES, ENERGY_TIERS } from "./rules";
import {
  canOpenBackpack,
  chooseEntry,
  createSession,
  encounterModifier,
  energyTier,
  finishBattle,
  finishReveal,
  finishRouting,
  landedEvent,
  nextSegment,
  projectedEnergy,
  retreat,
  rewardMultiplier,
} from "./session";
import type { ExploreState, PartySnapshot } from "./types";

const PARTY: PartySnapshot[] = [
  { charId: "swordsman", name: "剑士", emoji: "⚔️", hp: 70, maxHp: 70, alive: true },
];

function newSession(seed = 1): ExploreState {
  return createSession("neon-city", PARTY.map((p) => ({ ...p })), seed);
}

// 走完一段: 展示 → 选 lane 口 → 走线 → 落点结算。返回是否落在了战斗终点。
function runSegment(s: ExploreState, lane = 0): boolean {
  finishReveal(s);
  chooseEntry(s, lane);
  finishRouting(s);
  return s.phase === "inBattle";
}

describe("建局", () => {
  it("开局即生成第 1 段, 处于展示阶段", () => {
    const s = newSession();
    expect(s.phase).toBe("revealing");
    expect(s.segment).toBe(1);
    expect(s.segmentCount).toBe(6);
    expect(s.energy).toBe(EXPLORE_RULES.startingEnergy);
    expect(s.board).not.toBeNull();
    expect(s.board!.events).toHaveLength(EXPLORE_RULES.laneCount);
  });

  it("同种子两次建局完全一致", () => {
    expect(newSession(2024).board).toEqual(newSession(2024).board);
  });

  it("队伍是拷贝 —— 改会话不会污染传进来的快照", () => {
    const party = PARTY.map((p) => ({ ...p }));
    const s = createSession("neon-city", party, 1);
    s.party[0].hp = 1;
    expect(party[0].hp).toBe(70);
  });
});

describe("终点事件保底(设计文档 §2.3)", () => {
  // 把一整趟远征的每一段都过一遍, 逐段检查保底 —— 单看第 1 段说明不了问题。
  function eachBoard(seed: number, fn: (s: ExploreState) => void): void {
    const s = newSession(seed);
    while (s.phase !== "retreated" && s.phase !== "wiped" && s.phase !== "cleared") {
      fn(s);
      if (runSegment(s)) {
        // 落到战斗终点: 直接判胜, 回到 resolving 继续推进
        finishBattle(s, true, [{ charId: "swordsman", hp: 70, alive: true }], 2);
      }
      if (s.phase !== "resolving") break; // BOSS 通关 / 撤离 / 团灭都在这里收尾
      nextSegment(s);
    }
  }

  it("每段恰好 5 个终点, 且互不重复", () => {
    for (let seed = 1; seed <= 20; seed++) {
      eachBoard(seed, (s) => {
        const ids = s.board!.events.map((e) => e.id);
        expect(ids).toHaveLength(EXPLORE_RULES.laneCount);
        expect(new Set(ids).size).toBe(ids.length);
      });
    }
  });

  it("每段至少各有一个生存 / 成长 / 战斗终点", () => {
    for (let seed = 1; seed <= 20; seed++) {
      eachBoard(seed, (s) => {
        const cats = s.board!.events.map((e) => e.category);
        // BOSS 接入后 endgame 会占两格, 但那两格本身就含撤离与战斗, 三条保底仍然照排
        expect(cats).toContain("survival");
        expect(cats).toContain("growth");
        expect(cats.some((c) => c === "battle" || c === "endgame")).toBe(true);
      });
    }
  });

  it("纯负面每段最多 1 个, 纯负面 + 高风险合计最多 2 个", () => {
    for (let seed = 1; seed <= 20; seed++) {
      eachBoard(seed, (s) => {
        const risks = s.board!.events.map((e) => e.risk).filter(Boolean);
        expect(risks.filter((r) => r === "negative").length).toBeLessThanOrEqual(1);
        expect(risks.length).toBeLessThanOrEqual(2);
      });
    }
  });

  it("未实现的事件(disabled)不参与抽取", () => {
    for (let seed = 1; seed <= 20; seed++) {
      eachBoard(seed, (s) => {
        expect(s.board!.events.some((e) => e.disabled)).toBe(false);
      });
    }
  });

  it("事件的 minSegment 被尊重 —— 精英不会出现在开局段", () => {
    for (let seed = 1; seed <= 20; seed++) {
      eachBoard(seed, (s) => {
        for (const e of s.board!.events) {
          expect(e.minSegment ?? 1).toBeLessThanOrEqual(s.segment);
        }
      });
    }
  });

  it("BOSS 接入后, BOSS 接入点与撤离升降机必现", () => {
    const s = newSession(5);
    while (s.segment < 5 && s.phase !== "retreated" && s.phase !== "wiped") {
      if (runSegment(s)) finishBattle(s, true, [{ charId: "swordsman", hp: 70, alive: true }], 2);
      if (s.phase !== "resolving") break;
      nextSegment(s);
    }
    if (s.segment >= 5 && s.board) {
      expect(s.bossAvailable).toBe(true);
      const ids = s.board.events.map((e) => e.id);
      expect(ids).toContain("boss-uplink");
      expect(ids).toContain("evac-lift");
    }
  });

  it("能量跌到枯竭档时撤离升降机必现 —— 玩家永远有把东西带回去的机会", () => {
    const s = newSession(11);
    s.energy = 5; // 第 5 档
    s.segment = 3;
    // 重新生成一段以应用当前能量
    finishReveal(s);
    chooseEntry(s, 0);
    finishRouting(s);
    if (s.phase === "inBattle") {
      finishBattle(s, true, [{ charId: "swordsman", hp: 70, alive: true }], 2);
    }
    s.energy = 5;
    nextSegment(s);
    expect(energyTier(s.energy).tier).toBe(5);
    expect(s.board!.events.map((e) => e.id)).toContain("evac-lift");
  });
});

describe("阶段机", () => {
  it("展示阶段不能选入口 —— 必须先等计时结束", () => {
    const s = newSession();
    expect(chooseEntry(s, 0)).toBe(false);
    expect(finishReveal(s)).toBe(true);
    expect(s.phase).toBe("choosing");
    expect(chooseEntry(s, 0)).toBe(true);
    expect(s.phase).toBe("routing");
  });

  it("越界或被封锁的入口选不了", () => {
    const s = newSession();
    finishReveal(s);
    s.board!.blockedLanes = [2];
    expect(chooseEntry(s, -1)).toBe(false);
    expect(chooseEntry(s, 5)).toBe(false);
    expect(chooseEntry(s, 2)).toBe(false);
    expect(s.phase).toBe("choosing");
  });

  it("选入口时就定下落点, 走线只是把它演出来", () => {
    const s = newSession();
    finishReveal(s);
    chooseEntry(s, 3);
    expect(s.entryLane).toBe(3);
    expect(s.exitLane).not.toBeNull();
    finishRouting(s);
    expect(landedEvent(s)).toBe(s.board!.events[s.exitLane!]);
  });

  it("⚠ 展示与走线途中禁止开背包(设计文档 §6.3 的硬约束)", () => {
    const s = newSession();
    expect(canOpenBackpack(s)).toBe(false); // revealing
    finishReveal(s);
    expect(canOpenBackpack(s)).toBe(true); // choosing
    chooseEntry(s, 0);
    expect(canOpenBackpack(s)).toBe(false); // routing
  });

  it("推进一段扣掉基础能量, 并把结果回填进本段记录", () => {
    const s = newSession(3);
    while (runSegment(s)) {
      finishBattle(s, true, [{ charId: "swordsman", hp: 70, alive: true }], 2);
    }
    if (s.phase !== "resolving") return; // 撤离/团灭的段直接跳过这条
    const before = s.energy;
    const skipped = s.skipSegmentCost;
    nextSegment(s);
    expect(s.energy).toBe(Math.max(0, before - (skipped ? 0 : EXPLORE_RULES.energyPerSegment)));
    expect(s.history[0].energyAfter).toBe(s.energy);
  });

  it("走完全部段数即视为自行撤离, 收益照常带回", () => {
    const s = newSession(9);
    s.loot = 88;
    s.segment = s.segmentCount;
    finishReveal(s);
    chooseEntry(s, 0);
    finishRouting(s);
    if (s.phase === "inBattle") {
      finishBattle(s, true, [{ charId: "swordsman", hp: 70, alive: true }], 2);
    }
    if (s.phase === "resolving") nextSegment(s);
    expect(["retreated", "cleared"]).toContain(s.phase);
    expect(s.loot).toBeGreaterThanOrEqual(88);
  });

  it("主动撤离只在可操作的阶段允许, 且保留全部积分", () => {
    const s = newSession();
    expect(retreat(s)).toBe(false); // revealing
    finishReveal(s);
    s.loot = 120;
    expect(retreat(s)).toBe(true);
    expect(s.phase).toBe("retreated");
    expect(s.loot).toBe(120);
  });
});

describe("净化粒子", () => {
  it("档位边界: 80/60/40/20/0 分别落在第 1..5 档", () => {
    expect(energyTier(100).tier).toBe(1);
    expect(energyTier(80).tier).toBe(1);
    expect(energyTier(79).tier).toBe(2);
    expect(energyTier(60).tier).toBe(2);
    expect(energyTier(59).tier).toBe(3);
    expect(energyTier(40).tier).toBe(3);
    expect(energyTier(39).tier).toBe(4);
    expect(energyTier(20).tier).toBe(4);
    expect(energyTier(19).tier).toBe(5);
    expect(energyTier(0).tier).toBe(5);
  });

  it("倍率随档位单调递增 —— 越危险越值钱是整套取舍的前提", () => {
    for (let i = 1; i < ENERGY_TIERS.length; i++) {
      expect(ENERGY_TIERS[i].rewardMultiplier).toBeGreaterThan(ENERGY_TIERS[i - 1].rewardMultiplier);
    }
    expect(rewardMultiplier(100)).toBe(ENERGY_TIERS[0].rewardMultiplier);
    expect(rewardMultiplier(0)).toBe(ENERGY_TIERS[4].rewardMultiplier);
  });

  it("预测值 = 当前能量减去本段基础消耗, 不会低于 0", () => {
    const s = newSession();
    expect(projectedEnergy(s)).toBe(s.energy - EXPLORE_RULES.energyPerSegment);
    s.energy = 4;
    expect(projectedEnergy(s)).toBe(0);
    s.skipSegmentCost = true;
    expect(projectedEnergy(s)).toBe(4);
  });

  it("遭遇改造随档位加码, BOSS 还要额外吃血量缩放", () => {
    const fillers = ["scrap-bot", "radio-bot"];
    // EncounterModifier 的字段都是可选的(引擎侧允许只改一部分), 故断言前先兜底成空数组。
    const extras = (energy: number, boss: boolean) =>
      encounterModifier(energy, boss, fillers).extraEnemies?.length ?? 0;

    expect(extras(0, false)).toBeGreaterThan(extras(100, false));
    expect(encounterModifier(100, true, fillers).hpMultiplier).toBe(1);
    expect(encounterModifier(0, true, fillers).hpMultiplier ?? 1).toBeGreaterThan(1);
    // 第 4 档起 BOSS 追加一个护卫
    expect(extras(0, true)).toBeGreaterThan(extras(0, false));
  });
});

describe("战斗回填与团灭", () => {
  // 强制走到一个战斗终点: 直接改会话状态比反复换种子碰运气可靠。
  function intoBattle(s: ExploreState): void {
    finishReveal(s);
    chooseEntry(s, 0);
    const battleLane = s.board!.events.findIndex((e) =>
      e.effects.some((x) => x.type === "START_BATTLE"),
    );
    s.exitLane = battleLane;
    finishRouting(s);
    expect(s.phase).toBe("inBattle");
  }

  it("战斗后血量写回队伍, 下一段以此开局", () => {
    const s = newSession();
    intoBattle(s);
    finishBattle(s, true, [{ charId: "swordsman", hp: 23, alive: true }], 2);
    expect(s.party[0].hp).toBe(23);
    expect(s.party[0].alive).toBe(true);
    expect(s.phase).toBe("resolving");
  });

  it("胜利按能量倍率结算积分", () => {
    const s = newSession();
    s.energy = 0; // 枯竭档, 倍率最高
    intoBattle(s);
    const before = s.loot;
    finishBattle(s, true, [{ charId: "swordsman", hp: 70, alive: true }], 3);
    expect(s.loot - before).toBe(Math.round(3 * EXPLORE_RULES.loot.perEnemy * rewardMultiplier(0)));
  });

  it("战斗失利 = 团灭, 积分按 wipe 规则清算", () => {
    const s = newSession();
    intoBattle(s);
    s.loot = 200;
    finishBattle(s, false, [{ charId: "swordsman", hp: 0, alive: false }], 2);
    expect(s.phase).toBe("wiped");
    expect(s.loot).toBe(Math.floor(200 * EXPLORE_RULES.wipe.lootKept));
  });

  it("非战斗阶段调用回填无效 —— 幂等护栏", () => {
    const s = newSession();
    expect(finishBattle(s, true, [], 2)).toEqual({ loot: 0 });
    expect(s.phase).toBe("revealing");
  });

  it("事件掉血也能团灭", () => {
    const s = newSession();
    s.party[0].hp = 1;
    finishReveal(s);
    chooseEntry(s, 0);
    // 直接把落点改成一个纯掉血事件
    s.board!.events[s.exitLane!] = {
      id: "test-damage",
      kind: "hazard",
      category: "hazard",
      title: "测试用塌方",
      description: "",
      energyDelta: 0,
      effects: [{ type: "DAMAGE_PARTY_PERCENT", percent: 1 }],
    };
    finishRouting(s);
    expect(s.phase).toBe("wiped");
  });
});
