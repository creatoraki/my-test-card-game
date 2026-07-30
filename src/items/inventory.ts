// ============================================================================
// 容器操作 —— 纯函数, 背包(32 格)与仓库(无上限)共用同一套。
// ★ 本模块**不认识 32 这个数**: 容量由调用方传进来(背包传 RULES.burden.backpackSlots,
//   仓库不传 = 无上限)。这样"背包有上限、仓库没有"就只是同一个函数的两种调用方式。
//
// 容器状态是**紧凑数组 + 一个容量数字**, 不是定长稀疏数组:
//   定长数组要处理「装备必须占两个相邻格」的装箱问题, 丢弃后还要留洞, 序列化与 diff 都变脏。
//   UI 需要的「32 个格位」由 layoutBackpack() 现算, 是纯表现, 可单测。
// ============================================================================

import type { ItemDef, ItemStack } from "./types";

export type GetDef = (itemId: string) => ItemDef;

// ---------------------------------------------------------------------------
// 占格
// ---------------------------------------------------------------------------
// 一堆占几格。★ 首版所有 def 的 maxStack 都是 1, 于是这里恒等于 slots × count。
export function stackSlots(st: ItemStack, def: ItemDef): number {
  return def.slots * Math.ceil(st.count / Math.max(1, def.maxStack));
}

export function occupiedSlots(stacks: ItemStack[], getDef: GetDef): number {
  return stacks.reduce((n, st) => n + stackSlots(st, getDef(st.itemId)), 0);
}

// ---------------------------------------------------------------------------
// 增删
// ---------------------------------------------------------------------------
export interface AddResult {
  next: ItemStack[]; // 新的容器内容(不改原数组)
  taken: ItemStack[]; // 真的收进去了的
  overflow: ItemStack[]; // 装不下的 —— 背包满时进 pendingPickup, 由玩家取舍
}

// 逐件尝试收进容器。capSlots 省略 = 无上限(仓库)。
// 同 itemId 且同羁绊的可堆叠物品优先并进已有的堆(maxStack > 1 时才有意义)。
export function addToContainer(
  stacks: ItemStack[],
  incoming: ItemStack[],
  getDef: GetDef,
  capSlots?: number,
): AddResult {
  const next = stacks.map((s) => ({ ...s }));
  const taken: ItemStack[] = [];
  const overflow: ItemStack[] = [];
  let used = occupiedSlots(next, getDef);

  for (const st of incoming) {
    const def = getDef(st.itemId);

    // ① 先试着并进已有的堆 —— 不占新格子, 所以不受容量限制。
    if (def.maxStack > 1) {
      const slot = next.find(
        (s) => s.itemId === st.itemId && s.affinity === st.affinity && s.count < def.maxStack,
      );
      if (slot && slot.count + st.count <= def.maxStack) {
        slot.count += st.count;
        taken.push(st);
        continue;
      }
    }

    // ② 另起一堆, 要有足够的空格。
    const need = stackSlots(st, def);
    if (capSlots != null && used + need > capSlots) {
      overflow.push(st);
      continue;
    }
    next.push({ ...st });
    used += need;
    taken.push(st);
  }

  return { next, taken, overflow };
}

// 按 uid 移除一整堆。找不到就原样返回(调用方靠引用是否变化判断成败)。
export function removeByUid(stacks: ItemStack[], uid: string): ItemStack[] {
  const i = stacks.findIndex((s) => s.uid === uid);
  return i < 0 ? stacks : [...stacks.slice(0, i), ...stacks.slice(i + 1)];
}

export function findByUid(stacks: ItemStack[], uid: string): ItemStack | undefined {
  return stacks.find((s) => s.uid === uid);
}

// ---------------------------------------------------------------------------
// 排序
// ---------------------------------------------------------------------------
// 稀有度降序 → 类别 → 名称。两个界面共用同一个序, 玩家换界面不用重新找东西。
const CATEGORY_RANK: Record<string, number> = {
  equipment: 0,
  consumable: 1,
  material: 2,
  data: 3,
  scrap: 4,
};

export function sortStacks(stacks: ItemStack[], getDef: GetDef, rarityRank: (r: string) => number) {
  return stacks.slice().sort((a, b) => {
    const da = getDef(a.itemId);
    const db = getDef(b.itemId);
    const rr = rarityRank(db.rarity) - rarityRank(da.rarity);
    if (rr !== 0) return rr;
    const cc = (CATEGORY_RANK[da.category] ?? 9) - (CATEGORY_RANK[db.category] ?? 9);
    if (cc !== 0) return cc;
    return da.name.localeCompare(db.name, "zh-Hans-CN");
  });
}

// ---------------------------------------------------------------------------
// 背包的视觉排布 —— 纯表现, 但放在纯 TS 里以便单测
// ---------------------------------------------------------------------------
export type BackpackCell =
  | { kind: "item"; stack: ItemStack; span: number }
  | { kind: "empty" } // 可放东西的空格
  | { kind: "gap" } // 行末放不下 2 格装备而留出的空隙(仍计入容量, 只是这一格用不上)
  | { kind: "covered" }; // ★ 被前一个跨格物品占掉的格子。**渲染时必须跳过** —— CSS grid 的
//   span 2 已经把它盖住了, 再画一个格子会把整行挤下去。它存在只是为了让
//   数组下标 = 真实格号, 占格换算与视觉排布不会对不上。

// 逐个放入 cols 列的网格; 跨 2 格的装备**不跨行** —— 行末塞不下就先留一个 gap 再换行。
// 返回长度恒为 capacity(不足补 empty)。
export function layoutBackpack(
  stacks: ItemStack[],
  getDef: GetDef,
  capacity: number,
  cols: number,
): BackpackCell[] {
  const cells: BackpackCell[] = [];
  for (const st of stacks) {
    const span = stackSlots(st, getDef(st.itemId));
    const col = cells.length % cols;
    if (span > 1 && col + span > cols) {
      for (let i = col; i < cols; i++) cells.push({ kind: "gap" });
    }
    cells.push({ kind: "item", stack: st, span });
    for (let i = 1; i < span; i++) cells.push({ kind: "covered" });
  }
  // ⚠ **不截断**: 行末让出的 gap 是视觉格, 不计入 occupiedSlots ——
  //   背包占满 32 格又恰好有一个 gap 时, 截断会把最后一件东西整个藏起来。
  //   宁可多画一行(补齐到整行), 也不能让玩家看不见自己背着的东西。
  while (cells.length < capacity || cells.length % cols !== 0) cells.push({ kind: "empty" });
  return cells;
}
