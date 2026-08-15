import { useEffect, useRef, useState } from "react";

export interface RevealPresenceState<T> {
  mounted: boolean;
  closing: boolean;
  data: T;
}

export function useRevealPresence<T>(open: boolean, data: T, closeMs: number): RevealPresenceState<T> {
  const dataRef = useRef(data);
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);

  if (open) dataRef.current = data;

  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
      return;
    }

    if (!mounted) return;
    if (closeMs === 0) {
      setMounted(false);
      setClosing(false);
      return;
    }

    setClosing(true);
    const timer = window.setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, closeMs);
    return () => window.clearTimeout(timer);
  }, [closeMs, mounted, open]);

  return { mounted, closing, data: dataRef.current };
}