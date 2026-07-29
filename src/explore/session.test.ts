import { describe, expect, it } from "vitest";
import { EXPLORE_RULES } from "./rules";
import {
  canUseAbility,
  confirmDiscard,
  createSession,
  dangerTier,
  encounterModifier,
  finishBattle,
  playEvent,
  playRoute,
  previewDanger,
  retreat,
  toggleDiscardPick,
  useAbility,
} from "./session";
import type { ExploreState, PartySnapshot } from "./types";

const PARTY: PartySnapshot[] = [
  { charId: "swordsman", name: "剑士", emoji: "⚔️", hp: 70, maxHp: 70, alive: true },
];

function newSession(seed = 1): ExploreState {
  return createSession("neon-city", PARTY, [], seed);
}

// 手牌里第一张 danger 为 delta 的事件卡; 找不到就返回 undefined
function findInHand(s: ExploreState, pred: (danger: number) => boolean): string | undefined {
  return s.hand.find((uid) => pred(s.cards[uid].danger));
}

describe("建局", () => {
  it("发 3 张遭遇卡 + 1 张撤退卡, BOSS 不在手", () => {
    const s = newSession();
    const kinds = s.route.map((uid) => s.cards[uid].kind);
    expect(kinds.filter((k) => k === "encounter")).toHaveLength(3);
    expect(kinds.filter((k) => k === "retreat")).toHaveLength(1);
    expect(kinds).not.toContain("boss");
    expect(s.bossRevealed).toBe(false);
  });

  it("起手抽满 openingDraw 张, 且路线牌不占手牌", () => {
    const s = newSession();
    expect(s.hand).toHaveLength(EXPLORE_RULES.openingDraw);
    expect(s.hand.every((uid) => s.cards[uid].kind === "event")).toBe(true);
  });

  it("遭遇卡开局即绑定具体 encounter(供玩家自选先打哪一场)", () => {
    const s = newSession();
    for (const uid of s.route) {
      const c = s.cards[uid];
      if (c.kind === "encounter") expect(c.encounterId).toBeTruthy();
    }
  });
});

describe("危险度", () => {
  it("每 dangerPerTier 点跳一档, 顶档封顶", () => {
    expect(dangerTier(0).tier).toBe(1);
    expect(dangerTier(2).tier).toBe(1);
    expect(dangerTier(3).tier).toBe(2);
    expect(dangerTier(11).tier).toBe(4);
    expect(dangerTier(12).tier).toBe(5);
    expect(dangerTier(99).tier).toBe(5);
  });

  it("打出事件卡按卡面改变危险度, 且不会低于 0", () => {
    const s = newSession();
    const up = findInHand(s, (d) => d > 0);
    if (up) {
      const before = s.danger;
      const delta = s.cards[up].danger;
      playEvent(s, up);
      expect(s.danger).toBe(before + delta);
    }
    s.danger = 0;
    const down = findInHand(s, (d) => d < 0);
    if (down) {
      playEvent(s, down);
      expect(s.danger).toBe(0);
    }
  });

  it("previewDanger 与实际打出的结果一致(仪表预演不能骗人)", () => {
    const s = newSession(7);
    const uid = s.hand[0];
    const predicted = previewDanger(s, uid);
    playEvent(s, uid);
    expect(s.danger).toBe(predicted);
  });

  it("档位越高, 敌人越多/越快/奖励越厚", () => {
    const low = encounterModifier(0, false, ["weird-bird"]);
    const high = encounterModifier(12, false, ["weird-bird"]);
    expect(low.extraEnemies).toHaveLength(0);
    expect(high.extraEnemies!.length).toBeGreaterThan(0);
    expect(high.castTickDelta).toBeLessThan(0);
    expect(dangerTier(12).rewardMultiplier).toBeGreaterThan(dangerTier(0).rewardMultiplier);
  });

  it("BOSS 的强度直接读危险度 —— 它就是玩家攒出来的", () => {
    const calm = encounterModifier(0, true, ["weird-bird"]);
    const crimson = encounterModifier(12, true, ["weird-bird"]);
    expect(crimson.hpMultiplier!).toBeGreaterThan(calm.hpMultiplier!);
    expect(crimson.extraEnemies!.length).toBeGreaterThan(calm.extraEnemies!.length);
  });
});

describe("牌与抽牌权", () => {
  it("打出的卡不洗回牌库(牌库只减不增)", () => {
    const s = newSession();
    const before = s.draw.length;
    playEvent(s, s.hand[0]);
    expect(s.draw.length).toBeLessThanOrEqual(before);
    expect(s.draw).not.toContain(s.trail[0]);
  });

  it("抽满即止: 手牌到上限后不再抽, 也不弃牌", () => {
    const s = newSession();
    s.hand = s.draw.splice(0, EXPLORE_RULES.handSize);
    const handBefore = [...s.hand];
    const drawBefore = s.draw.length;
    useAbility(s, "scout"); // 搜寻要抽 1 张
    expect(s.hand).toEqual(handBefore);
    expect(s.draw.length).toBe(drawBefore);
  });

  it("战斗胜利后补 drawPerBattle 张 —— 抽牌权只能靠打仗换", () => {
    const s = newSession();
    const encounterUid = s.route.find((uid) => s.cards[uid].kind === "encounter")!;
    playRoute(s, encounterUid);
    s.hand = []; // 清空手牌以确保补牌不受上限影响
    finishBattle(s, true, [{ charId: "swordsman", hp: 50, alive: true }], 2);
    expect(s.hand).toHaveLength(EXPLORE_RULES.drawPerBattle);
  });
});

