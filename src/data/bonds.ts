// ============================================================================
// 羁绊注册表 —— 装备驱动的**全队构筑系统**(《羁绊设计概览.md》)。
// 惯例与 engine/statuses.ts 的 STATUS_DEFS 一致: 一张 Record + 一个 getter, 新增羁绊 = 加一条。
//
// ★ 羁绊不是角色职业, 也不是卡牌关键词 —— 它由**上阵队伍的 9 个装备槽**(3 角色 × 3 槽)
//   上的羁绊词条计数驱动, 达到门槛就整队生效。计数在 store/townStore.bondCountsOf,
//   生效在 store/runStore.launchBattle(开战瞬间快照, 与负重惩罚同一个范式)。
//
// ⚠ 本期只实装**纯属性型**的 6 个 —— 它们能直接落在 StatBlock 上, engine 一行不用改。
//   规则型的 9 个(隐者/节制/星星/死神/恶魔/月亮/太阳/魔术师/命运之轮)需要引擎新钩子, 留待后续。
//   数值全部照抄《具体羁绊设定.md》的塔罗牌目录。
// ============================================================================

import type { StatBlock, StatModifier } from "../engine/types";
import type { BondBias } from "../explore/types";

export interface BondTier {
  count: number; // 激活门槛(羁绊点数)
  desc: string; // UI 文案
  // 每名上阵角色**各叠一份**: 攻击/命中/暴击/治愈强度/护盾强度这类"个人属性"。
  mods?: StatModifier;
  // ★ 全队**只叠一份**的属性。drawCount / handLimit 在 engine/stats.ts 的
  //   partyDrawCount / partyHandLimit 里是**按上阵角色求和**的 —— 每人 +1 会变成 3 人队 +3 张。
  //   落地时只叠给队伍第一人, 见 runStore.launchBattle。
  partyMods?: StatModifier;
}

export interface BondDef {
  id: string;
  name: string; // 塔罗牌名, 同时就是羁绊名
  arcana: string; // 大阿尔卡那编号(纯展示)
  desc: string; // 主题一句话
  // 羁绊主题色 —— UI 的 tag 文字/图标/描边统一读这一份, 不在各界面各配一套。
  // 取色要求: 在近黑底上读得清, 且六个之间的色相拉得开(玩家要"扫一眼认出是哪条羁绊")。
  color: string;
  tiers: BondTier[]; // 由低到高, activeBonds 取达到的最高档
}

export const BOND_DEFS: Record<string, BondDef> = {
  // ---- 输出 ----
  strength: {
    id: "strength",
    name: "力量",
    arcana: "VIII",
    desc: "以柔驯猛。队伍的每一次挥击都更沉。",
    color: "#ff6b57",
    tiers: [
      { count: 3, desc: "全队攻击力 +10", mods: { flat: { attack: 10 } } },
      { count: 6, desc: "全队攻击力 +20", mods: { flat: { attack: 20 } } },
      { count: 9, desc: "全队攻击力 +30", mods: { flat: { attack: 30 } } },
    ],
  },
  chariot: {
    id: "chariot",
    name: "战车",
    arcana: "VII",
    desc: "驾驭矛盾的方向感。攻势不再走空。",
    color: "#ffab3d",
    tiers: [
      { count: 3, desc: "全队命中率 +7%", mods: { flat: { hitRate: 7 } } },
      { count: 6, desc: "全队命中率 +15%", mods: { flat: { hitRate: 15 } } },
      { count: 9, desc: "全队命中率 +25%", mods: { flat: { hitRate: 25 } } },
    ],
  },
  judgement: {
    id: "judgement",
    name: "审判",
    arcana: "XX",
    desc: "号角落下的那一刻，罪与罚同时兑现。",
    color: "#ffd84a",
    tiers: [
      { count: 3, desc: "全队暴击率 +20%", mods: { flat: { critRate: 20 } } },
      { count: 6, desc: "全队暴击率 +30%", mods: { flat: { critRate: 30 } } },
      { count: 9, desc: "全队暴击率 +40%", mods: { flat: { critRate: 40 } } },
    ],
  },

  // ---- 存活 ----
  priestess: {
    id: "priestess",
    name: "女祭司",
    arcana: "II",
    desc: "帷幕之后的静默知识，让治愈更深一层。",
    color: "#5ec8ff",
    tiers: [
      { count: 3, desc: "治疗效果 +10%", mods: { flat: { healBoost: 10 } } },
      { count: 6, desc: "治疗效果 +20%", mods: { flat: { healBoost: 20 } } },
      { count: 9, desc: "治疗效果 +40%", mods: { flat: { healBoost: 40 } } },
    ],
  },
  tower: {
    id: "tower",
    name: "高塔",
    arcana: "XVI",
    desc: "崩塌之前，先把墙筑得更厚。",
    color: "#b06cf0",
    tiers: [
      { count: 3, desc: "护盾强度 +10%", mods: { flat: { shieldBoost: 10 } } },
      { count: 6, desc: "护盾强度 +20%", mods: { flat: { shieldBoost: 20 } } },
      { count: 9, desc: "护盾强度 +40%", mods: { flat: { shieldBoost: 40 } } },
    ],
  },

  // ---- 资源 ----
  // ⚠ 愚者走 partyMods —— 抽牌数是**小队合计**属性, 详见 BondTier.partyMods 的注释。
  fool: {
    id: "fool",
    name: "愚者",
    arcana: "0",
    desc: "毫无计划地起步，反而看见更多的路。",
    color: "#7ce08a",
    tiers: [
      { count: 4, desc: "每回合额外抽 1 张牌", partyMods: { flat: { drawCount: 1 } } },
      { count: 8, desc: "每回合额外抽 2 张牌", partyMods: { flat: { drawCount: 2 } } },
    ],
  },
};

// 掉落时随机羁绊词条的抽取池。
// ★ 只放**已实装**的羁绊 —— 一共只有 9 个装备槽, 22 张塔罗牌全进池时每种期望 0.4 点,
//   连最低的 3 点门槛都凑不出来, 羁绊系统等于摆设。日后每实装一个就往这里加一个 id。
export const ROLLABLE_BOND_IDS: string[] = Object.keys(BOND_DEFS);

export const BOND_BIAS: Record<BondBias, string[]> = {
  offense: ["strength", "chariot", "judgement", "fool"],
  defense: ["priestess", "tower", "fool"],
};

export function bondPool(bias?: BondBias): string[] {
  return bias ? [...BOND_BIAS[bias]] : [...ROLLABLE_BOND_IDS];
}

// ⚠ 刻意**不 throw**(与 data/index.ts 的 getItemDef 相反): 存档里可能残留已下线的羁绊 id,
//   计数时静默跳过即可 —— 不该让一件旧装备把整个仓库界面炸掉。
export function getBondDef(id: string): BondDef | undefined {
  return BOND_DEFS[id];
}

// 计数 → 每个羁绊达到的**最高**档位。未达最低门槛的羁绊不出现在结果里。
// 返回顺序跟随 BOND_DEFS 的声明顺序, 保证 UI 与战斗结算读到的是同一个次序。
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

// 把若干修正层合成一层: 同名 flat 相加、同名 pct 相加。
// 与 townStore.equipModsOf 的合并循环同口径 —— 那边合的是装备, 这边合的是羁绊。
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
