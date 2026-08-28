import { useEffect } from "react";
import { useRunStore } from "@/store/runStore";
import { bgmForScreen, playBgm } from "@/ui/audio";

export function useBgm(enabled = true): void {
  const screen = useRunStore((state) => state.screen);

  useEffect(() => {
    if (!enabled) return;
    playBgm(bgmForScreen(screen));
  }, [enabled, screen]);
}