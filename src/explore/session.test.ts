// 探索会话(房间制)。断言集中在四件事:
//   ① 房间图生成的硬规则 —— 房间数 = 地图的 roomCount、每房最多 4 个出口且出口双向、
//      全图从起点可达、BOSS 房是最深的那一间、同种子完全复现;
//   ② 换房间的代价与信息 —— 站上传送门只点亮不收费, 确认传送 −5 粒子;
//   ③ 交互的代价与进度 —— 每交互 1 个事件 −2 粒子, 搜干净后房间标记为已探索;
//   ④ 战斗接缝 —— 战斗房打赢回原房间、BOSS 红门挑战打赢即通关、挑战契约按战斗场次结算,
//      以及血量继承、团灭清算这些跨系统的口子。
//
// ⚠ 旧路由模式(浮现 → 揭示 → 选入口 → 推进段)的用例已随层级概念一并移除;
//   桥接生成器本身的断言仍保留在 route.test.ts。

import { describe, expect, it } from "vitest";
import { difficultyMapConfig, getEventPool, makeItemStack } from "../data";
import { EXPLORE_RULES, ENERGY_TIERS } from "./rules";
import { enterRoom, isRoomExplored, standOnPortal, travelPortal } from "./dungeon/session";
import { openBossGate, openCorridorObject } from "./corridor/session";
import { CORRIDOR } from "./corridor/types";
import type { PortalDir, RoomNode } from "./dungeon/types";
import {
  addItems,
  applyEffect,
  backpackSlots,
  burdenNow,
  chooseOption,
  challengeBoss,
  confirmNode,
  createSession,
  discardStack,
  encounterModifier,
  energyTier,
  engageRoomThreat,
  finishBattle,
  interactionCost,
  projectedEnergy,
  retreat,
  rewardMultiplier,
  roomProgress,
  shipHome,
  spendBattleEnergy,
  takePending,
  useItem,
} from "./session";
import type { ExploreEffect, ExploreState, PartySnapshot } from "./types";

const PARTY: PartySnapshot[] = [
  { charId: "swordsman", name: "剑士", emoji: "⚔️", hp: 70, hpLimit: 70, maxHp: 70, alive: true, burdenAdapt: 0 },
];

const WIN = [{ charId: "swordsman", hp: 70, alive: true, limitLoss: 0 }];

// ⚠ 直接写 s.phase !== "x" 会让 TS 顺着上一处早退把类型收窄成单个字面量, 后面的比较就成了
// 「两个字面量无交集」的编译错误。会话是被纯函数就地改的, 收窄在这里没有意义 —— 统一走这个取值器。
const phaseOf = (s: ExploreState): string => s.phase;

function newSession(seed = 1): ExploreState {
  return createSession("neon-city", PARTY, seed);
}

const dungeonOf = (s: ExploreState) => s.dungeon!;
const roomNow = (s: ExploreState): RoomNode => dungeonOf(s).rooms[dungeonOf(s).currentRoomId];
const allRooms = (s: ExploreState): RoomNode[] => Object.values(dungeonOf(s).rooms);
const exitDirs = (room: RoomNode): PortalDir[] => Object.keys(room.exits) as PortalDir[];

/** 把玩家挪到某个横坐标 —— 行走本身是 UI 侧逐帧的事, 纯逻辑测试直接落位。 */
function standAt(s: ExploreState, x: number): void {
  s.corridor!.playerX = x;
  standOnPortal(s, x);
}

/** 走上指定方向的传送门(只点亮, 不传送)。 */
function stepOnPortal(s: ExploreState, dir: PortalDir): void {
  const portal = s.corridor!.portals.find((candidate) => candidate.dir === dir)!;
  standAt(s, portal.x);
}

/** 把本房第一件没处理的物件搜掉, 停在 atNode。 */
function takeCurio(s: ExploreState, choice = 0): void {
  const object = s.corridor!.objects.find((candidate) => !candidate.used)!;
  s.corridor!.playerX = object.x;
  openCorridorObject(s, object.id);
  chooseOption(s, choice);
  if (phaseOf(s) === "resolving") confirmNode(s);
}

