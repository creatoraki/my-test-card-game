import { useCallback, useEffect, useRef, useState } from "react";
import { pickBotLine } from "@/data";

const BUBBLE_MS = 4500;
const IDLE_MIN_MS = 14000;
const IDLE_MAX_MS = 22000;

export interface ChatLine {
  id: number;
  text: string;
}

export type BotLineTable<K extends string> = Record<K, readonly string[]>;

export interface BotChatterOptions<K extends string> {
  lines: BotLineTable<K>;
  greet: K;
  idle: K;
}

const nextIdleDelay = () => IDLE_MIN_MS + Math.random() * (IDLE_MAX_MS - IDLE_MIN_MS);

export function useBotChatter<K extends string>(
  active: boolean,
  { lines, greet, idle }: BotChatterOptions<K>,
): { line: ChatLine | null; say: (kind: K) => void } {
  const [line, setLine] = useState<ChatLine | null>(null);
  const seqRef = useRef(0);
  const lastTextRef = useRef<string | null>(null);
  const hideTimerRef = useRef(0);
  const idleTimerRef = useRef(0);
  const activeRef = useRef(active);
  activeRef.current = active;

  const clearTimers = useCallback(() => {
    window.clearTimeout(hideTimerRef.current);
    window.clearTimeout(idleTimerRef.current);
  }, []);

  const sayRef = useRef<(kind: K) => void>(() => {});

  const scheduleIdle = useCallback(() => {
    window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(() => sayRef.current(idle), nextIdleDelay());
  }, [idle]);

  const say = useCallback(
    (kind: K) => {
      if (!activeRef.current) return;
      const text = pickBotLine(lines, kind, lastTextRef.current);
      lastTextRef.current = text;
      seqRef.current += 1;
      setLine({ id: seqRef.current, text });
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = window.setTimeout(() => setLine(null), BUBBLE_MS);
      scheduleIdle();
    },
    [lines, scheduleIdle],
  );

  sayRef.current = say;

  useEffect(() => {
    if (!active) {
      clearTimers();
      setLine(null);
      return;
    }
    say(greet);
    return clearTimers;
  }, [active, clearTimers, greet, say]);

  return { line, say };
}
