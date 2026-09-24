// mulberry32 种子随机：关卡装饰与背景程序化生成共用，同一种子每次结果一致。

export interface Random {
  next(): number;
  range(min: number, max: number): number;
  int(min: number, max: number): number;
  pick<T>(list: readonly T[]): T;
  chance(p: number): boolean;
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
  };
}
