// 地图数据 —— 一张地图 = 一趟由 5-7 段阿弥陀签路由决策组成的远征
// (见 探索模式设计.md §9.4 / explore/session.ts)。
// 地图提供五样东西: 走几段、BOSS 从第几段起可接入、终点事件从哪个池抽、BOSS 是谁、
// 高档位时追加什么敌人。
//
// 地图配图不在此登记 —— 数据层不碰素材; 选层预览图见 ui/mapArt.ts,
// 战斗背景见 ui/battleBg.ts, 场景氛围见 ui/ambience.ts, 三处都按下面的 id 作键。

export interface MapDef {
  id: string;
  name: string;
  desc: string;
  difficulty: number; // 1-5, UI 渲染成星级
  emoji: string; // 无地图配图时的占位图标

  // ── 路由远征 ──
  routeSegments: number; // 一趟走几段(建议 5-7; 标准 6)
  bossAvailableFrom: number; // 从第几段起, 终点池开始出现 BOSS 接入点与撤离升降机
  eventPoolId: string; // 终点事件池(见 data/exploreEvents.ts)
  bossEncounterId: string; // 最终战(事件池里的 BOSS 接入点应指向同一场)
  fillerEnemyIds: string[]; // 能量档位低时追加的敌人(第 3 档 +1, 第 5 档 +2, BOSS 第 4 档起 +1 护卫)
  startingEnergy: number; // 起始净化粒子, 默认 100(据点「过滤装置充能台」可升级上限)
}

export const MAPS: MapDef[] = [
  {
    id: "neon-city",
    name: "废弃楼层",
    desc: "废弃的旧城灯牌仍亮着。清运机械还在照着旧指令拾荒, 把活人也算作了废品。",
    difficulty: 3,
    emoji: "🌆",
    routeSegments: 6,
    bossAvailableFrom: 5,
    eventPoolId: "ruined-floor",
    bossEncounterId: "n-boss",
    fillerEnemyIds: ["scrap-bot", "radio-bot"],
    startingEnergy: 100,
  },
];