/** 直接落进某个房间 —— 省掉跨房间寻路, 用例只关心落地之后的事。 */
function goToRoom(s: ExploreState, pick: (room: RoomNode) => boolean): RoomNode {
  const room = allRooms(s).find(pick)!;
  enterRoom(s, room.id);
  return room;
}

/** 落进一间战斗房，或打开 BOSS 红门并把战斗建起来。 */
function intoBattle(s: ExploreState, boss = false): void {
  goToRoom(s, (room) => (boss ? room.kind === "boss" : room.kind === "battle" && !room.threatDefeated));
  if (boss) {
    expect(phaseOf(s)).toBe("atNode");
    s.corridor!.playerX = s.corridor!.bossGate!.x;
    expect(openBossGate(s)).toBe(true);
    expect(challengeBoss(s)).toBe(true);
  } else {
    expect(phaseOf(s)).toBe("encounter");
    engageRoomThreat(s);
  }
  expect(phaseOf(s)).toBe("inBattle");
}

describe("建局与房间图", () => {
  it("开局落在起始房间, 房间总数由地图决定", () => {
    const s = newSession();
    const map = difficultyMapConfig("neon-city", "normal");
    expect(s.phase).toBe("atNode");
    expect(s.roomCount).toBe(map.roomCount);
    expect(allRooms(s)).toHaveLength(map.roomCount);
    expect(dungeonOf(s).currentRoomId).toBe(dungeonOf(s).startRoomId);
    expect(roomNow(s).visited).toBe(true);
    expect(roomNow(s).depth).toBe(0);
    expect(s.round).toBe(1); // round 在房间制下 = 深度 + 1
    expect(s.energy).toBe(EXPLORE_RULES.startingEnergy);
  });

  it("同种子两次建局的房间图完全一致", () => {
    expect(newSession(2024).dungeon).toEqual(newSession(2024).dungeon);
  });

  it("每个房间最多 4 个出口, 且出口一律双向对称", () => {
    const s = newSession(77);
    const opposite: Record<PortalDir, PortalDir> = { up: "down", down: "up", left: "right", right: "left" };
    for (const room of allRooms(s)) {
      const dirs = exitDirs(room);
      expect(dirs.length).toBeLessThanOrEqual(4);
      for (const dir of dirs) {
        const target = dungeonOf(s).rooms[room.exits[dir]!];
        expect(target).toBeDefined();
        expect(target.exits[opposite[dir]]).toBe(room.id);
      }
    }
  });

  it("全部房间都能从起始房间走到 —— 不生成孤岛", () => {
    const s = newSession(88);
    const seen = new Set([dungeonOf(s).startRoomId]);
    const queue = [dungeonOf(s).startRoomId];
    while (queue.length) {
      const room = dungeonOf(s).rooms[queue.shift()!];
      for (const id of Object.values(room.exits)) {
        if (seen.has(id)) continue;
        seen.add(id);
        queue.push(id);
      }
    }
    expect(seen.size).toBe(allRooms(s).length);
  });

  it("BOSS 房是最深的房间之一, 且不是起始房", () => {
    const s = newSession(99);
    const boss = dungeonOf(s).rooms[dungeonOf(s).bossRoomId];
    const maxDepth = Math.max(...allRooms(s).map((room) => room.depth));
    expect(boss.id).not.toBe(dungeonOf(s).startRoomId);
    expect(boss.depth).toBe(maxDepth);
    expect(boss.bossGateX).toEqual(expect.any(Number));
    expect(boss.curios.length).toBeGreaterThanOrEqual(EXPLORE_RULES.dungeon.curiosPerRoom[0]);
    expect(boss.curios.length).toBeLessThanOrEqual(EXPLORE_RULES.dungeon.curiosPerRoom[1]);
  });

  it("起始房固定 1 件物件, 战斗房至少 1 间", () => {
    const s = newSession(123);
    expect(dungeonOf(s).rooms[dungeonOf(s).startRoomId].curios).toHaveLength(1);
    expect(allRooms(s).filter((room) => room.kind === "battle").length).toBeGreaterThanOrEqual(1);
  });

  it("传送门与物件不会挤在同一个地面槽位上", () => {
    const s = newSession(321);
    for (const room of allRooms(s)) {
      const xs = [...Object.values(room.portalX), ...room.curios.map((curio) => curio.x)];
      expect(new Set(xs).size).toBe(xs.length);
    }
  });

  it("队伍是拷贝 —— 改会话不会污染传进来的快照", () => {
    const s = newSession();
    s.party[0].hp = 1;
    expect(PARTY[0].hp).toBe(70);
  });
});

