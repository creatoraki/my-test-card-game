// ★ 占位遭遇战数据 ★ —— enemies 引用 enemies.ts 的敌人 id(可重复)。
// runStore 会按顺序把这些遭遇战串成一次"跑"。

export interface EncounterDef {
  id: string;
  name: string;
  enemies: string[];
}

export const ENCOUNTERS: EncounterDef[] = [
  { id: "e1", name: "洞穴入口", enemies: ["slime", "slime"] },
  { id: "e2", name: "哥布林巡逻队", enemies: ["goblin", "goblin", "bat"] },
  { id: "e3", name: "深处的巨兽", enemies: ["brute", "slime"] },
];

// 一次"跑"的遭遇战顺序
export const RUN_SEQUENCE: string[] = ["e1", "e2", "e3"];
