import { preloadImage, preloadVideo, scheduleLowPriority } from "@/ui/art/loader/assetLoader";
import { loadPreloadedSources, savePreloadedSources } from "@/ui/art/loader/assetPreloadMemory";
import { CARD_ART_SOURCES } from "@/ui/art/battle/cardArt";
import { CHARACTER_ART_SOURCES } from "@/ui/common/unit/CharacterPortrait/CharacterPortrait";
import { ENEMY_ART_SOURCES } from "@/ui/art/battle/enemyArt";
import { EVENT_ART_SOURCES } from "@/ui/art/explore/eventArt";
import { EVENT_DOSSIER_ART_SOURCES } from "@/ui/art/explore/eventDossierArt";
import { CARD_PICK_ART_SOURCES } from "@/ui/art/reward/cardPickArt";
import { DECK_SERVICE_ART_SOURCES } from "@/ui/art/explore/deckServiceArt";
import { PARTY_DOSSIER_ART_SOURCES } from "@/ui/art/explore/partyDossierArt";
import { ITEM_ART_SOURCES } from "@/ui/art/items/itemArt";
import { MAP_ART_SOURCES } from "@/ui/art/explore/mapArt";
import { RARITY_CRYSTAL_SOURCES } from "@/ui/art/items/rarityArt";
import { SCENE_ART_SOURCES, SCENE_VIDEO_SOURCES } from "@/ui/art/explore/sceneArt";
import { STATUS_ART_SOURCES } from "@/ui/art/battle/statusArt";
import { BUFF_ART_SOURCES } from "@/ui/art/battle/buffArt";
import { CARD_MARK_ART_SOURCES } from "@/ui/art/battle/cardMarkArt";
import { CORRIDOR_ART_SOURCES } from "@/ui/art/corridor/corridorArt";
import { BATTLE_BG_IMAGE_SOURCES } from "@/ui/art/battle/battleBg";
import { STATION_BUILDINGS } from "@/ui/town/TownScreen/stationBuildings";

export type AssetPreloadStatus = "idle" | "loading" | "ready";

export interface AssetPreloadSnapshot {
  status: AssetPreloadStatus;
  total: number;
  completed: number;
  failed: number;
}

interface AssetTask {
  kind: "image" | "video";
  src: string;
}

const unique = (sources: readonly string[]): string[] => [...new Set(sources)];

const imageSources = unique([
  ...SCENE_ART_SOURCES,
  ...BATTLE_BG_IMAGE_SOURCES,
  ...MAP_ART_SOURCES,
  ...STATION_BUILDINGS.map((building) => building.bg),
  ...ENEMY_ART_SOURCES,
  ...CARD_ART_SOURCES,
  ...EVENT_ART_SOURCES,
  ...EVENT_DOSSIER_ART_SOURCES,
  ...CARD_PICK_ART_SOURCES,
  ...DECK_SERVICE_ART_SOURCES,
  ...PARTY_DOSSIER_ART_SOURCES,
  ...RARITY_CRYSTAL_SOURCES,
  ...ITEM_ART_SOURCES,
  ...STATUS_ART_SOURCES,
  ...BUFF_ART_SOURCES,
  ...CARD_MARK_ART_SOURCES,
  ...CHARACTER_ART_SOURCES,
  ...CORRIDOR_ART_SOURCES,
]);

const videoSources = unique([...SCENE_VIDEO_SOURCES]);
const PRELOAD_TASK_CONCURRENCY = 2;

export const GAME_ASSET_TASKS: readonly AssetTask[] = [
  ...imageSources.map((src) => ({ kind: "image" as const, src })),
  ...videoSources.map((src) => ({ kind: "video" as const, src })),
];

const INITIAL_SNAPSHOT: AssetPreloadSnapshot = {
  status: "idle",
  // total = 本次开屏实际要预加载的数量(已缓存的不计), 开始预加载时才确定。
  total: 0,
  completed: 0,
  failed: 0,
};

let snapshot = INITIAL_SNAPSHOT;
let preloadPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

function publish(next: AssetPreloadSnapshot): void {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

export function subscribeAssetPreload(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAssetPreloadSnapshot(): AssetPreloadSnapshot {
  return snapshot;
}

export function startGameAssetPreload(): Promise<void> {
  if (preloadPromise) return preloadPromise;

  // 加载成功过的素材已在浏览器永久缓存里, 只预加载新增 / 改动过的(见 assetPreloadMemory.ts)。
  const done = loadPreloadedSources();
  const tasks = GAME_ASSET_TASKS.filter((task) => !done.has(task.src));
  const allSources = GAME_ASSET_TASKS.map((task) => task.src);

  if (tasks.length === 0) {
    publish({ status: "ready", total: 0, completed: 0, failed: 0 });
    preloadPromise = Promise.resolve();
    return preloadPromise;
  }

  publish({ status: "loading", total: tasks.length, completed: 0, failed: 0 });

  let completed = 0;
  let failed = 0;

  preloadPromise = new Promise<void>((resolve) => {
    let nextTaskIndex = 0;
    let activeTasks = 0;

    const pump = () => {
      if (completed === tasks.length) {
        resolve();
        return;
      }

      while (activeTasks < PRELOAD_TASK_CONCURRENCY && nextTaskIndex < tasks.length) {
        const task = tasks[nextTaskIndex];
        nextTaskIndex += 1;
        activeTasks += 1;

        const loadTask = task.kind === "image" ? preloadImage(task.src) : preloadVideo(task.src);
        void loadTask
          .then(() => {
            done.add(task.src);
          }, () => {
            failed += 1;
          })
          .then(() => {
            activeTasks -= 1;
            completed += 1;
            publish({ status: "loading", total: tasks.length, completed, failed });
            scheduleLowPriority(pump);
          });
      }
    };

    scheduleLowPriority(pump);
  }).then(() => {
    // 失败的不记入, 下次开屏重试。
    savePreloadedSources(done, allSources);
    publish({ status: "ready", total: tasks.length, completed, failed });
  });

  return preloadPromise;
}