describe("换房间(每移动 1 个房间 −5 粒子)", () => {
  it("站上传送门只点亮目标房间, 不收费", () => {
    const s = newSession(11);
    const dir = exitDirs(roomNow(s))[0];
    const targetId = roomNow(s).exits[dir]!;
    const before = s.energy;

    expect(dungeonOf(s).rooms[targetId].revealed).toBe(false);
    stepOnPortal(s, dir);
    expect(s.corridor!.standingPortalDir).toBe(dir);
    expect(dungeonOf(s).rooms[targetId].revealed).toBe(true);
    expect(dungeonOf(s).rooms[targetId].visited).toBe(false); // 只知道位置, 还没进去
    expect(s.energy).toBe(before);
  });

  it("确认传送按新房价扣粒子并落进目标房间", () => {
    const s = newSession(12);
    const dir = exitDirs(roomNow(s))[0];
    const targetId = roomNow(s).exits[dir]!;
    const before = s.energy;

    stepOnPortal(s, dir);
    expect(travelPortal(s, dir)).toBe(true);
    expect(s.energy).toBe(before - EXPLORE_RULES.dungeon.energyPerRoomMove.fresh);
    expect(dungeonOf(s).currentRoomId).toBe(targetId);
    expect(roomNow(s).visited).toBe(true);
    expect(s.round).toBe(roomNow(s).depth + 1);
    expect(s.corridor!.roomId).toBe(targetId);
  });

  it("没站在传送门上就传送不了, 也不扣粒子", () => {
    const s = newSession(13);
    const dir = exitDirs(roomNow(s))[0];
    const portal = s.corridor!.portals.find((candidate) => candidate.dir === dir)!;
    standAt(s, portal.x + CORRIDOR.portalRadius + 40);
    const before = s.energy;
    expect(travelPortal(s, dir)).toBe(false);
    expect(s.energy).toBe(before);
  });

  it("待处理的战利品没清完时不许换房间", () => {
    const s = newSession(14);
    const dir = exitDirs(roomNow(s))[0];
    stepOnPortal(s, dir);
    s.pendingLoot = [makeItemStack("copper-coin")];
    expect(travelPortal(s, dir)).toBe(false);
  });

  it("落地点不会正踩在回程传送门上 —— 免得一进门就被问要不要回去", () => {
    const s = newSession(15);
    const dir = exitDirs(roomNow(s))[0];
    const from = dungeonOf(s).currentRoomId;
    stepOnPortal(s, dir);
    travelPortal(s, dir);
    const back = s.corridor!.portals.find((portal) => portal.to === from);
    expect(back).toBeDefined();
    expect(Math.abs(back!.x - s.corridor!.playerX)).toBeGreaterThan(CORRIDOR.portalRadius);
  });
});

