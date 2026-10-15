// 据点建筑的解锁演出排程 —— 条件刚满足的楼, 回到全景时逐栋播一次「开锁」。
//
// ★ 一批一起排: 本批全部播完才统一写存档(markBuildingRevealed)。中途写会让 pendingReveal
//   变化 → effect 重跑 → 同批其他楼的计时被清掉重来。
// ★ 全景不可见(进设施 / 换场演出中)时整批取消, 下次回到全景重新播 —— 存档没写, 不会漏播。
// ★ 时长与锁头着色器的开锁时间轴(ui/art/lock/padlockUnlock.glsl.ts)对齐。

import { useEffect, useState } from "react";
import { useTownStore } from "@/store/town/townStore";
import type { BuildingId } from "./stationBuildings";

export const BUILDING_REVEAL = {
  /** 回到全景后先停一拍, 让玩家看清还锁着的样子。 */
  startDelay: 800,
  /** 同批多栋楼依次开锁的间隔。 */
  stagger: 600,
  /** 单栋楼的开锁演出时长(锁头碎散 + 蒙版褪去)。 */
  duration: 1500,
} as const;

export interface BuildingRevealState {
  /** 正在播开锁演出的楼。 */
  unlocking: ReadonlySet<BuildingId>;
  /** 本批已播完、等整批结束才写存档的楼: 视同已开放。 */
  opened: ReadonlySet<BuildingId>;
}

const NONE: ReadonlySet<BuildingId> = new Set();
const IDLE: BuildingRevealState = { unlocking: NONE, opened: NONE };

const withId = (set: ReadonlySet<BuildingId>, id: BuildingId) => new Set(set).add(id);
const withoutId = (set: ReadonlySet<BuildingId>, id: BuildingId) => {
  const next = new Set(set);
  next.delete(id);
  return next;
};

/** pending = 待播的楼(useBuildingLocks().pendingReveal); ready = 全景可见且可交互。 */
export function useBuildingReveal(pending: readonly BuildingId[], ready: boolean): BuildingRevealState {
  const markRevealed = useTownStore((state) => state.markBuildingRevealed);
  const [state, setState] = useState<BuildingRevealState>(IDLE);
  const batchKey = pending.join(",");

  useEffect(() => {
    if (!ready || !batchKey) return;
    const ids = batchKey.split(",") as BuildingId[];
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));
    ids.forEach((id, index) => {
      const at = BUILDING_REVEAL.startDelay + index * BUILDING_REVEAL.stagger;
      later(() => setState((prev) => ({ ...prev, unlocking: withId(prev.unlocking, id) })), at);
      later(
        () => setState((prev) => ({ unlocking: withoutId(prev.unlocking, id), opened: withId(prev.opened, id) })),
        at + BUILDING_REVEAL.duration,
      );
    });
    const end = BUILDING_REVEAL.startDelay + (ids.length - 1) * BUILDING_REVEAL.stagger + BUILDING_REVEAL.duration;
    later(() => {
      ids.forEach(markRevealed);
      setState(IDLE);
    }, end + 50);
    return () => {
      timers.forEach(window.clearTimeout);
      setState(IDLE);
    };
  }, [ready, batchKey, markRevealed]);

  return state;
}
