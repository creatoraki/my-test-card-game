import { useEffect, useSyncExternalStore } from "react";
import { useRunStore } from "@/store/runStore";
import {
  bgmForScreen,
  getBgmEnabled,
  playBgm,
  subscribeBgmEnabled,
  toggleBgm,
} from "@/ui/audio";

export function useBgm(enabled = true): void {
  const screen = useRunStore((state) => state.screen);

  useEffect(() => {
    if (!enabled) return;
    playBgm(bgmForScreen(screen));
  }, [enabled, screen]);
}

export function useBgmEnabled(): boolean {
  return useSyncExternalStore(subscribeBgmEnabled, getBgmEnabled, getBgmEnabled);
}

export { toggleBgm };