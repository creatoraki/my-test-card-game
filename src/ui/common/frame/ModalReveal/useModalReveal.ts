import { useCallback, useEffect, useRef, useState } from "react";
import { modalRevealCloseMs } from "./modalRevealChoreo";

export interface ModalRevealState {
  closing: boolean;
  requestClose: () => void;
}

export function useModalReveal(onClose: () => void, blocked = false): ModalRevealState {
  const [closing, setClosing] = useState(false);
  const timerRef = useRef<number | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    return () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const requestClose = useCallback(() => {
    if (blocked || closing || timerRef.current != null) return;
    setClosing(true);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      onCloseRef.current();
    }, modalRevealCloseMs());
  }, [blocked, closing]);

  return { closing, requestClose };
}
