// ============================================================================
// 掉落结算 —— 纯 TS, 用 engine/rng 的可复现随机。
//
// rng 参数接受**任意带 rngState 的对象** ⇒ 调用方直接把 ExploreState 传进来,
// 掉落就进了同一条种子链: 同种子的一趟远征, 掉的东西逐件一致。
//
// 统一掉落系数 K 与 qualityBias 的口径见《探索模式设计.md》§5.1。
// K 的换算在 explore/session.ts(它才认识净化粒子与挑战词条), 本模块只消费算好的结果。
// ============================================================================

import { rngFloat, rngInt } from "../engine/rng";
import { rollEquipment } from "./equipRoll";
import type { DropEntry, EquipRoll, ItemDef, ItemRarity, ItemStack } from "./types";
import { RARITY_ORDER } from "./types";

export interface DropContext {
  weights: Record<ItemRarity, number>; // 已按 qualityBias 选好的那一行权重
  getDef: (itemId: string) => ItemDef;
  getFamily: (familyId: string) => ItemDef[];
  makeStack: (
    itemId: string,
    count: number,
    extra?: { affinity?: string; roll?: EquipRoll },
  ) => ItemStack;
  // 随机羁绊词条的抽取池(羁绊 id)。★ 由调用方从 data 层递进来 ——
  //   items/ 是纯 TS 层, 不能 import data/(依赖方向是 data → items), 与 getDef/getFamily 同理。
  //   空数组 = 不 roll 词条(单元测试与不关心羁绊的调用方直接传 [])。
  affinityPool: string[];
  // 装备箱从 data 层递进来的装备族列表, items 层不自行扫描内容注册表。
  equipmentFamilyIds?: string[];
}

// 掷件数: finalChance = base × K。结果 >1 时, 整数部分为保底件数, 小数部分再掷一次
// (`1.6` = 必掉 1 件 + 60% 再掉 1 件)。—— 设计文档 §5.1 原文。
export function rollCount(rng: { rngState: number }, chance: number, k: number): number {
  const f = Math.max(0, chance) * k;
  let n = Math.floor(f);
  if (rngFloat(rng) < f - n) n += 1;
  return n;
}

// 从一族里按权重挑一档。★ 族内缺哪一档就跳过哪一档, 权重不会漏给不存在的稀有度。
export function pickByQuality(
  rng: { rngState: number },
  family: ItemDef[],
  weights: Record<ItemRarity, number>,
): ItemDef {
  const pool = RARITY_ORDER.map((r) => ({
    r,
    defs: family.filter((d) => d.rarity === r),
    w: weights[r] ?? 0,
  })).filter((e) => e.defs.length > 0 && e.w > 0);

  // 全族权重为 0(如整族都是史诗而当前档位不出史诗) ⇒ 退回族里最低的那一档, 别掉空。
  if (!pool.length) {
    const sorted = family
      .slice()
      .sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity));
    return sorted[0];
  }

  const total = pool.reduce((s, e) => s + e.w, 0);
  let roll = rngFloat(rng) * total;
  for (const e of pool) {
    roll -= e.w;
    if (roll <= 0) return e.defs[rngInt(rng, e.defs.length)];
  }
  const last = pool[pool.length - 1];
  return last.defs[rngInt(rng, last.defs.length)];
}

// 掷一条随机羁绊词条(《羁绊设计概览.md》§2.1)。稀有度不影响词条数量。
// pickIndex 由调用方提供随机源: 探索侧传 engine/rng 的种子链, 据点商店传 Math.random。
export function rollAffinity(
  def: ItemDef,
  pool: string[],
  pickIndex: (n: number) => number,
): string | undefined {
  if (!def.affinityRollable || !pool.length) return undefined;
  return pool[pickIndex(pool.length)];
}

// 掷一整张掉落表 → 若干 ItemStack。★ 每件一个 stack(与首版 maxStack: 1 一致);
// 需要合并由 inventory.addToContainer 负责, 本模块不管容器。
export function rollDropTable(
  rng: { rngState: number },
  table: DropEntry[] | undefined,
  k: number,
  ctx: DropContext,
): ItemStack[] {
  if (!table?.length) return [];
  const out: ItemStack[] = [];

  for (const e of table) {
    const times = rollCount(rng, e.chance, k);
    for (let i = 0; i < times; i++) {
      // min/max 是**每次命中**掉几件, 与命中次数是两回事(见 §5.2 的「废件 60% ×1-2」)。
      const min = e.min ?? 1;
      const max = e.max ?? min;
      const count = min + (max > min ? rngInt(rng, max - min + 1) : 0);

      const def =
        e.kind === "item" ? ctx.getDef(e.itemId) : pickByQuality(rng, ctx.getFamily(e.familyId), ctx.weights);
      if (!def) continue;

      // maxStack 为 1 时拆成 count 个独立 stack —— 装备本来就必须逐件独立(各带各的羁绊)。
      if (def.maxStack <= 1) {
        // ⚠ 词条**逐件**掷, 且必须走 rngInt(同一条种子链) —— 否则同种子的一趟远征
        //   掉的东西不再逐件一致, 本模块顶部的可复现承诺当场作废。
        for (let n = 0; n < count; n++) {
          out.push(
            ctx.makeStack(def.id, 1, {
              affinity: rollAffinity(def, ctx.affinityPool, (n) => rngInt(rng, n)),
              roll: rollEquipment(def, (n) => rngInt(rng, n)),
            }),
          );
        }
      } else {
        out.push(ctx.makeStack(def.id, count));
      }
    }
  }
  return out;
}
