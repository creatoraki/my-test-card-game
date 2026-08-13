// 战斗签老虎机的纯逻辑测试(探索模式设计.md §2.4)。
//
// 这里守着的都是**改一个数就会静默失效**的东西: 符号数 8(同花基线)、三条轮子不同相
// (否则三连白送)、准备卡必然回落战斗卡(否则存在避战出口)、两个限时阶段的输入白名单。

import { describe, expect, it } from "vitest";
import { getMap } from "../data";
import { EXPLORE_RULES } from "./rules";
import {
  battleModifier,
  canOpenBackpack,
  canRetreat,
  chooseSlotCard,
  createSession,
  dropCoefficient,
  finishBattle,
  leaveRegion,
  retreat,
  rewardMultiplier,
  startSlot,
  stopReel,
} from "./session";
import { buildSlot, matchBonusOf, reelIndexAt, reelSymbolAt } from "./slot";
import type { ExploreState, PartySnapshot } from "./types";

const PARTY: PartySnapshot[] = [
  { charId: "swordsman", name: "剑士", emoji: "⚔️", hp: 70, hpLimit: 70, maxHp: 70, alive: true, burdenAdapt: 0 },
];

const WIN = [{ charId: "swordsman", hp: 60, alive: true }];

function newSession(seed = 1): ExploreState {
  return createSession(
    "neon-city",
    PARTY.map((p) => ({ ...p })),
    seed,
  );
}

// 最短路径推到 slotSpinning: 不选入口直接「前往下一区域」(本轮 0 节点)。
function toSlot(s: ExploreState): void {
  s.phase = "choosingEntry";
  leaveRegion(s);
  expect(s.phase).toBe("routeDisclosure");
  expect(startSlot(s)).toBe(true);
  expect(s.phase).toBe("slotSpinning");
}

describe("转轮构造", () => {
  it("普通轮恰好 8 个符号 = 5 张战斗卡 + 3 张战前准备卡", () => {
    const s = newSession();
    const slot = buildSlot(s, "light");
    expect(slot.symbols).toHaveLength(EXPLORE_RULES.slot.symbolCount);
    expect(slot.symbols.filter((x) => x.kind === "battle")).toHaveLength(5);
    expect(slot.symbols.filter((x) => x.kind === "prep")).toHaveLength(3);
  });

  it("BOSS 轮同样 8 个符号, 且全是战斗卡 —— 符号数不齐会改掉三连基线(§2.4.4)", () => {
    const s = newSession();
    const slot = buildSlot(s, "boss");
    expect(slot.symbols).toHaveLength(EXPLORE_RULES.slot.symbolCount);
    expect(slot.symbols.every((x) => x.kind === "battle")).toBe(true);
  });

  it("地图配置的每一档转轮池都必须恰好 8 个", () => {
    const pools = getMap("neon-city").slotPoolsByTier;
    for (const tier of ["light", "medium", "heavy", "boss"] as const) {
      expect(pools[tier]).toHaveLength(EXPLORE_RULES.slot.symbolCount);
    }
  });

  it("★ 三条轮子的顺序与相位都不同 —— 同相同序时「同一时刻按三次」必出三连", () => {
    for (let seed = 1; seed <= 30; seed++) {
      const slot = buildSlot(newSession(seed), "light");
      expect(slot.reels).toHaveLength(EXPLORE_RULES.slot.reelCount);
      const orders = slot.reels.map((r) => r.order.join(","));
      expect(new Set(orders).size).toBe(orders.length);
      const offsets = slot.reels.map((r) => r.offsetMs);
      expect(new Set(offsets).size).toBe(offsets.length);
    }
  });

  it("同一种子复现同一组转轮", () => {
    const a = buildSlot(newSession(7), "light");
    const b = buildSlot(newSession(7), "light");
    expect(b.reels).toEqual(a.reels);
    expect(b.symbols.map((x) => x.id)).toEqual(a.symbols.map((x) => x.id));
  });
});

