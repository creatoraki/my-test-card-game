// 面板属性的分组与文案 —— 角色详情页与角色档案 Modal 共用的唯一真相点。
//
// ★ 角色不设等级也不加点, 这些数字进游戏后只由装备与羁绊改变。
// ★ ref = 该项画满那条底部微条所需的值。⚠⚠ **纯展示旋钮, 不参与任何结算** —— 它既不是上限也不是
//   平衡口径, 只决定"这条横杠画多长"。数值本身照旧原样显示, 条只是让各组面板一眼看出长短对比。
//   百分比项默认按 100 铺满, 与 engine 里 70% 的概率封顶无关(那是结算封顶, 面板可以超)。

import type { StatBlock } from "@/engine";

export interface StatRow {
  key: keyof StatBlock;
  label: string;
  pct?: boolean;
  ref?: number;
}

export interface StatGroup {
  title: string;
  wide?: boolean;
  rows: StatRow[];
}

export const STAT_GROUPS: StatGroup[] = [
  {
    title: "生存与输出",
    rows: [
      { key: "maxHp", label: "生命", ref: 120 },
      { key: "attack", label: "攻击力", ref: 150 },
      { key: "defense", label: "防御力", ref: 30 },
      { key: "armorPen", label: "穿甲", ref: 20 },
      { key: "healPower", label: "治愈力", ref: 150 },
      { key: "lowCostMastery", label: "低费精通", ref: 20 },
      { key: "highCostMastery", label: "高费精通", ref: 20 },
    ],
  },
  {
    title: "命中与暴击",
    rows: [
      { key: "hitRate", label: "命中率", pct: true },
      { key: "dodgeRate", label: "闪避率", pct: true },
      { key: "critRate", label: "暴击率", pct: true },
      { key: "critDamage", label: "爆伤", pct: true, ref: 250 },
      { key: "precision", label: "精准", pct: true },
    ],
  },
  {
    title: "节奏与防护",
    rows: [
      { key: "initiative", label: "先手", ref: 20 },
      { key: "blockRate", label: "格挡", pct: true },
      { key: "healBoost", label: "治愈强度", pct: true },
      { key: "shieldBoost", label: "护盾强度", pct: true },
      { key: "ailmentResist", label: "异常抗性", pct: true },
      { key: "burdenAdapt", label: "负重适应" },
    ],
    wide: true,
  },
];

/** 从属性分组的展示标记推导单位，避免各个详情组件维护重复清单。 */
export function isPercentStat(key: keyof StatBlock): boolean {
  return STAT_GROUPS.some((group) => group.rows.some((row) => row.key === key && row.pct === true));
}

/** pct 项没写 ref 时的铺满值。 */
export const REF_DEFAULT_PCT = 100;

/** 一行属性的条长占比(0~1)。ref 缺省的非百分比项不画条。 */
export function statFill(value: number, row: StatRow): number {
  const ref = row.ref ?? (row.pct ? REF_DEFAULT_PCT : undefined);
  if (!ref) return 0;
  return Math.max(0, Math.min(1, value / ref));
}
