import type { Screen } from "@/store/runStore";
import battleBgm from "@/assets/sounds/普通战斗bgm.mp3";
import townBgm from "@/assets/sounds/据点bgm.mp3";
import elevatorDescentBgm from "@/assets/sounds/电梯下降循环.mp3";

export type BgmId = "town" | "battle" | "elevator";

export const BGM_TRACKS: Record<BgmId, { src: string; volume: number; loop?: boolean }> = {
  town: { src: townBgm, volume: 0.45 },
  battle: { src: battleBgm, volume: 0.5 },
  elevator: { src: elevatorDescentBgm, volume: 0.8, loop: false },
};

export function bgmForScreen(screen: Screen): BgmId | null {
  if (screen === "elevator") return null;
  return screen === "battle" ? "battle" : "town";
}