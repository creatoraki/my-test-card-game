// 物品格「交互模式」的开关: 同一时间最多一格处于交互模式。
//
// 点格子 → open(uid); 鼠标移出该格包裹层 → closeIf(uid); 物品从列表里消失或按 Esc → 清空。

import { useCallback, useEffect, useState } from "react";

export function useSlotActionMode(uids: readonly string[]) {
  const [activeUid, setActiveUid] = useState<string | null>(null);

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

  const open = useCallback((uid: string) => setActiveUid(uid), []);
  const close = useCallback(() => setActiveUid(null), []);
  const closeIf = useCallback(
    (uid: string) => setActiveUid((current) => (current === uid ? null : current)),
    [],
  );

  return { activeUid, open, close, closeIf };
}

export type SlotActionMode = ReturnType<typeof useSlotActionMode>;
