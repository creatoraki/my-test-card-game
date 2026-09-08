import { useEffect, useSyncExternalStore } from "react";
import {
  getSfxEnabled,
  getSfxVolume,
  installSfxDelegate,
  setSfxVolume,
  subscribeSfxEnabled,
  subscribeSfxVolume,
  toggleSfx,
} from "@/ui/audio";

export function useSfx(enabled = true): void {
  useEffect(() => {
    if (!enabled) return;
    return installSfxDelegate();
  }, [enabled]);
}

export function useSfxEnabled(): boolean {
  return useSyncExternalStore(subscribeSfxEnabled, getSfxEnabled, getSfxEnabled);
}

export function useSfxVolume(): number {
  return useSyncExternalStore(subscribeSfxVolume, getSfxVolume, getSfxVolume);
}

export { setSfxVolume, toggleSfx };
