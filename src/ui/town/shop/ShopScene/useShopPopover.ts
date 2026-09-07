import { useCallback, useEffect, useRef, useState } from "react";
import { SCIFI_POP_OUT_MS } from "@/ui/common/SciFiPanelShell";

export function useShopPopover() {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const timerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const openPanels = useCallback(() => {
    clearTimer();
    setMounted(true);
    setClosing(false);
    setOpen(true);
  }, [clearTimer]);

  const closePanels = useCallback(() => {
    clearTimer();
    setOpen(false);
    setClosing(true);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setMounted(false);
      setClosing(false);
    }, SCIFI_POP_OUT_MS);
  }, [clearTimer]);

  useEffect(() => {
    if (!mounted) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePanels();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closePanels, mounted]);

  useEffect(() => clearTimer, [clearTimer]);

  return { open, closing, mounted, openPanels, closePanels };
}
