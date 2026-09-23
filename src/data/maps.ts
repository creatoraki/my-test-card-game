// 地图数据 —— 一张地图 = 一张由若干房间连成的房间图(见 explore/dungeon/)。
// 房间总数就是这张地图的庞大程度; 没有「层」的概念, 开启 BOSS 红门并挑战成功即通关。
// 地图提供三样东西: 有几个房间(及物件配置)、五个战斗档位各有哪些遭遇战、起始净化粒子。
// ★ 战斗档位只决定「本图该档位从哪几场遭遇战中抽取」—— 不追加敌人、不改敌方面板;
//   能量档位对战斗的影响仅通过 encounterModifier 注入敌方开局状态(过载层数)与掉落系数。
//
// 地图配图不在此登记 —— 数据层不碰素材; 选层预览图见 ui/mapArt.ts,
// 战斗背景见 ui/battleBg.ts, 场景氛围见 ui/ambience.ts, 三处都按下面的 id 作键。

import type { DungeonRoomPlan, NearMapVariant } from "../explore/dungeon/types";
import type { CurioLevel } from "./curios/types";
import type { BattleTier } from "../explore/types";
import { RARITY_ORDER, type ItemRarity } from "../items/types";
import { TUTORIAL_DUNGEON_PLAN } from "./tutorialDungeon";
import type { CurioKind } from "../explore/corridor/types";
import { ECO_ARK_MAP } from "./maps/ecoArk";

export interface MapDef {
  id: string;
  name: string;
  desc: string;
  difficulty: number; // 1-5, UI 渲染成星级
  emoji: string; // 无地图配图时的占位图标
  maxEquipRarity: ItemRarity; // 本图装备产出的最高阶, 按 RARITY_ORDER 前缀截断

  // ── 区域推进 ──
  /** 本图的房间总数 = 这张地图的庞大程度; 房间图由 explore/dungeon/generate.ts 现生成。 */
  roomCount: number;
  /** 地区近景决定实际房间宽度、传送门与物件布局。 */
  nearMapVariant?: NearMapVariant;
  /** 有蓝图时按蓝图生成直线房间图；roomCount 应与蓝图长度一致。 */
  dungeonPlan?: readonly DungeonRoomPlan[];
  /** 随机房间图的物件等级区间 [最低, 最高]；越深的房间越接近最高级。 */
  curioLevelRange: readonly [CurioLevel, CurioLevel];
  /** 地区专属物件；权重与通用池合并，治疗及风险池按地区替换。 */
  curioPool?: {
    weights?: Readonly<Partial<Record<CurioKind, number>>>;
    healKinds?: readonly CurioKind[];
    trapKinds?: readonly CurioKind[];
  };
  /** 关闭物件的交互失败(新手关用)。 */
  disableCurioFailure?: boolean;
  /** 通关后不再出现在地图选择带, 但不影响已开始的远征。 */
  hideAfterClear?: boolean;
  // 战斗档位 → 遭遇战候选。房间深度到档位的权重是全局表(EXPLORE_RULES.battleTierWeights),
  // 地图只负责登记每个档位的战斗模板。
  battleEncounters: Record<BattleTier, string[]>;
  /** 可替换 t1-t3 常规战斗的宝箱怪遭遇战。 */
  treasureEncounters?: readonly string[];
  startingEnergy: number; // 起始净化粒子, 默认 100(据点「过滤装置充能台」可升级上限)
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
    roomCount: 6,
    dungeonPlan: TUTORIAL_DUNGEON_PLAN,
    curioLevelRange: [1, 1],
    disableCurioFailure: true,
    hideAfterClear: true,
    battleEncounters: {
      t1: ["tut-t1-intro", "tut-t1-scout"],
      t2: ["tut-t2-crew", "tut-t2-signal"],
      t3: ["tut-t3-line", "tut-t3-relay"],
      t4: ["tut-t3-line", "tut-t3-relay"],
      t5: ["n-t5-boss"],
    },
    startingEnergy: 100,
  },
  {
    id: "neon-city",
    name: "废弃楼层",
    desc: "废弃的旧城灯牌仍亮着。清运机械还在照着旧指令拾荒, 把活人也算作了废品。",
    difficulty: 3,
    emoji: "🌆",
    maxEquipRarity: "common",
    roomCount: 12,
    curioLevelRange: [1, 3],
    battleEncounters: {
      t1: ["n-t1-scout", "n-t1-sweep", "n-t1-drift"],
      t2: ["n-t2-crew", "n-t2-beacon", "n-t2-current", "n-t2-duo-crush", "n-t2-duo-torch"],
      t3: ["n-t3-patrol", "n-t3-blockade", "n-t3-swarm"],
      t4: ["n-t4-patrol", "n-t4-blockade", "n-t4-elite-guard", "n-t4-compactor", "n-t4-storm"],
      t5: ["n-t5-boss"],
    },
    treasureEncounters: ["n-mimic-gear", "n-mimic-card"],
    requiresClear: "tutorial",
    startingEnergy: 100,
  },
  ECO_ARK_MAP,
  {
    id: "indoor-garden",
    name: "室内花园",
    desc: "尚未配置事件与怪物场景。",
    difficulty: 3,
    emoji: "🌿",
    maxEquipRarity: "common",
    roomCount: 12,
    curioLevelRange: [1, 3],
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
    roomCount: 14,
    curioLevelRange: [1, 3],
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
    roomCount: 14,
    curioLevelRange: [1, 3],
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
    roomCount: 16,
    curioLevelRange: [1, 3],
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

export function visibleMaps(clearedMaps: readonly string[]): MapDef[] {
  return MAPS.filter((map) => !map.hideAfterClear || !clearedMaps.includes(map.id));
}

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

export function mapEquipRarities(mapId: string): ItemRarity[];
export function mapEquipRarities(map: MapDef): ItemRarity[];
export function mapEquipRarities(mapOrId: string | MapDef): ItemRarity[] {
  const map = typeof mapOrId === "string"
    ? MAPS.find((candidate) => candidate.id === mapOrId)
    : mapOrId;
  if (!map) throw new Error(`未知地图: ${mapOrId}`);
  return RARITY_ORDER.slice(0, RARITY_ORDER.indexOf(map.maxEquipRarity) + 1);
}
