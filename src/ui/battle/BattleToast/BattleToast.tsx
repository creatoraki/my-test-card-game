import { useEffect } from "react";
import { clearBattleToast, useBattleToast } from "@/ui/battle/battleToastStore";
import s from "./BattleToast.module.css";

export function BattleToast() {
  const { text, seq } = useBattleToast();

  useEffect(() => {
    if (!text) return;
    const timer = window.setTimeout(clearBattleToast, 1600);
    return () => window.clearTimeout(timer);
  }, [seq, text]);

  if (!text) return null;

  return (
    <div className={s.toast} key={seq} role="status" aria-live="polite">
      {text}
    </div>
  );
}