import { backpackFree } from "@/explore/session";
import { useExploreStore } from "@/store/explore/exploreStore";

/** 背包是否已经没有空格 —— 拾取栏据此给出「整理背包」入口(拾取失败时也会给)。 */
export function useBagFull(): boolean {
  return useExploreStore((state) => Boolean(state.session && backpackFree(state.session) <= 0));
}