describe("转轮位置", () => {
  const { symbolMs } = EXPLORE_RULES.slot;

  it("每过一个 symbolMs 前进一格, 走满一圈回到原点", () => {
    const reel = { order: ["a", "b", "c", "d"], offsetMs: 0 };
    expect(reelSymbolAt(reel, 0, symbolMs)).toBe("a");
    expect(reelSymbolAt(reel, symbolMs, symbolMs)).toBe("b");
    expect(reelSymbolAt(reel, symbolMs * 2, symbolMs)).toBe("c");
    expect(reelSymbolAt(reel, symbolMs * 4, symbolMs)).toBe("a");
  });

  it("相位偏移等价于「这条轮子已经先转了 offsetMs」", () => {
    const base = { order: ["a", "b", "c", "d"], offsetMs: 0 };
    const shifted = { order: ["a", "b", "c", "d"], offsetMs: symbolMs * 2 };
    expect(reelSymbolAt(shifted, 0, symbolMs)).toBe(reelSymbolAt(base, symbolMs * 2, symbolMs));
  });

  it("取的是**最靠近定格线**的那一个(round 而不是 floor) —— 差半格就会与画面对不上", () => {
    const reel = { order: ["a", "b", "c", "d"], offsetMs: 0 };
    expect(reelIndexAt(reel, symbolMs * 0.4, symbolMs)).toBe(0);
    expect(reelIndexAt(reel, symbolMs * 0.6, symbolMs)).toBe(1);
  });
});

describe("同花加成(§2.4.2)", () => {
  it("全不同 = 0, 恰好对子 = +0.50, 三连 = +1.50", () => {
    expect(matchBonusOf(["a", "b", "c"])).toBe(0);
    expect(matchBonusOf(["a", "a", "c"])).toBe(EXPLORE_RULES.slot.pairBonus);
    expect(matchBonusOf(["a", "c", "a"])).toBe(EXPLORE_RULES.slot.pairBonus);
    expect(matchBonusOf(["a", "a", "a"])).toBe(EXPLORE_RULES.slot.tripleBonus);
  });

  it("尚有槽位没定住时不给任何加成", () => {
    expect(matchBonusOf(["a", "a", null])).toBe(0);
  });

  it("加成**加法**并入 K, 并在开战瞬间快照(§5.1 / §10.1)", () => {
    const s = newSession();
    toSlot(s);
    // 直接把三个槽位摆成三连 —— 这里测的是合成公式, 不是转轮手感
    const id = s.slot!.symbols.find((x) => x.kind === "battle")!.id;
    s.slot!.stopped = [id, id, id];
    s.slot!.matchBonus = matchBonusOf(s.slot!.stopped);
    s.phase = "slotChoosing";
    expect(chooseSlotCard(s, 0)).toBe(true);

    const chosen = s.slot!.symbols.find((x) => x.id === id)!;
    const expected =
      (rewardMultiplier(s.energy) + EXPLORE_RULES.slot.tripleBonus + (chosen.dropBonus ?? 0)) *
      EXPLORE_RULES.drop.kGlobal;
    expect(dropCoefficient(s)).toBeCloseTo(expected, 6);
  });

  it("战斗结算完毕后快照清零 —— 下一轮的掉落不该还带着上一轮的同花", () => {
    const s = newSession();
    toSlot(s);
    const id = s.slot!.symbols.find((x) => x.kind === "battle")!.id;
    s.slot!.stopped = [id, id, id];
    s.slot!.matchBonus = EXPLORE_RULES.slot.tripleBonus;
    s.phase = "slotChoosing";
    chooseSlotCard(s, 0);
    finishBattle(s, true, WIN, ["scrap-bot"]);
    expect(s.pendingMatchBonus).toBe(0);
    expect(s.pendingDropBonus).toBe(0);
    expect(s.slot).toBeNull();
    expect(dropCoefficient(s)).toBeCloseTo(rewardMultiplier(s.energy) * EXPLORE_RULES.drop.kGlobal, 6);
  });
});

