import { useEffect, useRef, useState } from "react";
import { panelRevealCloseMs } from "@/ui/explore/styles/panelReveal";

/** 完整播放共享收拢动画后再通知父组件，避免父组件立即卸载浮层。 */
export function useMessengerDismiss() {
  const [closing, setClosing] = useState(false);
  const pending = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  function dismiss(afterClose: () => void) {
    if (pending.current) return;
    pending.current = true;
    setClosing(true);
    timer.current = setTimeout(afterClose, panelRevealCloseMs());
  }
  return { closing, dismiss };
}
