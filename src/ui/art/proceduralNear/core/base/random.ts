// mulberry32 种子随机：程序化近景的全部随机都从这里来，同一种子每次结果一致。

export interface Random {
  next(): number;
  range(min: number, max: number): number;
  int(min: number, max: number): number;
  pick<T>(list: readonly T[]): T;
  chance(p: number): boolean;
  /** 派生一个子种子，用于交给下一级绘制。 */
  seed(): number;
}

export function createRandom(seed: number): Random {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    range: (min, max) => min + (max - min) * next(),
    int: (min, max) => Math.floor(min + (max - min + 1) * next()),
    pick: (list) => list[Math.floor(next() * list.length)],
    chance: (p) => next() < p,
    seed: () => Math.floor(next() * 2147483647) + 1,
  };
}

/** 无状态整数哈希 → [0,1)。地面按世界绝对坐标取值，任意宽度都能无缝衔接。 */
export function hash01(n: number, salt = 0): number {
  let h = Math.imul((n | 0) ^ Math.imul(salt | 0, 0x27d4eb2d), 0x9e3779b1);
  h ^= h >>> 15;
  h = Math.imul(h, 0x85ebca77);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae3d);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
