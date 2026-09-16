import { useCallback, useEffect, useRef, useState } from "react";
import { pickBotLine } from "@/data";

const BUBBLE_MS = 4500;
const IDLE_MIN_MS = 14000;
const IDLE_MAX_MS = 22000;
const DEFAULT_IDLE_RANGE = [IDLE_MIN_MS, IDLE_MAX_MS] as const;

export interface ChatLine {
  id: number;
  text: string;
}

export type BotLineTable<K extends string> = Record<K, readonly string[]>;

export interface BotChatterOptions<K extends string> {
  lines: BotLineTable<K>;
  greet: K;
  idle: K;
  greetEnabled?: boolean;
  idleEnabled?: boolean;
  idleRange?: readonly [number, number];
  /** 气泡停留时长；不同场景的说话节奏不同(默认 4.5s)。 */
  bubbleMs?: number;
  onIdle?: () => void;
}

const nextIdleDelay = (range: readonly [number, number]) => {
  const [min, max] = range;
  return min + Math.random() * Math.max(0, max - min);
};

export function useBotChatter<K extends string>(
  active: boolean,
  {
    lines,
    greet,
    idle,
    greetEnabled = true,
    idleEnabled = true,
    idleRange = DEFAULT_IDLE_RANGE,
    bubbleMs = BUBBLE_MS,
    onIdle,
  }: BotChatterOptions<K>,
): { line: ChatLine | null; say: (kind: K) => void; clear: () => void } {
  const [line, setLine] = useState<ChatLine | null>(null);
  const seqRef = useRef(0);
  const lastTextRef = useRef<string | null>(null);
  const hideTimerRef = useRef(0);
  const idleTimerRef = useRef(0);
  const activeRef = useRef(active);
  const idleEnabledRef = useRef(idleEnabled);
  const idleRangeRef = useRef(idleRange);
  const onIdleRef = useRef(onIdle);
  const bubbleMsRef = useRef(bubbleMs);
  activeRef.current = active;
  idleEnabledRef.current = idleEnabled;
  idleRangeRef.current = idleRange;
  onIdleRef.current = onIdle;
  bubbleMsRef.current = bubbleMs;

  const clearTimers = useCallback(() => {
    window.clearTimeout(hideTimerRef.current);
    window.clearTimeout(idleTimerRef.current);
  }, []);

  const sayRef = useRef<(kind: K) => void>(() => {});

  const scheduleIdle = useCallback(() => {
    window.clearTimeout(idleTimerRef.current);
    if (!activeRef.current || !idleEnabledRef.current) return;
    idleTimerRef.current = window.setTimeout(() => {
      if (!activeRef.current || !idleEnabledRef.current) return;
      if (onIdleRef.current) onIdleRef.current();
      else sayRef.current(idle);
    }, nextIdleDelay(idleRangeRef.current));
  }, [idle]);

  const say = useCallback(
    (kind: K) => {
      if (!activeRef.current) return;
      const text = pickBotLine(lines, kind, lastTextRef.current);
      lastTextRef.current = text;
      seqRef.current += 1;
      setLine({ id: seqRef.current, text });
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = window.setTimeout(() => setLine(null), bubbleMsRef.current);
      scheduleIdle();
    },
    [lines, scheduleIdle],
  );

  sayRef.current = say;

  const clear = useCallback(() => {
    clearTimers();
    setLine(null);
  }, [clearTimers]);

  useEffect(() => {
    if (!active) {
      clear();
      return;
    }
    if (greetEnabled) say(greet);
    else scheduleIdle();
    return clearTimers;
  }, [active, clear, clearTimers, greet, greetEnabled, say, scheduleIdle]);

  useEffect(() => {
    if (!active || !idleEnabled) {
      window.clearTimeout(idleTimerRef.current);
      return;
    }
    scheduleIdle();
  }, [active, idleEnabled, idleRange, scheduleIdle]);

  return { line, say, clear };
}
