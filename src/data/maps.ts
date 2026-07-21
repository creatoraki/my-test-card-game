// 地图数据 —— 一张地图 = 一场探索牌局(见 探索模式设计.md / explore/session.ts)。
// 地图不再是线性的遭遇战序列, 而是提供四样东西: 打哪几场、BOSS 是谁、能抽到什么牌、高危时加什么敌人。
//
// 地图配图不在此登记 —— 数据层不碰素材; 列表页暂无美术资源, 由 UI 用 emoji 兜底。
// 战斗背景按下面的 id 登记在 ui/battleBg.ts(未登记则回退森林)。

export interface MapDef {
  id: string;
  name: string;
  desc: string;
  difficulty: number; // 1-5, UI 渲染成星级
  emoji: string; // 无地图配图时的占位图标

  // ── 探索牌局 ──
  encounterCount: number; // 发几张〔遭遇〕路线牌(打完才揭示 BOSS)
  encounterPool: string[]; // 每张遭遇卡从这里随机绑定一个 encounter id(开局即确定并亮在卡面上)
  bossEncounterId: string; // 最终战
  // 探索卡 defId(见 data/explore.ts)。重复登记 = 提高抽到的概率。
  // ⚠ 打出的卡不洗回牌库 ⇒ **这个数组的长度 = 这张地图最多能玩多久**。
  explorePool: string[];
  fillerEnemyIds: string[]; // 危险度高时追加的敌人(第 3 档 +1, 第 5 档 +2, BOSS 第 4 档起 +1 护卫)
}

export const MAPS: MapDef[] = [
  {
    id: "forest",
    name: "迷雾森林",
    desc: "方舟外围的针叶林带。异化的鸟群在此筑巢, 是新兵的第一课。",
    difficulty: 1,
    emoji: "🌲",
    encounterCount: 3,
    encounterPool: ["e1", "e2"],
    bossEncounterId: "e3",
    fillerEnemyIds: ["weird-bird"],
    // 14 张: 起手 3 + 三场战斗各 2 = 常规摸到 9 张, 剩下 5 张要靠「搜寻」抬危险度才挖得到底。
    explorePool: [
      "gather-moss",
      "gather-moss",
      "scavenge",
      "scavenge",
      "supply-crate",
      "hidden-path",
      "tailwind",
      "ruined-camp",
      "clear-spring",
      "flush-flock",
      "burn-nest",
      "cover-tracks",
      "detour",
      "snare",
    ],
  },
  {
    id: "nest",
    name: "巢穴腹地",
    desc: "林线以北的深处。鸟群密度陡增, 补给线在此断裂。",
    difficulty: 2,
    emoji: "🪹",
    encounterCount: 3,
    encounterPool: ["e2", "e3"],
    bossEncounterId: "e3",
    fillerEnemyIds: ["weird-bird"],
    explorePool: [
      "gather-moss",
      "scavenge",
      "scavenge",
      "supply-crate",
      "hidden-path",
      "ruined-camp",
      "clear-spring",
      "flush-flock",
      "flush-flock",
      "burn-nest",
      "cover-tracks",
      "detour",
      "snare",
      "snare",
      "lost-way",
    ],
  },
  {
    id: "neon-city",
    name: "霓虹城市",
    desc: "废弃的旧城灯牌仍亮着。清运机械还在照着旧指令拾荒, 把活人也算作了废品。",
    difficulty: 3,
    emoji: "🌆",
    encounterCount: 3,
    encounterPool: ["n1"],
    bossEncounterId: "n1",
    fillerEnemyIds: ["scrap-bot", "radio-bot"],
    explorePool: [
      "scavenge",
      "scavenge",
      "supply-crate",
      "supply-crate",
      "hidden-path",
      "tailwind",
      "ruined-camp",
      "flush-flock",
      "burn-nest",
      "cover-tracks",
      "detour",
      "snare",
      "lost-way",
    ],
  },
];