describe("三选一与准备卡回落", () => {
  it("按 3 次暂停依次定住 3 个槽位, 第 3 次落定就进 slotChoosing", () => {
    const s = newSession();
    toSlot(s);
    expect(stopReel(s, 30)).toBe(true);
    expect(s.slot!.stopped.filter((x) => x != null)).toHaveLength(1);
    expect(s.phase).toBe("slotSpinning");
    stopReel(s, 210);
    expect(s.phase).toBe("slotSpinning");
    stopReel(s, 460);
    expect(s.slot!.stopped.every((x) => x != null)).toBe(true);
    expect(s.phase).toBe("slotChoosing");
    expect(stopReel(s, 700)).toBe(false); // 已经满了, 再按无效
  });

  it("★ 三个槽位全是准备卡时仍然进入战斗 —— 这条封死了避战出口(§2.4.1)", () => {
    const s = newSession();
    toSlot(s);
    const preps = s.slot!.symbols.filter((x) => x.kind === "prep");
    expect(preps.length).toBeGreaterThan(0);
    s.slot!.stopped = [preps[0].id, preps[1].id, preps[2].id];
    s.phase = "slotChoosing";

    expect(chooseSlotCard(s, 0)).toBe(true);
    expect(s.phase).toBe("inBattle");
    const fallback = s.slot!.symbols.find((x) => x.id === s.slot!.resolvedBattleSymbolId);
    expect(fallback?.kind).toBe("battle");
    expect(s.pendingEncounterId).toBe("n-crew"); // 符号没写 encounterId ⇒ 回落到档位底子
  });

  it("选中战斗卡时不发生回落, 打的就是它自己", () => {
    const s = newSession();
    toSlot(s);
    const battle = s.slot!.symbols.find((x) => x.kind === "battle")!;
    s.slot!.stopped = [battle.id, battle.id, battle.id];
    s.phase = "slotChoosing";
    chooseSlotCard(s, 0);
    expect(s.slot!.resolvedBattleSymbolId).toBe(battle.id);
  });

  it("战前补给的效果在开战前真的结算(全队回血)", () => {
    const s = newSession();
    s.party[0].hp = 10;
    toSlot(s);
    const supply = s.slot!.symbols.find((x) => x.id === "sp-supply")!;
    s.slot!.stopped = [supply.id, supply.id, supply.id];
    s.phase = "slotChoosing";
    chooseSlotCard(s, 0);
    expect(s.party[0].hp).toBeGreaterThan(10);
    expect(s.phase).toBe("inBattle");
  });
});

describe("战斗条件合并", () => {
  it("能量档位与符号的改造相加/相乘, 不是二选一", () => {
    const s = newSession();
    s.energy = 5; // 第 5 档: 敌方先手 +2(moveDelayDelta -2) + 追加 1 名敌人
    toSlot(s);
    const tempo = s.slot!.symbols.find((x) => x.id === "sb-tempo")!; // moveDelayDelta -2
    s.slot!.stopped = [tempo.id, tempo.id, tempo.id];
    s.phase = "slotChoosing";
    chooseSlotCard(s, 0);

    const mod = battleModifier(s, getMap("neon-city").fillerEnemyIds);
    expect(mod.moveDelayDelta).toBe(-4); // 档位 -2 与符号 -2 相加
    expect(mod.extraEnemies?.length).toBe(1);
  });

  it("HP 倍率相乘", () => {
    const s = newSession();
    toSlot(s);
    const retrofit = s.slot!.symbols.find((x) => x.id === "sp-retrofit")!; // hpMultiplier 0.9
    s.slot!.stopped = [retrofit.id, retrofit.id, retrofit.id];
    s.phase = "slotChoosing";
    chooseSlotCard(s, 0);
    // 非 BOSS ⇒ 档位侧的 hpMultiplier 恒为 1
    expect(battleModifier(s, []).hpMultiplier).toBeCloseTo(0.9, 6);
  });
});

describe("两个限时阶段的输入白名单(§6.3 / §2.4.5)", () => {
  it("slotSpinning 禁开背包、禁撤离 —— 任何能暂停它的入口都直接废掉时机手感", () => {
    const s = newSession();
    toSlot(s);
    expect(canOpenBackpack(s)).toBe(false);
    expect(canRetreat(s)).toBe(false);
    expect(retreat(s)).toBe(false);
    expect(s.phase).toBe("slotSpinning");
  });

  it("slotChoosing 允许开背包与撤离 —— 「打哪场」要看当前状态与背包", () => {
    const s = newSession();
    toSlot(s);
    stopReel(s, 30);
    stopReel(s, 210);
    stopReel(s, 460);
    expect(s.phase).toBe("slotChoosing");
    expect(canOpenBackpack(s)).toBe(true);
    expect(canRetreat(s)).toBe(true);
    expect(retreat(s)).toBe(true);
    expect(s.phase).toBe("retreated");
  });

  it("披露页之外不能抽战斗签", () => {
    const s = newSession();
    expect(startSlot(s)).toBe(false); // generating
    toSlot(s);
    expect(startSlot(s)).toBe(false); // 已在 slotSpinning, 不许重抽
  });
});
