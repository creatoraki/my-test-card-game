import { useEffect } from "react";
import type { ExploreState } from "@/explore/types";
import { useExploreStore } from "@/store/explore/exploreStore";
import { demoBackpack, demoParty } from "./demoParty";

const DEMO_MAP_ID = "neon-city";
const DEMO_SEED = 1313;

/**
 * 给真实探索 HUD(能量读数、小地图、队伍、背包)准备一局演示会话。
 * exploreStore 不持久化, 会话只活在内存里; 离开演示页即清空。
 */
export function useDemoSession(): ExploreState | null {
  const session = useExploreStore((state) => state.session);
  useEffect(() => {
    const store = useExploreStore.getState();
    if (!store.session) store.start(DEMO_MAP_ID, demoParty(), DEMO_SEED, demoBackpack());
    return () => useExploreStore.getState().clear();
  }, []);
  return session;
}
