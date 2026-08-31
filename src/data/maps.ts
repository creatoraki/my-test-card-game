// 地图数据 —— 一张地图 = 一趟由 6 轮「区域路由图 + 推进战斗」组成的远征
// (见 探索模式设计.md §3.1 / §9.4 / explore/session.ts)。
// 地图提供四样东西: 走几轮、节点事件从哪个池抽、五个战斗档位各有哪些遭遇战、起始净化粒子。
// ★ 战斗档位只决定「本图该档位从哪几场遭遇战中抽取」—— 不追加敌人、不改敌方面板;
//   能量档位对战斗的影响仅通过 encounterModifier 注入敌方开局状态(过载层数)与掉落系数。
//
// 地图配图不在此登记 —— 数据层不碰素材; 选层预览图见 ui/mapArt.ts,
// 战斗背景见 ui/battleBg.ts, 场景氛围见 ui/ambience.ts, 三处都按下面的 id 作键。

import type { BattleTier } from "../explore/types";
import { RARITY_ORDER, type ItemRarity } from "../items/types";

export interface MapDef {
  id: string;
  name: string;
  desc: string;
  difficulty: number; // 1-5, UI 渲染成星级
  emoji: string; // 无地图配图时的占位图标
  maxEquipRarity: ItemRarity; // 本图装备产出的最高阶, 按 RARITY_ORDER 前缀截断

  // ── 区域推进 ──
  roundCount: number; // 一趟走几轮(标准 6)
  eventPoolId: string; // 节点事件池(见 data/exploreEvents.ts)
  // 推进战斗档位 → 遭遇战候选。轮次到档位的权重是全局表(EXPLORE_RULES.battleTierWeights),
  // 地图只负责登记每个档位的战斗模板。
  battleEncounters: Record<BattleTier, string[]>;
  startingEnergy: number; // 起始净化粒子, 默认 100(据点「过滤装置充能台」可升级上限)
  /** 覆盖全局档位权重; 下标 = 轮次 - 1, 越界时沿用最后一档。 */
  battleTierByRound?: readonly BattleTier[];
  /** 需要先通关这张地图才开放。 */
  requiresClear?: string;
  /** 内容未就绪, 一律锁死。 */
  locked?: boolean;
}

export const MAPS: MapDef[] = [
  {
    id: "tutorial",
    name: "新手关卡",
    desc: "训练场的警示灯逐一亮起。先熟悉路线、卡牌与战斗节奏, 再把脚步交给真正危险的楼层。",
    difficulty: 1,
    emoji: "🧭",
    maxEquipRarity: "common",
    roundCount: 3,
    eventPoolId: "ruined-floor",
    battleEncounters: {
      t1: ["n-t1-scout", "n-t1-sweep"],
      t2: ["n-t2-crew", "n-t2-beacon"],
      t3: ["n-t3-patrol", "n-t3-blockade"],
      t4: ["n-t4-patrol", "n-t4-blockade", "n-t4-elite-guard", "n-t4-compactor"],
      t5: ["n-t5-boss"],
    },
    battleTierByRound: ["t1", "t2", "t3"],
    startingEnergy: 100,
  },
  {
    id: "neon-city",
    name: "废弃楼层",
    desc: "废弃的旧城灯牌仍亮着。清运机械还在照着旧指令拾荒, 把活人也算作了废品。",
    difficulty: 3,
    emoji: "🌆",
    maxEquipRarity: "common",
    roundCount: 6,
    eventPoolId: "ruined-floor",
    battleEncounters: {
      t1: ["n-t1-scout", "n-t1-sweep"],
      t2: ["n-t2-crew", "n-t2-beacon"],
      t3: ["n-t3-patrol", "n-t3-blockade"],
      t4: ["n-t4-patrol", "n-t4-blockade", "n-t4-elite-guard", "n-t4-compactor"],
      t5: ["n-t5-boss"],
    },
    requiresClear: "tutorial",
    startingEnergy: 100,
  },
  {
    id: "indoor-garden",
    name: "室内花园",
    desc: "尚未配置事件与怪物场景。",
    difficulty: 3,
    emoji: "🌿",
    maxEquipRarity: "common",
    roundCount: 6,
    eventPoolId: "",
    battleEncounters: {
      t1: [],
      t2: [],
      t3: [],
      t4: [],
      t5: [],
    },
    locked: true,
    startingEnergy: 100,
  },
  {
    id: "sky-train",
    name: "天空列车",
    desc: "尚未配置事件与怪物场景。",
    difficulty: 3,
    emoji: "🚆",
    maxEquipRarity: "common",
    roundCount: 6,
    eventPoolId: "",
    battleEncounters: {
      t1: [],
      t2: [],
      t3: [],
      t4: [],
      t5: [],
    },
    locked: true,
    startingEnergy: 100,
  },
  {
    id: "glass-walkway",
    name: "玻璃栈道",
    desc: "尚未配置事件与怪物场景。",
    difficulty: 3,
    emoji: "🌉",
    maxEquipRarity: "common",
    roundCount: 6,
    eventPoolId: "",
    battleEncounters: {
      t1: [],
      t2: [],
      t3: [],
      t4: [],
      t5: [],
    },
    locked: true,
    startingEnergy: 100,
  },
  {
    id: "city-zenith",
    name: "城市天顶",
    desc: "尚未配置事件与怪物场景。",
    difficulty: 3,
    emoji: "🌇",
    maxEquipRarity: "common",
    roundCount: 6,
    eventPoolId: "",
    battleEncounters: {
      t1: [],
      t2: [],
      t3: [],
      t4: [],
      t5: [],
    },
    locked: true,
    startingEnergy: 100,
  },
];

export function isMapUnlocked(mapId: string, clearedMaps: readonly string[]): boolean {
  const map = MAPS.find((candidate) => candidate.id === mapId);
  if (!map || map.locked) return false;
  return !map.requiresClear || clearedMaps.includes(map.requiresClear);
}

export function mapLockReason(mapId: string, clearedMaps: readonly string[]): string | null {
  const map = MAPS.find((candidate) => candidate.id === mapId);
  if (!map || !isMapUnlocked(mapId, clearedMaps)) {
    if (map?.requiresClear) {
      const requiredMap = MAPS.find((candidate) => candidate.id === map.requiresClear);
      return requiredMap ? `通关${requiredMap.name}后开放` : "暂未开放";
    }
    return "暂未开放";
  }
  return null;
}

export function mapEquipRarities(mapId: string): ItemRarity[] {
  const map = MAPS.find((candidate) => candidate.id === mapId);
  if (!map) throw new Error(`未知地图: ${mapId}`);
  return RARITY_ORDER.slice(0, RARITY_ORDER.indexOf(map.maxEquipRarity) + 1);
}
