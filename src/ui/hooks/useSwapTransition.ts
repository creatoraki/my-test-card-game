import { useEffect, useRef, useState } from "react";

export type SwapPhase = "idle" | "leaving" | "entering";

interface SwapState<T> {
  token: string;
  value: T;
  phase: SwapPhase;
}

/**
 * 按 token 驱动「旧值退场 → 替换为最新值 → 新值入场」。
 * token 是唯一换场信号，value 变化本身不会触发动画；idle 时透传最新 value，
 * leaving / entering 时冻结快照。换场期间更新的 value 会在退场结束时读取。
 */
export function useSwapTransition<T>(
  value: T,
  token: string,
  leaveMs: number,
  enterMs: number,
): { value: T; phase: SwapPhase } {
  const latestValueRef = useRef(value);
  latestValueRef.current = value;

  const timingsRef = useRef({ leaveMs, enterMs });
  timingsRef.current = { leaveMs, enterMs };

  const [state, setState] = useState<SwapState<T>>(() => ({ token, value, phase: "idle" }));
  const handledTokenRef = useRef(token);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const clearTimers = () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };

    if (handledTokenRef.current === token) return clearTimers;
    handledTokenRef.current = token;
    clearTimers();

    const { leaveMs: currentLeaveMs, enterMs: currentEnterMs } = timingsRef.current;
    setState((current) => ({ token, value: current.value, phase: "leaving" }));

    const forgetTimer = (timer: ReturnType<typeof setTimeout>) => {
      timersRef.current = timersRef.current.filter((active) => active !== timer);
    };

    const leaveTimer = setTimeout(() => {
      forgetTimer(leaveTimer);
      if (handledTokenRef.current !== token) return;

      const latestValue = latestValueRef.current;
      setState((current) => current.token === token
        ? { token, value: latestValue, phase: "entering" }
        : current);

      const enterTimer = setTimeout(() => {
        forgetTimer(enterTimer);
        if (handledTokenRef.current !== token) return;
        setState((current) => current.token === token ? { ...current, phase: "idle" } : current);
      }, currentEnterMs);
      timersRef.current.push(enterTimer);
    }, currentLeaveMs);
    timersRef.current.push(leaveTimer);

    return clearTimers;
  }, [token]);

  if (state.token !== token) return { value: state.value, phase: "leaving" };
  if (state.phase === "idle") return { value, phase: "idle" };
  return { value: state.value, phase: state.phase };
}
