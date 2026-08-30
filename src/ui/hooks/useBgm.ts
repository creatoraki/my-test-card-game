import { useEffect, useSyncExternalStore } from "react";
import { useRunStore } from "@/store/runStore";
import {
  bgmForScreen,
  getBgmEnabled,
  playBgm,
  subscribeBgmEnabled,
  stopAllBgm,
  toggleBgm,
} from "@/ui/audio";

export function useBgm(enabled = true): void {
  const screen = useRunStore((state) => state.screen);

  useEffect(() => {
    if (!enabled) return;
    const id = bgmForScreen(screen);
    if (!id) {
      stopAllBgm({ fade: true, rewind: true });
      return;
    }
    playBgm(id);
  }, [enabled, screen]);
}

export function useBgmEnabled(): boolean {
  return useSyncExternalStore(subscribeBgmEnabled, getBgmEnabled, getBgmEnabled);
}

export { toggleBgm };