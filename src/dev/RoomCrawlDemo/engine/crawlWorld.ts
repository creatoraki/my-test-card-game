import { decorBlocker, propBlocker } from "../data/footprints";
import { getRoom, START_ROOM_ID } from "../data";
import type { Blocker, DoorSide, RoomDef, WorldSnapshot } from "../types";
import { arrivalPoint } from "./doorTrigger";
import { createGuard, resetGuard, type GuardState } from "./guardBrain";
import { createPlayer, type PlayerState } from "./playerMotion";

/** 跨房间保存的进度(只在内存里, 不写存档)。 */
interface RoomProgress {
  searched: Set<string>;
  banished: Set<string>;
}

/**
 * 整个楼层的纯逻辑状态: 当前房间、玩家、守卫、各房间已搜过的物品与已驱散的守卫。
 * 不依赖 three, 渲染层每帧读取它。
 */
export class CrawlWorld {
  room: RoomDef;
  player: PlayerState;
  guards: GuardState[] = [];
  blockers: Blocker[] = [];
  /** 本房间的进入点(后撤时退回这里)。 */
  entry: { x: number; z: number; facing: 1 | -1 };
  private progress = new Map<string, RoomProgress>();
  private visited: string[] = [];

  constructor() {
    this.room = getRoom(START_ROOM_ID);
    this.entry = arrivalPoint(this.room, null);
    this.player = createPlayer(this.entry.x, this.entry.z, this.entry.facing);
    this.enter(START_ROOM_ID, null);
  }

  private progressOf(roomId: string): RoomProgress {
    let p = this.progress.get(roomId);
    if (!p) {
      p = { searched: new Set(), banished: new Set() };
      this.progress.set(roomId, p);
    }
    return p;
  }

  get searched(): ReadonlySet<string> {
    return this.progressOf(this.room.id).searched;
  }

  /** 进入房间: fromSide 为离开上一个房间时穿过的门。 */
  enter(roomId: string, fromSide: DoorSide | null): void {
    this.room = getRoom(roomId);
    if (!this.visited.includes(roomId)) this.visited.push(roomId);
    const banished = this.progressOf(roomId).banished;
    // 刚进门给一点喘息时间, 免得一落地就被发现
    this.guards = this.room.guards.filter((g) => !banished.has(g.id)).map((def) => {
      const g = createGuard(def);
      g.cooldown = 1.4;
      return g;
    });
    this.blockers = [
      ...this.room.props.map(propBlocker),
      ...this.room.decor.map(decorBlocker).filter((b): b is Blocker => b !== null),
    ];
    this.entry = arrivalPoint(this.room, fromSide);
    const facing = this.entry.facing;
    this.player = createPlayer(this.entry.x, this.entry.z, facing);
  }

  markSearched(propId: string): void {
    this.progressOf(this.room.id).searched.add(propId);
  }

  banish(guardId: string): void {
    this.progressOf(this.room.id).banished.add(guardId);
    const g = this.guards.find((item) => item.id === guardId);
    if (g) {
      g.mode = "banished";
      g.dissolve = 0;
    }
  }

  /** 后撤: 所有守卫回到巡逻起点并短暂失明。 */
  resetGuards(): void {
    for (const g of this.guards) if (g.mode !== "banished") resetGuard(g, 2.6);
  }

  /** 房间里是否还有活着的守卫(决定门锁)。 */
  get locked(): boolean {
    return this.guards.some((g) => g.mode !== "banished");
  }

  /** 清理已溶解完的守卫。 */
  sweepGuards(): void {
    this.guards = this.guards.filter((g) => !(g.mode === "banished" && g.dissolve >= 1));
  }

  snapshot(): WorldSnapshot {
    const cleared = this.visited.filter((id) => {
      const room = getRoom(id);
      const banished = this.progressOf(id).banished;
      return room.guards.every((g) => banished.has(g.id));
    });
    return { roomId: this.room.id, visited: [...this.visited], cleared };
  }
}
