// 原地二次确认：第一次点击进入待确认态，限时内再次点击才真正执行；超时、禁用或 resetKey 变化时自动解除。

import { useCallback, useEffect, useRef, useState } from "react";

export const CONFIRM_WINDOW_MS = 3000;

export function useArmedConfirm(onConfirm: () => void, enabled: boolean, disabled: boolean, resetKey: string) {
  const [armed, setArmed] = useState(false);
  // 每次进入待确认都换一个序号，让倒计时条动画从头播放。
  const [armId, setArmId] = useState(0);
  const timer = useRef<number | null>(null);

  const disarm = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    setArmed(false);
  }, []);

  useEffect(() => disarm, [disarm]);
  useEffect(() => {
    disarm();
  }, [disabled, resetKey, disarm]);

  const trigger = () => {
    if (disabled) return;
    if (!enabled || armed) {
      disarm();
      onConfirm();
      return;
    }
    setArmed(true);
    setArmId((id) => id + 1);
    timer.current = window.setTimeout(disarm, CONFIRM_WINDOW_MS);
  };

  return { armed, armId, trigger, disarm };
}
