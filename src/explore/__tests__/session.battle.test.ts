// 探索会话(房间制)·战斗与背包。断言集中在三件事:
//   ① 战斗接缝 —— 战斗房打赢回原房间、BOSS 红门挑战打赢即通关, 以及血量继承、团灭清算;
//   ② 净化粒子档位与掉落系数;
//   ③ 背包、负重、消耗品与投递口, 以及撤离的阶段限制。

import { describe, expect, it } from "vitest";
import { makeItemStack } from "@/data";
import { EXPLORE_RULES, ENERGY_TIERS } from "../core/exploreRules";
import {
  addItems,
  applyEffect,
  backpackSlots,
  burdenNow,
  confirmNode,
  discardStack,
  encounterModifier,
  energyTier,
  finishBattle,
  retreat,
  rewardMultiplier,
  shipHome,
  spendBattleEnergy,
  takePending,
  useItem,
} from "../session";
import { WIN, dungeonOf, intoBattle, newSession, phaseOf, roomNow, useFirstCurio } from "./session.testkit";

describe("战斗接缝", () => {
  it("进入战斗房立刻起黑影, 演出结束后建立战斗", () => {
    const s = newSession(41);
    intoBattle(s);
    expect(s.battleSource).toBe("room");
    expect(s.pendingIsBoss).toBe(false);
    expect(s.pendingEncounterId).not.toBeNull();
  });

  it("战斗房打赢: 黑影清场, 留在原房间, 战斗场数 +1", () => {
    const s = newSession(42);
    intoBattle(s);
    const roomId = dungeonOf(s).currentRoomId;
    const battlesBefore = s.battlesWon;
    finishBattle(s, true, WIN, ["scrap-bot"]);
    expect(s.phase).toBe("atNode");
    expect(dungeonOf(s).currentRoomId).toBe(roomId);
    expect(dungeonOf(s).rooms[roomId].threatDefeated).toBe(true);
    expect(s.battlesWon).toBe(battlesBefore + 1);
  });

  it("BOSS 房打赢 = 通关", () => {
    const s = newSession(43);
    intoBattle(s, true);
    expect(s.pendingIsBoss).toBe(true);
    finishBattle(s, true, WIN, ["scrap-bot"]);
    expect(s.phase).toBe("cleared");
  });

  it("BOSS 战失败 = 撤离副本, 背包与积分保留", () => {
    const s = newSession(430);
    intoBattle(s, true);
    s.loot = 200;
    s.backpack = [makeItemStack("copper-coin"), makeItemStack("logic-cube")];
    finishBattle(s, false, [{ charId: "swordsman", hp: 0, alive: false, limitLoss: 0 }], ["scrap-bot"]);
    expect(s.phase).toBe("retreated");
    expect(s.loot).toBe(200);
    expect(s.backpack).toHaveLength(2);
    const last = s.history[s.history.length - 1];
    expect(last?.battleResult).toBe("lose");
    expect(last?.notes).toEqual(["首领挑战失败 · 撤离副本"]);
  });

  it("战斗档位随房间深度爬升 —— 档位必须落在该深度的权重表里", () => {
    const s = newSession(44);
    intoBattle(s);
    const rows = EXPLORE_RULES.battleTierWeights;
    const depth = roomNow(s).depth;
    const allowed = rows[Math.min(depth, rows.length - 1)].map((row) => row.tier);
    expect(allowed).toContain(s.pendingBattleTier);
  });

  it("战斗后血量写回队伍", () => {
    const s = newSession(45);
    intoBattle(s);
    finishBattle(s, true, [{ charId: "swordsman", hp: 23, alive: true, limitLoss: 0 }], ["scrap-bot"]);
    expect(s.party[0].hp).toBe(23);
    expect(s.party[0].alive).toBe(true);
  });

  it("每进行 1 个战斗回合扣 1 点粒子", () => {
    const s = newSession(46);
    const before = s.energy;
    spendBattleEnergy(s, 4);
    expect(s.energy).toBe(before - 4 * EXPLORE_RULES.energyPerBattleRound);
  });

  it("战斗按档位额外扣粒子", () => {
    const s = newSession(46);
    const before = s.energy;
    spendBattleEnergy(s, 2, "t3");
    expect(s.energy).toBe(before - 2 * EXPLORE_RULES.energyPerBattleRound - EXPLORE_RULES.energyPerBattleTier.t3);
  });

  // 设计文档 §6.1: 战斗胜利**只掉物品, 绝不直接掉居民积分**。
  it("普通战斗胜利不给积分, 只掉实物", () => {
    const s = newSession(47);
    s.energy = 0; // 枯竭档, 掉落系数最高
    intoBattle(s);
    const before = s.loot;
    finishBattle(s, true, WIN, ["scrap-bot", "scrap-bot", "scrap-bot"]);
    expect(s.loot).toBe(before);
    expect(s.pendingLoot.length).toBeGreaterThan(0);
  });

  it("同种子的战斗掉的东西逐件一致", () => {
    const run = () => {
      const s = newSession(4242);
      intoBattle(s);
      finishBattle(s, true, WIN, ["scrap-bot", "radio-bot"]);
      return s.pendingLoot.map((x) => x.itemId);
    };
    expect(run()).toEqual(run());
  });

  it("战斗失利 = 团灭, 积分与背包一起清空(已寄回的除外)", () => {
    const s = newSession(48);
    intoBattle(s);
    s.loot = 200;
    s.backpack = [makeItemStack("copper-coin"), makeItemStack("logic-cube")];
    s.shipped = [makeItemStack("silver-coin")];
    finishBattle(s, false, [{ charId: "swordsman", hp: 0, alive: false, limitLoss: 0 }], ["scrap-bot"]);
    expect(s.phase).toBe("wiped");
    expect(s.loot).toBe(Math.floor(200 * EXPLORE_RULES.wipe.lootKept));
    expect(s.backpack).toEqual([]);
    expect(s.shipped).toHaveLength(1); // 投递口是背包玩法唯一的保险手段
  });

  it("非战斗阶段调用回填无效 —— 幂等护栏", () => {
    const s = newSession(49);
    expect(finishBattle(s, true, [], ["scrap-bot"])).toEqual({ loot: 0, items: [], overflow: [] });
    expect(s.phase).toBe("atNode");
  });
});

