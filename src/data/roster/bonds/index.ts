// ============================================================================
// 羁绊注册表 —— 装备驱动的**全队构筑系统**(《羁绊重构设计文档》)。
// 惯例与 engine/statuses 的 STATUS_DEFS 一致: 一张 Record + 一个 getter, 新增羁绊 = 加一条。
//
// ★ 羁绊由**上阵队伍的装备格**(每人 3~6 格)上的羁绊词条计数驱动, 达到门槛就整队生效。
// ★ 门槛只有三种规格: 3 档 = 3/6/9, 4 档 = 4/8/12, 6 档 = 6/12。计数在 store/townStore.bondCountsOf,
//   开战时把「id + 档位」交给引擎(store/run/launchBattle), 规则行为在 engine/bonds 按 id 注册。
// ============================================================================

import type { StatBlock, StatModifier } from "@/engine/types";
import type { BondDef, BondFamily, BondTier } from "./types";
import { FRONT_BOND_DEFS } from "./frontDefs";
import { TEMPO_BOND_DEFS } from "./tempoDefs";
import { FATE_BOND_DEFS } from "./fateDefs";
import { mapBondFamilies } from "./families";

export type { BondDef, BondFamily, BondTier } from "./types";
export {
  BOND_FAMILIES,
  bondFamilyName,
  mapBondFamilies,
  type BondFamilyDef,
} from "./families";

// 声明顺序 = 系别顺序(锋刃 → 壁垒 → 时序 → 流转 → 蚀刻 → 因果), UI 与战斗读到同一个次序。
export const BOND_DEFS: Record<string, BondDef> = Object.fromEntries(
  [...FRONT_BOND_DEFS, ...TEMPO_BOND_DEFS, ...FATE_BOND_DEFS].map((def) => [def.id, def]),
);

// 掉落 / 重铸的全池。
export const ROLLABLE_BOND_IDS: string[] = Object.keys(BOND_DEFS);

export function bondIdsOfFamily(family: BondFamily): string[] {
  return ROLLABLE_BOND_IDS.filter((id) => BOND_DEFS[id].family === family);
}

/** 重铸池: 选了系别就只在该系别内抽, 否则全池。 */
export function bondPool(family?: BondFamily): string[] {
  return family ? bondIdsOfFamily(family) : [...ROLLABLE_BOND_IDS];
}

// 地图掉落池(带权重的展开数组, 均匀抽取即得到加权结果):
//   偏向系别内的每条 11 份、其余 2 份 —— 恰好等于「60% 在偏向系别内随机, 40% 全池随机」。
export function mapBondPool(mapId: string | undefined): string[] {
  const families = mapBondFamilies(mapId);
  if (!families.length) return [...ROLLABLE_BOND_IDS];
  return ROLLABLE_BOND_IDS.flatMap((id) =>
    Array<string>(families.includes(BOND_DEFS[id].family) ? 11 : 2).fill(id),
  );
}

// 重掷一条羁绊词条: 从池中排除装备当前那条, 保证每次重铸必定换一条。
export function rerollBond(
  current: string | undefined,
  pickIndex: (n: number) => number,
  family?: BondFamily,
): string | undefined {
  const pool = bondPool(family).filter((id) => id !== current);
  if (!pool.length) return undefined;
  return pool[pickIndex(pool.length)];
}

// ⚠ 刻意**不 throw**(与 data/index.ts 的 getItemDef 相反): 存档里可能残留已下线的羁绊 id,
//   计数时静默跳过即可 —— 不该让一件旧装备把整个仓库界面炸掉。
export function getBondDef(id: string): BondDef | undefined {
  return BOND_DEFS[id];
}

// 计数 → 每个羁绊达到的**最高**档位。未达最低门槛的羁绊不出现在结果里。
export function activeBonds(
  counts: Record<string, number>,
): { def: BondDef; tier: BondTier; tierIndex: number }[] {
  const out: { def: BondDef; tier: BondTier; tierIndex: number }[] = [];
  for (const def of Object.values(BOND_DEFS)) {
    const n = counts[def.id] ?? 0;
    let idx = -1;
    for (let i = 0; i < def.tiers.length; i++) if (n >= def.tiers[i].count) idx = i;
    if (idx >= 0) out.push({ def, tier: def.tiers[idx], tierIndex: idx });
  }
  return out;
}

// 下一档门槛(已满级返回 null) —— UI 画进度条用。
export function nextTier(def: BondDef, count: number): BondTier | null {
  return def.tiers.find((t) => count < t.count) ?? null;
}

// 把若干修正层合成一层: 同名 flat 相加、同名 pct 相加(launchBattle 合成遗物面板时复用)。
export function mergeMods(mods: (StatModifier | undefined)[]): StatModifier {
  const flat: Partial<StatBlock> = {};
  const pct: Partial<StatBlock> = {};
  for (const m of mods) {
    if (!m) continue;
    for (const [k, v] of Object.entries(m.flat ?? {}) as [keyof StatBlock, number][]) {
      flat[k] = (flat[k] ?? 0) + v;
    }
    for (const [k, v] of Object.entries(m.pct ?? {}) as [keyof StatBlock, number][]) {
      pct[k] = (pct[k] ?? 0) + v;
    }
  }
  return { flat, pct };
}
