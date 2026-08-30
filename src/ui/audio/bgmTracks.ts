import type { Screen } from "@/store/runStore";
import battleBgm from "@/assets/sounds/普通战斗bgm.mp3";
import townBgm from "@/assets/sounds/据点bgm.mp3";

export type BgmId = "town" | "battle";

export const BGM_TRACKS: Record<BgmId, { src: string; volume: number }> = {
  town: { src: townBgm, volume: 0.45 },
  battle: { src: battleBgm, volume: 0.5 },
};

export function bgmForScreen(screen: Screen): BgmId | null {
  if (screen === "elevator") return null;
  return screen === "battle" ? "battle" : "town";
}