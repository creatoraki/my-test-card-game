import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from "react";

/** 关闭器：有面板开着就启动关闭动画并返回需要等待的毫秒数；没有则返回 0。 */
export type FacilityPanelCloser = () => number;

type FacilityExitRegister = (closer: FacilityPanelCloser) => () => void;

export const FacilityExitContext = createContext<FacilityExitRegister | null>(null);

/** 设施侧接入退出登记处；闭包更新不会导致重复注册。 */
export function useFacilityPanelExit(closer: FacilityPanelCloser) {
  const register = useContext(FacilityExitContext);
  const latestCloser = useRef(closer);
  latestCloser.current = closer;

  useEffect(() => {
    if (!register) return;
    return register(() => latestCloser.current());
  }, [register]);
}

/** 据点侧的关闭器集合。返回所有设施中最长的关闭动画时长。 */
export function useFacilityExitRegistry() {
  const closers = useRef(new Set<FacilityPanelCloser>());

  const register = useCallback<FacilityExitRegister>((closer) => {
    closers.current.add(closer);
    return () => {
      closers.current.delete(closer);
    };
  }, []);

  const closeOpenPanels = useCallback(() => {
    let wait = 0;
    closers.current.forEach((closer) => {
      wait = Math.max(wait, closer());
    });
    return wait;
  }, []);

  return { register, closeOpenPanels };
}

interface FacilityExitProviderProps {
  register: FacilityExitRegister;
  children: ReactNode;
}

export function FacilityExitProvider({ register, children }: FacilityExitProviderProps) {
  return <FacilityExitContext.Provider value={register}>{children}</FacilityExitContext.Provider>;
}
