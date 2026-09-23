// 探索会话(房间制)·房间图与交互。断言集中在三件事:
//   ① 房间图生成的硬规则 —— 房间数 = 地图的 roomCount、每房最多 4 个出口且出口双向、
//      全图从起点可达、BOSS 房是最深的那一间、同种子完全复现;
//   ② 换房间的代价与信息 —— 站上传送门只点亮不收费, 确认传送 −5 粒子;
//   ③ 交互的代价与进度 —— 按物件分类扣粒子, 搜干净后房间标记为已探索。

import { describe, expect, it } from "vitest";
import { difficultyMapConfig, makeItemStack } from "../data";
import { EXPLORE_RULES } from "./rules";
import { enterRoom, isRoomExplored, travelPortal } from "./dungeon/session";
import { CORRIDOR } from "./corridor/types";
import type { PortalDir } from "./dungeon/types";
import { interactionCost, projectedEnergy, roomProgress } from "./session";
import type { ExploreState } from "./types";
import {
  PARTY,
  allRooms,
  dungeonOf,
  exitDirs,
  goToRoom,
  newSession,
  roomNow,
  standAt,
  stepOnPortal,
  takeCurio,
} from "./session.testkit";

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