describe("净化粒子档位(设计文档 §4.2)", () => {
  it("档位边界: 80/60/40/20/0 分别落在第 1..5 档", () => {
    expect(energyTier(100).tier).toBe(1);
    expect(energyTier(80).tier).toBe(1);
    expect(energyTier(79).tier).toBe(2);
    expect(energyTier(60).tier).toBe(2);
    expect(energyTier(40).tier).toBe(3);
    expect(energyTier(20).tier).toBe(4);
    expect(energyTier(0).tier).toBe(5);
  });

  it("K_energy 随档位单调递增", () => {
    const values = ENERGY_TIERS.map((tier) => rewardMultiplier(tier.min));
    for (let i = 1; i < values.length; i++) expect(values[i]).toBeGreaterThan(values[i - 1]);
  });

  it("遭遇改造只把能量档位的 BUFF 层数带入战斗", () => {
    expect(encounterModifier(100).enemyStatuses).toEqual([]);
    expect(encounterModifier(0).enemyStatuses).toEqual([{ id: "overload", stacks: 4 }]);
  });
});

describe("背包与负重(设计文档 §六)", () => {
  it("祝福遗物先进入待拾取框, 收下后占用一格并参与同名去重", () => {
    const s = newSession();
    expect(applyEffect(s, { type: "GRANT_RELIC", relicId: "relic-old-clockwork" }, true)).toContain("旧式发条");
    expect(s.backpack).toHaveLength(0);
    expect(s.pendingPickup).toHaveLength(1);
    expect(takePending(s, 0)).toBe(true);
    expect(backpackSlots(s)).toBe(1);
    expect(s.ownedRelicIds).toContain("relic-old-clockwork");
    expect(applyEffect(s, { type: "GRANT_RELIC", relicId: "relic-old-clockwork" }, true)).toContain("回落");
    expect(s.pendingPickup).toHaveLength(0);
  });

  it("一件物品一格, 有效负重随占格线性上升", () => {
    const s = newSession();
    expect(backpackSlots(s)).toBe(0);
    expect(burdenNow(s)).toBe(0);

    addItems(s, [makeItemStack("copper-coin"), makeItemStack("logic-cube")]);
    expect(backpackSlots(s)).toBe(2);
    expect(burdenNow(s)).toBe(2);
  });

  it("负重适应按固定格数削减有效负重, 超过占格时归零", () => {
    const s = newSession();
    s.party[0].burdenAdapt = 1;
    addItems(s, [makeItemStack("copper-coin"), makeItemStack("logic-cube")]);
    expect(burdenNow(s)).toBe(1);
    s.party[0].burdenAdapt = 3;
    expect(burdenNow(s)).toBe(0);
  });

  it("装不下的进 pendingPickup, 不会被悄悄丢掉", () => {
    const s = newSession();
    addItems(s, Array.from({ length: 24 }, () => makeItemStack("copper-coin")));
    expect(backpackSlots(s)).toBe(24);

    const { taken, overflow } = addItems(s, [makeItemStack("logic-cube")]);
    expect(taken).toHaveLength(0);
    expect(overflow).toHaveLength(1);
    expect(s.pendingPickup).toHaveLength(1);
  });

  it("背包里还有待取舍的东西时不许离开结算阶段", () => {
    const s = newSession(51);
    useFirstCurio(s);
    if (phaseOf(s) !== "resolving") return;
    s.pendingPickup = [makeItemStack("copper-coin")];
    expect(confirmNode(s)).toBe(false);
  });

  it("丢弃即时生效, 负重立刻回升", () => {
    const s = newSession();
    addItems(s, [makeItemStack("logic-cube")]);
    const uid = s.backpack[0].uid;
    expect(burdenNow(s)).toBe(1);
    expect(discardStack(s, uid)).toBe(true);
    expect(burdenNow(s)).toBe(0);
    expect(discardStack(s, uid)).toBe(false);
  });

  it("消耗品用完即消失, 且不额外扣净化粒子", () => {
    const s = newSession();
    addItems(s, [makeItemStack("sugar-cube-c")]);
    s.party[0].hp = 10;
    const energyBefore = s.energy;
    expect(useItem(s, s.backpack[0].uid, "swordsman")).not.toBeNull();
    expect(s.backpack).toHaveLength(0);
    expect(s.party[0].hp).toBeGreaterThan(10);
    expect(s.energy).toBe(energyBefore);
  });

  it("指定角色类消耗品必须带目标, 目标不对时物品不消耗", () => {
    const s = newSession();
    addItems(s, [makeItemStack("sugar-cube-c")]);
    const uid = s.backpack[0].uid;
    expect(useItem(s, uid)).toBeNull();
    expect(useItem(s, uid, "nobody")).toBeNull();
    expect(s.backpack).toHaveLength(1);
  });

  it("治疗类消耗品不对阵亡角色生效", () => {
    const s = newSession();
    addItems(s, [makeItemStack("sugar-cube-c")]);
    s.party[0].alive = false;
    expect(useItem(s, s.backpack[0].uid, "swordsman")).toBeNull();
    expect(s.backpack).toHaveLength(1);
  });

  it("目标状态无效时不消耗物品(满血吃糖 / 无损伤用医疗包)", () => {
    const s = newSession();
    addItems(s, [makeItemStack("sugar-cube-c"), makeItemStack("medical-kit-c")]);
    expect(useItem(s, s.backpack[0].uid, "swordsman")).toBeNull();
    expect(useItem(s, s.backpack[1].uid, "swordsman")).toBeNull();
    expect(s.backpack).toHaveLength(2);
  });

  it("投递口: 未开启不能寄, 开启后寄一次扣一次能量", () => {
    const s = newSession();
    addItems(s, [makeItemStack("logic-cube")]);
    const uid = s.backpack[0].uid;

    expect(shipHome(s, [uid])).toBe(false);
    s.chuteOpen = true;
    const energyBefore = s.energy;
    expect(shipHome(s, [uid])).toBe(true);
    expect(s.backpack).toHaveLength(0);
    expect(s.shipped).toHaveLength(1);
    expect(s.energy).toBe(energyBefore - EXPLORE_RULES.chute.energyCost);
    expect(s.chuteOpen).toBe(false);
  });
});

describe("撤离", () => {
  it("房间里随时可以主动撤离, 积分照带", () => {
    const s = newSession(71);
    s.loot = 120;
    expect(retreat(s)).toBe(true);
    expect(s.phase).toBe("retreated");
    expect(s.loot).toBe(120);
  });

  it("战斗建立之后不能再用撤离按钮 —— 那条路属于战斗内的撤离", () => {
    const s = newSession(72);
    intoBattle(s);
    expect(retreat(s)).toBe(false);
  });
});
