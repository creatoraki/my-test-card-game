import { useEffect, useSyncExternalStore } from "react";
import {
  getSfxEnabled,
  installSfxDelegate,
  subscribeSfxEnabled,
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

export { toggleSfx };
