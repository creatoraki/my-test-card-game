export function pickBotLine<K extends string>(
  table: Record<K, readonly string[]>,
  kind: K,
  avoid?: string | null,
): string {
  const pool = table[kind];
  const candidates = avoid && pool.length > 1 ? pool.filter((line) => line !== avoid) : pool;
  return candidates[Math.floor(Math.random() * candidates.length)];
}
