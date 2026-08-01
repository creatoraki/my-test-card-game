// ============================================================================
// 战斗签: 老虎机 —— 纯函数, 无副作用, 无 React(见 探索模式设计.md §2.4)。
//
// 为什么战斗签是老虎机而不是又一张阿弥陀签: 区域路由图的动词是**记忆与追踪**,
// 一趟出击已经要做 6 遍。老虎机的动词是**时机与反射**, 两个关卡互补而不是重复 ——
// 这是解决仪式疲劳比「减少次数」更根本的一层。
//
// 结构: 8 个公开符号 × 3 个槽位。三条转轮**同时**滚动, 玩家按 3 次暂停, 从左到右依次定住;
// 3 张定住后从中选 1 张执行。战斗必然发生 —— 选中准备卡就先结算它, 再随机回落一张战斗卡。
//
// ★ 本模块最重要的一条: 「按下暂停时定住哪个符号」的判定与 UI 的转轮渲染**共用 reelSymbolAt**。
//   两边各算一份必然对不上, 玩家会看到「明明停在这个符号上却给了我另一个」——
//   那会当场摧毁 §2.4.3 赖以成立的时机手感。
// ============================================================================

import { rngInt, shuffle } from "../engine/rng";
import { getMap, getSlotSymbol } from "../data";
import { EXPLORE_RULES } from "./rules";
import type { BattleTier, ExploreState, SlotReel, SlotState, SlotSymbol } from "./types";

// ---------------------------------------------------------------------------
// 转轮位置 —— 唯一真相点
// ---------------------------------------------------------------------------
// 转轮匀速循环滚动。elapsedMs 是本次滚动开始至今的毫秒数(UI 传 performance.now() 的差值)。
// 返回此刻**最靠近定格线**的符号在 reel.order 里的下标。
//
// ⚠ 必须是 round 而不是 floor, 而且这一条与 UI 的位移公式是**同一件事的两面**:
//   符号带的位移量 = -(elapsedMs + offsetMs)/symbolMs × 单元高度, 定格线在中央 ⇒
//   第 k 个符号恰好在 (elapsedMs + offsetMs)/symbolMs === k 的那一刻居中。
//   用 floor 会让判定比画面**早半个符号**, 玩家会觉得「明明停在这个上却给了下一个」——
//   §2.4.3 的时机手感全靠这半个符号。改这里就必须同步改 SlotReels.css 的 slotSpin。
export function reelIndexAt(reel: SlotReel, elapsedMs: number, symbolMs: number): number {
  const n = reel.order.length;
  const ticks = Math.round((elapsedMs + reel.offsetMs) / symbolMs);
  return ((ticks % n) + n) % n; // JS 的 % 对负数返回负值, 这里补一次
}

export function reelSymbolAt(reel: SlotReel, elapsedMs: number, symbolMs: number): string {
  return reel.order[reelIndexAt(reel, elapsedMs, symbolMs)];
}

// ---------------------------------------------------------------------------
// 建立本轮转轮
// ---------------------------------------------------------------------------
function sameOrder(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

// 从地图的档位转轮池取符号。⚠ 池子必须恰好 symbolCount 个 ——
// 三连概率 = 1 / 符号数², 数量不齐会让同花加成的基线在不同档位之间漂移(§2.4.4)。
export function buildSlot(s: ExploreState, tier: BattleTier): SlotState {
  const pool = getMap(s.mapId).slotPoolsByTier[tier] ?? [];
  const symbols: SlotSymbol[] = pool.map(getSlotSymbol);
  const { reelCount, reelOffsetMs } = EXPLORE_RULES.slot;

  // ★ 每条轮子各洗一次序 + 各自的相位偏移。两者缺一不可:
  //   只错相位而顺序相同 ⇒ 三条轮子只是同一串东西的平移, 玩家按固定节拍连按三次仍能凑三连;
  //   只换顺序而相位相同 ⇒ 同一时刻三轮的下标一致, 手速快到「同一毫秒按三次」就必出三连。
  const ids = symbols.map((x) => x.id);
  const reels: SlotReel[] = [];
  for (let i = 0; i < reelCount; i++) {
    // 洗到与前面几条都不同为止。撞车概率极低(8! 种排列), 但「恰好撞上」的那一局会静默地
    // 把三连变成免费的, 所以宁可多洗几次也不留这个口子。上限防死循环(池子只有 1 个符号时)。
    let order = shuffle(s, ids);
    for (let guard = 0; guard < 8 && reels.some((r) => sameOrder(r.order, order)); guard++) {
      order = shuffle(s, ids);
    }
    reels.push({ order, offsetMs: reelOffsetMs[i] ?? i * 370 });
  }

  return {
    round: s.round,
    tier,
    symbols,
    reels,
    stopped: new Array(reelCount).fill(null),
    matchBonus: 0,
    chosenIndex: null,
    resolvedBattleSymbolId: null,
  };
}

// ---------------------------------------------------------------------------
// 同花判定(§2.4.2)
// ---------------------------------------------------------------------------
// 对子约三分之一的战斗会出现, 所以只能是 +0.50 这个量级; 三连 1.6% 才配 +1.50。
// 两者都**加法**并入 K(§5.1) —— 与档位基底混用乘法会让深潜玩家的每条加成都更值钱。
export function matchBonusOf(stopped: (string | null)[]): number {
  if (stopped.some((x) => x == null)) return 0;
  const ids = stopped as string[];
  const counts = new Map<string, number>();
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  const best = Math.max(...counts.values());
  if (best >= 3) return EXPLORE_RULES.slot.tripleBonus;
  if (best === 2) return EXPLORE_RULES.slot.pairBonus;
  return 0;
}

// ---------------------------------------------------------------------------
// 三选一的结算
// ---------------------------------------------------------------------------
// 返回 { symbol, battle }:
//   symbol —— 玩家选中的那张卡(可能是准备卡);
//   battle —— 本轮实际打的战斗条件。选中战斗卡时就是它自己; 选中准备卡时随机回落一张战斗卡。
//
// ★ 「没抽中战斗卡就随机取一张」这条规则封死了**避战出口**(§2.4.1): 一趟出击 6 场战斗是骨架,
//   战后整备、经验与战利品全挂在上面, 不能让 3 个槽位凑出全准备卡就把它绕过去。
export function resolveChoice(
  rng: { rngState: number },
  slot: SlotState,
  index: number,
): { symbol: SlotSymbol; battle: SlotSymbol } | null {
  const id = slot.stopped[index];
  if (id == null) return null;
  const symbol = slot.symbols.find((x) => x.id === id);
  if (!symbol) return null;
  if (symbol.kind === "battle") return { symbol, battle: symbol };

  // 准备卡: 从**整个转轮池**的战斗卡里随机取一张(而不是从定住的 3 张里取 ——
  // 那 3 张可能一张战斗卡都没有, 而且「你停出什么就打什么」会让准备卡变相带上战斗卡的选择权)。
  const battles = slot.symbols.filter((x) => x.kind === "battle");
  if (!battles.length) return null;
  return { symbol, battle: battles[rngInt(rng, battles.length)] };
}
