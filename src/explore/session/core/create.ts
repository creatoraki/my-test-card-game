// 建立会话 —— 一趟远征的初始状态, 以及整张房间图的生成。

import { difficultyMapConfig, getItemDef } from "@/data";
import type { MapDifficulty } from "@/data/maps/mapDifficulty";
import type { ItemStack } from "@/items/types";
import { generateDungeon } from "../../dungeon/generate";
import { enterRoom } from "../../dungeon/dungeonSession";
import type { ExploreState, PartySnapshot } from "../../types";
import { logLine } from "./log";

// ★ initialBackpack 排在 seed 之后, 不是「更重要」的第三参 —— 单测按位置传 seed 的调用点
//   有好几处, 插在中间会把它们全部改坏。出发时装填的物资由出击准备界面(ui/sortie)备好。
export function createSession(
  mapId: string,
  party: PartySnapshot[],
  seed?: number,
  initialBackpack: ItemStack[] = [],
  ownedRelicIds: string[] = [],
  difficulty: MapDifficulty = "normal",
): ExploreState {
  const map = difficultyMapConfig(mapId, difficulty);
  const s: ExploreState = {
    corridor: null,
    dungeon: null,
    mapId,
    difficulty,
    energy: map.startingEnergy,
    loot: 0,
    round: 1,
    roomCount: map.roomCount,
    roundBattleTier: "t1",
    battlesWon: 0,
    sceneEvents: [],
    landedIndex: null,
    party: party.map((p) => ({ ...p })),
    stats: { kills: 0, expTotal: 0, pickups: 0, energySpent: 0 },
    battleEnergyMark: 0,
    history: [],
    // 出发时带进来的物资(货柜买的 + 从仓库拿的)。★ 拷贝一份: 准备界面那边还持有原数组,
    // 会话开始后两边不能再互相影响。
    backpack: initialBackpack.map((st) => ({ ...st })),
    shipped: [],
    pendingPickup: [],
    ownedRelicIds: [
      ...new Set([
        ...ownedRelicIds,
        ...initialBackpack
          .filter((stack) => getItemDef(stack.itemId).category === "relic")
          .map((stack) => stack.itemId),
      ]),
    ],
    pendingLoot: [],
    pendingBoons: [],
    pendingCardOffer: null,
    pendingExp: {},
    pendingActions: [],
    pendingStory: [],
    chuteOpen: false,
    freeNodes: 0,
    pendingNotes: [],
    pendingPollution: [],
    pendingContaminationCount: 0,
    pendingContaminationEach: 0,
    picnicUsed: false,
    relicCounters: {},
    beaconUsed: false,
    pendingEncounterId: null,
    pendingIsBoss: false,
    pendingBattleTier: null,
    battleSource: null,
    pendingChallengeBonus: 0,
    phase: "atNode", // 占位: 下面的 generateDungeonRun 会立刻落到起始房间的 atNode
    rngState: (seed ?? (Date.now() & 0xffffffff)) >>> 0,
    log: [],
  };

  logLine(s, `接入 ${map.name}（共 ${s.roomCount} 个房间）`);
  generateDungeonRun(s);
  return s;
}

/** 建局时生成整张房间图并落到起始房间。一趟远征只调一次 —— 房间制没有「下一层」。 */
export function generateDungeonRun(s: ExploreState): void {
  s.dungeon = generateDungeon(s);
  s.roundBattleTier = "t1";
  enterRoom(s, s.dungeon.startRoomId);
}