describe("交互(按物件分类扣粒子)", () => {
  // 物件种类是随机的, 各分支自带的 energyDelta 不同 —— 钉死成遗留物资箱才能断言净消耗。
  function withChest(seed = 31): ExploreState {
    const s = newSession(seed);
    roomNow(s).curios[0].kind = "safe";
    enterRoom(s, roomNow(s).id);
    return s;
  }

  it("交互物品奖励类物件按 loot 档扣粒子", () => {
    const s = withChest();
    const before = s.energy;
    takeCurio(s);
    expect(s.energy).toBe(before - EXPLORE_RULES.energyPerInteraction.loot);
  });

  it("「隐匿通道」的免费次数会顶掉基础消耗, 且只顶指定次数", () => {
    const s = withChest(32);
    s.freeNodes = 1;
    expect(interactionCost(s)).toBe(0);
    const before = s.energy;
    takeCurio(s);
    expect(s.energy).toBe(before);
    expect(s.freeNodes).toBe(0);
    expect(interactionCost(s)).toBeGreaterThan(0);
  });

  it("预测值 = 再交互一次后的能量, 不会低于 0", () => {
    const s = newSession(33);
    expect(projectedEnergy(s)).toBe(s.energy - EXPLORE_RULES.energyPerInteraction.event);
    s.energy = 1;
    expect(projectedEnergy(s)).toBe(0);
  });

  it("搜过的物件会回写房间图, 全部搜完即标记为已探索", () => {
    const s = newSession(34);
    const room = roomNow(s);
    expect(isRoomExplored(room)).toBe(false);
    while (s.corridor!.objects.some((object) => !object.used)) takeCurio(s);
    expect(room.curios.every((curio) => curio.used)).toBe(true);
    expect(isRoomExplored(room)).toBe(true);
    expect(roomProgress(s).explored).toBe(1);
  });

  it("有黑影没清的房间不算已探索", () => {
    const s = newSession(35);
    const battle = goToRoom(s, (room) => room.kind === "battle");
    for (const curio of battle.curios) curio.used = true;
    expect(isRoomExplored(battle)).toBe(false);
    battle.threatDefeated = true;
    expect(isRoomExplored(battle)).toBe(true);
  });
});

describe("战斗接缝", () => {
  it("进入战斗房立刻起黑影, 演出结束后建立战斗", () => {
    const s = newSession(41);
    intoBattle(s);
    expect(s.battleSource).toBe("node");
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
    const object = s.corridor!.objects[0];
    s.corridor!.playerX = object.x;
    openCorridorObject(s, object.id);
    chooseOption(s, 0);
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

// 挑战契约是本作唯一**跨房间生效**的机制: 倒计时按战斗场次走, 战斗房与 BOSS 房同权。
describe("挑战契约", () => {
  const TRIAL_EVENT = getEventPool("ruined-floor").trial[0];
  const TRIAL_EFFECT = (TRIAL_EVENT.choices ?? [])
    .flatMap((choice) => choice.effects ?? [])
    .find((effect) => effect.type === "START_TRIAL") as ExploreEffect;

  function accept(s: ExploreState): void {
    applyEffect(s, TRIAL_EFFECT, true);
  }

  it("接下契约后按战斗场次倒计时", () => {
    const s = newSession(61);
    accept(s);
    expect(s.trials).toHaveLength(1);
    expect(s.trials[0].startBattles).toBe(s.battlesWon);
    expect(s.trials[0].untilBattles).toBe(s.battlesWon + EXPLORE_RULES.eventPool.trialNodes.battles);
  });

  it("打赢约定场数后结算: 契约撤掉, 奖励落进战利品盘", () => {
    const s = newSession(62);
    accept(s);
    s.trials[0].untilBattles = s.battlesWon + 1; // 缩到下一场, 省掉找第二间战斗房
    intoBattle(s);
    finishBattle(s, true, WIN, ["scrap-bot"]);
    expect(s.trials).toHaveLength(0);
    expect(s.trialReport).toHaveLength(1);
  });

  it("倒计时没走完时不结算", () => {
    const s = newSession(63);
    accept(s);
    intoBattle(s);
    finishBattle(s, true, WIN, ["scrap-bot"]);
    expect(s.trials).toHaveLength(1);
    expect(s.trialReport).toHaveLength(0);
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
