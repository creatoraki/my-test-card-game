// 探索会话单测的共用夹具 —— 建局、落位、搜物件与开战的快捷方式。只给 *.test.ts 引用。

import { expect } from "vitest";
import { CORRIDOR_CURIOS } from "@/data/curios";
import { openBossGate, openCorridorObject } from "../corridor/corridorSession";
import { chooseCurioDecision } from "../curio/resolve";
import { visibleDecisions } from "../curio/visibility";
import { enterRoom, standOnPortal } from "../dungeon/dungeonSession";
import type { PortalDir, RoomNode } from "../dungeon/types";
import { challengeBoss, confirmNode, createSession, engageRoomThreat } from "../session";
import type { ExploreState, PartySnapshot } from "../types";

export const PARTY: PartySnapshot[] = [
  { charId: "swordsman", name: "剑士", emoji: "⚔️", hp: 70, hpLimit: 70, maxHp: 70, alive: true, burdenAdapt: 0 },
];

export const WIN = [{ charId: "swordsman", hp: 70, alive: true, limitLoss: 0 }];

// ⚠ 直接写 s.phase !== "x" 会让 TS 顺着上一处早退把类型收窄成单个字面量, 后面的比较就成了
// 「两个字面量无交集」的编译错误。会话是被纯函数就地改的, 收窄在这里没有意义 —— 统一走这个取值器。
export const phaseOf = (s: ExploreState): string => s.phase;

export function newSession(seed = 1): ExploreState {
  return createSession("neon-city", PARTY, seed);
}

export const dungeonOf = (s: ExploreState) => s.dungeon!;
export const roomNow = (s: ExploreState): RoomNode => dungeonOf(s).rooms[dungeonOf(s).currentRoomId];
export const allRooms = (s: ExploreState): RoomNode[] => Object.values(dungeonOf(s).rooms);
export const exitDirs = (room: RoomNode): PortalDir[] => Object.keys(room.exits) as PortalDir[];

/** 把玩家挪到某个横坐标 —— 行走本身是 UI 侧逐帧的事, 纯逻辑测试直接落位。 */
export function standAt(s: ExploreState, x: number): void {
  s.corridor!.playerX = x;
  standOnPortal(s, x);
}

/** 走上指定方向的传送门(只点亮, 不传送)。 */
export function stepOnPortal(s: ExploreState, dir: PortalDir): void {
  const portal = s.corridor!.portals.find((candidate) => candidate.dir === dir)!;
  standAt(s, portal.x);
}

/** 打开本房第一件没处理的物件, 由剑士执行第一个无门槛的决策, 停在 resolving。 */
export function useFirstCurio(s: ExploreState): void {
  const object = s.corridor!.objects.find((candidate) => !candidate.used)!;
  s.corridor!.playerX = object.x;
  expect(openCorridorObject(s, object.id)).toBe(true);
  const decision = visibleDecisions(s, CORRIDOR_CURIOS[object.kind])
    .find((candidate) => !candidate.select && !candidate.feed && !(candidate.foodCost ?? 0))!;
  expect(chooseCurioDecision(s, decision.id, "swordsman")).toBe(true);
}

/** 把本房第一件没处理的物件搜掉, 停在 atNode。 */
export function takeCurio(s: ExploreState): void {
  useFirstCurio(s);
  // 奖励与警报不是这里要断言的东西 —— 清掉后回到场景, 让下一件物件可以接着交互。
  s.pendingLoot = [];
  s.pendingPickup = [];
  s.pendingActions = [];
  s.corridor!.pendingAlarm = undefined;
  if (phaseOf(s) === "resolving") confirmNode(s);
}

/** 直接落进某个房间 —— 省掉跨房间寻路, 用例只关心落地之后的事。 */
export function goToRoom(s: ExploreState, pick: (room: RoomNode) => boolean): RoomNode {
  const room = allRooms(s).find(pick)!;
  enterRoom(s, room.id);
  return room;
}

/** 落进一间战斗房，或打开 BOSS 红门并把战斗建起来。 */
export function intoBattle(s: ExploreState, boss = false): void {
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