describe("路线与 BOSS", () => {
  it("3 张遭遇卡全部打完后 BOSS 才入手", () => {
    const s = newSession();
    for (let i = 0; i < 3; i++) {
      const uid = s.route.find((x) => s.cards[x].kind === "encounter")!;
      playRoute(s, uid);
      expect(s.bossRevealed).toBe(false); // 揭示发生在 finishBattle 里, 打出卡的当下还没揭示
      finishBattle(s, true, [{ charId: "swordsman", hp: 60, alive: true }], 2);
      expect(s.bossRevealed).toBe(i === 2); // 第 3 场打完才揭示
    }
    expect(s.bossRevealed).toBe(true);
    expect(s.route.some((uid) => s.cards[uid].kind === "boss")).toBe(true);
  });

  it("击杀 BOSS → cleared", () => {
    const s = newSession();
    s.route = [s.bossUid];
    s.bossRevealed = true;
    playRoute(s, s.bossUid);
    finishBattle(s, true, [{ charId: "swordsman", hp: 20, alive: true }], 3);
    expect(s.phase).toBe("cleared");
  });

  it("撤退保留残片并结束牌局", () => {
    const s = newSession();
    s.loot = 120;
    retreat(s);
    expect(s.phase).toBe("retreated");
    expect(s.loot).toBe(120);
  });
});

describe("血量继承与团灭", () => {
  it("战斗后血量写回队伍, 下一场以此开局", () => {
    const s = newSession();
    const uid = s.route.find((x) => s.cards[x].kind === "encounter")!;
    playRoute(s, uid);
    finishBattle(s, true, [{ charId: "swordsman", hp: 23, alive: true }], 2);
    expect(s.party[0].hp).toBe(23);
    expect(s.party[0].alive).toBe(true);
  });

  it("战斗失利 = 团灭, 残片按 wipe 规则清算", () => {
    const s = newSession();
    s.loot = 200;
    const uid = s.route.find((x) => s.cards[x].kind === "encounter")!;
    playRoute(s, uid);
    finishBattle(s, false, [{ charId: "swordsman", hp: 0, alive: false }], 2);
    expect(s.phase).toBe("wiped");
    expect(s.loot).toBe(Math.floor(200 * EXPLORE_RULES.wipe.lootKept));
  });

  it("事件卡也能打死人 —— 全队倒下即团灭", () => {
    const s = newSession();
    s.party[0].hp = 3;
    s.hand = [Object.values(s.cards).find((c) => c.id === "snare")?.uid ?? ""].filter(Boolean);
    if (s.hand.length) {
      playEvent(s, s.hand[0]);
      expect(s.phase).toBe("wiped");
    }
  });
});

describe("场地能力", () => {
  it("搜寻: 危险度 +1 换 1 张牌", () => {
    const s = newSession();
    const d = s.danger;
    const h = s.hand.length;
    useAbility(s, "scout");
    expect(s.danger).toBe(d + EXPLORE_RULES.abilities.scout.danger);
    expect(s.hand).toHaveLength(h + 1);
  });

  it("休整/隐匿进入弃牌选择 —— 弃哪几张本身就是决策, 不做随机弃牌", () => {
    const s = newSession();
    useAbility(s, "rest");
    expect(s.pendingDiscard).not.toBeNull();
    expect(confirmDiscard(s)).toBe(false); // 没选够不能确认

    const picks = s.hand.slice(0, EXPLORE_RULES.abilities.rest.discard);
    for (const uid of picks) toggleDiscardPick(s, uid);
    s.party[0].hp = 10;
    expect(confirmDiscard(s)).toBe(true);
    expect(s.party[0].hp).toBeGreaterThan(10);
    expect(s.hand).not.toContain(picks[0]);
    expect(s.pendingDiscard).toBeNull();
  });

  it("隐匿把危险度压回来", () => {
    const s = newSession();
    s.danger = 6;
    s.hand = s.draw.splice(0, 2);
    useAbility(s, "conceal");
    for (const uid of [...s.hand]) toggleDiscardPick(s, uid);
    confirmDiscard(s);
    expect(s.danger).toBe(6 + EXPLORE_RULES.abilities.conceal.danger);
  });

  it("牌库空 + 手牌空不构成死局(仍可打战斗/撤退)", () => {
    const s = newSession();
    s.draw = [];
    s.hand = [];
    expect(canUseAbility(s, "scout")).toBe(false);
    expect(canUseAbility(s, "rest")).toBe(false);
    expect(s.route.length).toBeGreaterThan(0); // 路线牌永远在
    expect(retreat(s)).toBe(true);
  });
});
