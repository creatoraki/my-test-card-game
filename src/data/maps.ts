// 地图数据 —— 一张地图 = 一条线性的遭遇战序列(sequence 引用 encounters.ts 的遭遇战 id)。
// runStore 按玩家选中的地图取 sequence, 逐场推进。
// 地图配图不在此登记 —— 数据层不碰素材; 列表页暂无美术资源, 由 UI 用 emoji 兜底。
// 战斗背景按下面的 id 登记在 ui/battleBg.ts(未登记则回退森林)。

export interface MapDef {
  id: string;
  name: string;
  desc: string;
  difficulty: number; // 1-5, UI 渲染成星级
  emoji: string; // 无地图配图时的占位图标
  sequence: string[]; // 遭遇战顺序
}

export const MAPS: MapDef[] = [
  {
    id: "forest",
    name: "迷雾森林",
    desc: "方舟外围的针叶林带。异化的鸟群在此筑巢, 是新兵的第一课。",
    difficulty: 1,
    emoji: "🌲",
    sequence: ["e1", "e2", "e3"],
  },
  {
    id: "nest",
    name: "巢穴腹地",
    desc: "林线以北的深处。鸟群密度陡增, 补给线在此断裂。",
    difficulty: 2,
    emoji: "🪹",
    sequence: ["e2", "e3", "e2", "e3"],
  },
  {
    id: "canopy",
    name: "树冠回廊",
    desc: "高悬于雾层之上的枝道。没有退路, 只有一路向前。",
    difficulty: 3,
    emoji: "🌫️",
    sequence: ["e3", "e3", "e3", "e3", "e3"],
  },
  {
    id: "neon-city",
    name: "霓虹城市",
    desc: "废弃的旧城灯牌仍亮着。清运机械还在照着旧指令拾荒, 把活人也算作了废品。",
    difficulty: 1,
    emoji: "🌆",
    sequence: ["n1"],
  },
];
