// 遭遇战数据 —— enemies 引用 enemies.ts 的敌人 id(可重复, createBattle 会自动加 A/B/C 后缀)。
// 遭遇战的编排顺序不在此定义 —— 见 maps.ts, 由 MapDef.sequence 串成一次远征。

export interface EncounterDef {
  id: string;
  name: string;
  enemies: string[];
}

export const ENCOUNTERS: EncounterDef[] = [
  { id: "e1", name: "林间怪响", enemies: ["weird-bird", "weird-bird"] },
  { id: "e2", name: "惊起的鸟群", enemies: ["weird-bird", "weird-bird", "weird-bird"] },
  { id: "e3", name: "巢穴深处", enemies: ["weird-bird", "weird-bird", "weird-bird", "weird-bird"] },
];
