import { preloadImage, preloadVideo } from "@/ui/art/assetLoader";
import { CARD_ART_SOURCES } from "@/ui/art/cardArt";
import { CHARACTER_ART_SOURCES } from "@/ui/common/CharacterPortrait/CharacterPortrait";
import { ENEMY_ART_SOURCES } from "@/ui/art/enemyArt";
import { EVENT_ART_SOURCES } from "@/ui/art/eventArt";
import { ITEM_ART_SOURCES } from "@/ui/art/itemArt";
import { MAP_ART_SOURCES } from "@/ui/art/mapArt";
import { SCENE_ART_SOURCES, SCENE_VIDEO_SOURCES } from "@/ui/art/sceneArt";
import { SLOT_ART_SOURCES } from "@/ui/art/slotArt";
import { ALL_SPRITE_FRAMES } from "@/ui/art/vfxSprites";
import { BATTLE_BG_IMAGE_SOURCES, BATTLE_BG_VIDEO_SOURCES } from "@/ui/art/battleBg";
import { FACILITY_SCENES } from "@/ui/town/facilityScenes";

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
  ...Object.values(FACILITY_SCENES).map((scene) => scene.bg),
  ...ENEMY_ART_SOURCES,
  ...ALL_SPRITE_FRAMES,
  ...CARD_ART_SOURCES,
  ...EVENT_ART_SOURCES,
  ...SLOT_ART_SOURCES,
  ...ITEM_ART_SOURCES,
  ...CHARACTER_ART_SOURCES,
]);

const videoSources = unique([...SCENE_VIDEO_SOURCES, ...BATTLE_BG_VIDEO_SOURCES]);

export const GAME_ASSET_TASKS: readonly AssetTask[] = [
  ...imageSources.map((src) => ({ kind: "image" as const, src })),
  ...videoSources.map((src) => ({ kind: "video" as const, src })),
];

const INITIAL_SNAPSHOT: AssetPreloadSnapshot = {
  status: "idle",
  total: GAME_ASSET_TASKS.length,
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

  publish({
    status: "loading",
    total: GAME_ASSET_TASKS.length,
    completed: 0,
    failed: 0,
  });

  let completed = 0;
  let failed = 0;

  const tasks = GAME_ASSET_TASKS.map((task) =>
    Promise.resolve()
      .then(() => (task.kind === "image" ? preloadImage(task.src) : preloadVideo(task.src)))
      .catch(() => {
        failed += 1;
      })
      .then(() => {
        completed += 1;
        publish({
          status: "loading",
          total: GAME_ASSET_TASKS.length,
          completed,
          failed,
        });
      }),
  );

  preloadPromise = Promise.all(tasks).then(() => {
    publish({
      status: "ready",
      total: GAME_ASSET_TASKS.length,
      completed,
      failed,
    });
  });

  return preloadPromise;
}