// 可复现的伪随机数(mulberry32)。rngState 存在 BattleState 里, 因此战斗完全可复现/可存档。

export function rngFloat(state: { rngState: number }): number {
  let t = (state.rngState = (state.rngState + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function rngInt(state: { rngState: number }, maxExclusive: number): number {
  return Math.floor(rngFloat(state) * maxExclusive);
}

export function rngPick<T>(state: { rngState: number }, arr: T[]): T {
  return arr[rngInt(state, arr.length)];
}

// 按权重抽取。权重缺省/非正数视为 0; 总权重为 0 时退回等概率 rngPick。
export function rngPickWeighted<T>(
  state: { rngState: number },
  arr: T[],
  weightOf: (item: T) => number,
): T {
  const weights = arr.map((item) => Math.max(0, weightOf(item)));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (total <= 0) return rngPick(state, arr);

  let r = rngFloat(state) * total;
  for (let i = 0; i < arr.length; i++) {
    r -= weights[i];
    if (r < 0) return arr[i];
  }
  return arr[arr.length - 1];
}

// Fisher–Yates 洗牌(返回新数组, 不改原数组)
export function shuffle<T>(state: { rngState: number }, arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = rngInt(state, i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
