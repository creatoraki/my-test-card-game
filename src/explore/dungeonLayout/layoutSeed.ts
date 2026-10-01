// 每日房间图种子 —— 同一游戏日、同一地图、同一难度必然得到同一张房间图;
// 换日、换地图或换难度则换一张。只决定骨架(房间位置、连通、起点与 BOSS), 房间内容仍按每局种子随机。

import type { MapDifficulty } from "@/data/maps/mapDifficulty";

/** FNV-1a 32 位散列, 再做一轮雪崩混合, 避免相邻天数得到相近种子。 */
export function dungeonLayoutSeed(day: number, mapId: string, difficulty: MapDifficulty): number {
  const text = `${mapId}|${difficulty}|${day | 0}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}
