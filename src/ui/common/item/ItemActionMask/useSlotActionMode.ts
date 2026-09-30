// 物品格「交互模式」的开关: 同一时间最多一格处于交互模式。
//
// 点格子 → open(uid); 鼠标移出该格包裹层 → closeIf(uid); 物品从列表里消失或按 Esc → 清空。
// 详情浮层模式(操作区长在格子上方的详情浮层里, 见 ItemTooltipActions)下, 鼠标要能从格子移到浮层上 ——
//   移出时改走 closeSoon(uid) 延迟关闭, 进入格子或浮层时 keepOpen() 取消这次关闭。

import { useCallback, useEffect, useRef, useState } from "react";

/** 从格子移到上方详情浮层的宽限时间。 */
const CLOSE_GRACE_MS = 160;

export function useSlotActionMode(uids: readonly string[]) {
  const [activeUid, setActiveUid] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  const keepOpen = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => keepOpen, [keepOpen]);

  useEffect(() => {
    if (activeUid && !uids.includes(activeUid)) setActiveUid(null);
  }, [activeUid, uids]);

  useEffect(() => {
    if (!activeUid) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveUid(null);
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [activeUid]);

  const open = useCallback((uid: string) => {
    keepOpen();
    setActiveUid(uid);
  }, [keepOpen]);
  const close = useCallback(() => {
    keepOpen();
    setActiveUid(null);
  }, [keepOpen]);
  const closeIf = useCallback(
    (uid: string) => setActiveUid((current) => (current === uid ? null : current)),
    [],
  );
  const closeSoon = useCallback((uid: string) => {
    keepOpen();
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setActiveUid((current) => (current === uid ? null : current));
    }, CLOSE_GRACE_MS);
  }, [keepOpen]);

  return { activeUid, open, close, closeIf, closeSoon, keepOpen };
}

export type SlotActionMode = ReturnType<typeof useSlotActionMode>;
