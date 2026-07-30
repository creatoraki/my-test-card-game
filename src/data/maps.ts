// 地图数据 —— 一张地图 = 一趟由 6 轮「区域路由图 + 推进战斗」组成的远征
// (见 探索模式设计.md §3.1 / §9.4 / explore/session.ts)。
// 地图提供五样东西: 走几轮、节点事件从哪个池抽、四个战斗档位各打哪一场、
// 高档位时追加什么敌人、起始净化粒子。
//
// 地图配图不在此登记 —— 数据层不碰素材; 选层预览图见 ui/mapArt.ts,
// 战斗背景见 ui/battleBg.ts, 场景氛围见 ui/ambience.ts, 三处都按下面的 id 作键。

import type { BattleTier } from "../explore/types";

export interface MapDef {
  id: string;
  name: string;
  desc: string;
  difficulty: number; // 1-5, UI 渲染成星级
  emoji: string; // 无地图配图时的占位图标

  // ── 区域推进 ──
  roundCount: number; // 一趟走几轮(标准 6)
  eventPoolId: string; // 节点事件池(见 data/exploreEvents.ts)
  // 推进战斗档位 → 遭遇战。轮次到档位的映射是全局固定表(EXPLORE_RULES.battleTierByRound),
  // 地图只负责说「本图的轻/中/大/BOSS 各是谁」。
  // ⚠ 老虎机战斗签(设计文档 §2.4)接上之后, 这里会扩成「每档一个 8 符号转轮池」;
  //   在那之前每档只有一场固定遭遇战。
  battleEncounters: Record<BattleTier, string>;
  fillerEnemyIds: string[]; // 能量档位低时追加的敌人(第 4 档起 +1, BOSS 第 4 档起 +1 护卫)
  startingEnergy: number; // 起始净化粒子, 默认 100(据点「过滤装置充能台」可升级上限)
}

export const MAPS: MapDef[] = [
  {
    id: "neon-city",
    name: "废弃楼层",
    desc: "废弃的旧城灯牌仍亮着。清运机械还在照着旧指令拾荒, 把活人也算作了废品。",
    difficulty: 3,
    emoji: "🌆",
    roundCount: 6,
    eventPoolId: "ruined-floor",
    battleEncounters: {
      light: "n-crew", // 清运班组
      medium: "n-beacon", // 巡回信标
      heavy: "n-compactor", // 报废压缩机
      boss: "n-boss", // 回收总控
    },
    fillerEnemyIds: ["scrap-bot", "radio-bot"],
    startingEnergy: 100,
  },
];
