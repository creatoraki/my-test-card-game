import { useEffect, useRef, useState } from "react";
import type { ChatLine } from "./useBotChatter";

const OUT_MS = 200;

/** 保留上一句到淡出结束，让气泡退场动画有机会播放。 */
export function useChatLinePresence(line: ChatLine | null): {
  shown: ChatLine | null;
  leaving: boolean;
} {
  const [shown, setShown] = useState<ChatLine | null>(line);
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef(0);

  useEffect(() => {
    window.clearTimeout(timerRef.current);
    if (line) {
      setShown(line);
      setLeaving(false);
      return;
    }
    setLeaving(true);
    timerRef.current = window.setTimeout(() => setShown(null), OUT_MS);
    return () => window.clearTimeout(timerRef.current);
  }, [line]);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  return { shown, leaving };
}
