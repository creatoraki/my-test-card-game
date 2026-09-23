import { useSyncExternalStore } from "react";
import {
  getAssetPreloadSnapshot,
  subscribeAssetPreload,
} from "@/ui/art/loader/assetPreloader";

export function useGameAssetPreload() {
  const snapshot = useSyncExternalStore(
    subscribeAssetPreload,
    getAssetPreloadSnapshot,
    getAssetPreloadSnapshot,
  );

  return snapshot;
}