import { useCallback, useMemo, useRef, useState } from "react";
import type { CrawlCallbacks, LoadingState, LootNotice, PromptInfo } from "../types";

/**
 * HUD 状态与运行时回调: 房间加载进度、调查提示、获得飘字、遭遇卡、校准叠层开关。
 * 提示条的位置每帧变化, 直接写 DOM transform, 不触发 React 渲染。
 */
export function useCrawlHud() {
  const [loading, setLoading] = useState<LoadingState | null>(null);
  const [prompt, setPrompt] = useState<PromptInfo | null>(null);
  const [loots, setLoots] = useState<LootNotice[]>([]);
  const [encounter, setEncounter] = useState<string | null>(null);
  const [debug, setDebug] = useState(false);
  const promptRef = useRef<HTMLDivElement>(null);

  const callbacks = useMemo<CrawlCallbacks>(() => ({
    onLoading: (state) => setLoading(state),
    onPrompt: (info) => setPrompt(info),
    onPromptMove: (x, y) => {
      const el = promptRef.current;
      if (el) el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    },
    onLoot: (item) => setLoots((list) => [...list.slice(-4), item]),
    onEncounter: (guardId) => setEncounter(guardId),
    onDebug: (on) => setDebug(on),
  }), []);

  const dropLoot = useCallback((key: number) => setLoots((list) => list.filter((item) => item.key !== key)), []);

  return { loading, prompt, loots, encounter, setEncounter, debug, promptRef, callbacks, dropLoot };
}
