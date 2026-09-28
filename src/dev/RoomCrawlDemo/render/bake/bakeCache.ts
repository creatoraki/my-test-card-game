import type { BakedSurface } from "./surfaceBaker";

/** 最多保留几个房间的烘焙结果(单房间约 50~70MB 显存); 当前房间 + 最多 3 个相邻房间。 */
export const MAX_CACHED_ROOMS = 4;

/**
 * 烘焙结果缓存: 按房间保存墙面 / 地面 / 装饰物的烘焙贴图, 重访或预烘焙过的房间进门时直接复用。
 * 贴图的所有权在这里, 房间回收时不释放; 超出上限时按最久未用淘汰(受保护的房间除外)。
 * Map 的插入顺序即使用顺序, touch 时移到末尾。
 */
export class BakeCache {
  private rooms = new Map<string, Map<string, BakedSurface>>();

  constructor(private maxRooms = MAX_CACHED_ROOMS) {}

  get(roomId: string, key: string): BakedSurface | undefined {
    return this.rooms.get(roomId)?.get(key);
  }

  /** 收下一份烘焙结果; 若已有同键结果(并发烘了两份), 释放新的并返回已有的。 */
  adopt(roomId: string, key: string, baked: BakedSurface): BakedSurface {
    let room = this.rooms.get(roomId);
    if (!room) {
      room = new Map();
      this.rooms.set(roomId, room);
    }
    const existing = room.get(key);
    if (existing) {
      baked.dispose();
      return existing;
    }
    room.set(key, baked);
    return baked;
  }

  /** 标记房间为最近使用, 并淘汰超出上限的最久未用房间; keep 中的房间(当前与相邻)不淘汰。 */
  touch(roomId: string, keep: ReadonlySet<string>): void {
    const room = this.rooms.get(roomId);
    if (room) {
      this.rooms.delete(roomId);
      this.rooms.set(roomId, room);
    }
    for (const [id, surfaces] of this.rooms) {
      if (this.rooms.size <= this.maxRooms) break;
      if (keep.has(id) || id === roomId) continue;
      for (const baked of surfaces.values()) baked.dispose();
      this.rooms.delete(id);
    }
  }

  dispose(): void {
    for (const surfaces of this.rooms.values()) {
      for (const baked of surfaces.values()) baked.dispose();
    }
    this.rooms.clear();
  }
}
