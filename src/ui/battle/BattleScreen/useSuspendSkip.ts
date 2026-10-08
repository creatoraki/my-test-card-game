// 倒吊人·悬停: 悬置选择期间, 右键或 Esc 跳过(与无明选牌的取消手势一致)。

import { useEffect } from "react";
import type { BattleState } from "@/engine";

export function useSuspendSkip(battle: BattleState | null, animating: boolean, skip: () => void): void {
  const active = battle?.pendingChoice?.kind === "pickHandCard" &&
    battle.pendingChoice.action === "bondSuspend" && !animating;

  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") skip();
    };
    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault();
      skip();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("contextmenu", onContextMenu);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("contextmenu", onContextMenu);
    };
  }, [active, skip]);
}
