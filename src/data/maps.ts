// 地图数据 —— 一张地图 = 一趟由 6 轮「区域路由图 + 推进战斗」组成的远征
// (见 探索模式设计.md §3.1 / §9.4 / explore/session.ts)。
// 地图提供四样东西: 走几轮、节点事件从哪个池抽、四个战斗档位各打哪一场、起始净化粒子。
// ★ 战斗档位只决定「本图该档位打哪一场遭遇战」—— 不追加敌人、不改敌方面板;
//   能量档位对战斗的影响仅通过 encounterModifier 注入敌方开局状态(过载层数)与掉落系数。
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
  battleEncounters: Record<BattleTier, string>;
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
      light: "n-crew", // 清运班组 (小怪×2, 轻)
      medium: "n-beacon", // 巡回信标 (小怪×3, 中)
      heavy: "n-compactor", // 报废压缩机 (精英×2, 重)
      boss: "n-boss", // 回收总控 (垃圾山的守护者, BOSS)
    },
    startingEnergy: 100,
  },
  {
    id: "indoor-garden",
    name: "室内花园",
    desc: "尚未配置事件与怪物场景。",
    difficulty: 3,
    emoji: "🌿",
    roundCount: 6,
    eventPoolId: "",
    battleEncounters: {
      light: "",
      medium: "",
      heavy: "",
      boss: "",
    },
    startingEnergy: 100,
  },
  {
    id: "sky-train",
    name: "天空列车",
    desc: "尚未配置事件与怪物场景。",
    difficulty: 3,
    emoji: "🚆",
    roundCount: 6,
    eventPoolId: "",
    battleEncounters: {
      light: "",
      medium: "",
      heavy: "",
      boss: "",
    },
    startingEnergy: 100,
  },
  {
    id: "glass-walkway",
    name: "玻璃栈道",
    desc: "尚未配置事件与怪物场景。",
    difficulty: 3,
    emoji: "🌉",
    roundCount: 6,
    eventPoolId: "",
    battleEncounters: {
      light: "",
      medium: "",
      heavy: "",
      boss: "",
    },
    startingEnergy: 100,
  },
  {
    id: "city-zenith",
    name: "城市天顶",
    desc: "尚未配置事件与怪物场景。",
    difficulty: 3,
    emoji: "🌇",
    roundCount: 6,
    eventPoolId: "",
    battleEncounters: {
      light: "",
      medium: "",
      heavy: "",
      boss: "",
    },
    startingEnergy: 100,
  },
];
