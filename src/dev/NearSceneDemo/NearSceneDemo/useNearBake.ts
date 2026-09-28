import { useEffect, useState } from "react";
import { bakeNearScene, planNearScene, releaseNearBake, type NearSceneBake } from "@/ui/art/proceduralNear";

interface NearBakeState {
  bake: NearSceneBake | null;
  progress: number;
  baking: boolean;
}

/**
 * 按种子与宽度烘焙近景。切换参数时取消上一次烘焙；新结果完整就绪后才替换旧结果，
 * 旧位图在新图挂上之后（被动副作用清理阶段）才释放，避免闪烁。
 */
export function useNearBake(seed: number, width: number): NearBakeState {
  const [state, setState] = useState<NearBakeState>({ bake: null, progress: 0, baking: true });

  useEffect(() => {
    const controller = new AbortController();
    setState((prev) => ({ ...prev, progress: 0, baking: true }));
    bakeNearScene(planNearScene(seed, width), {
      signal: controller.signal,
      onProgress: (progress) => setState((prev) => ({ ...prev, progress })),
    })
      .then((bake) => setState({ bake, progress: 1, baking: false }))
      .catch((error: unknown) => {
        if ((error as { name?: string })?.name !== "AbortError") console.error(error);
      });
    return () => controller.abort();
  }, [seed, width]);

  useEffect(() => {
    const bake = state.bake;
    return () => releaseNearBake(bake);
  }, [state.bake]);

  return state;
}
