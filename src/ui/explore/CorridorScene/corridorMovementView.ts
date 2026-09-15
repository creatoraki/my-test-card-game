import { bossGateNear, nearbyObjects, portalAt } from "@/explore/corridor/session";
import type { CorridorState } from "@/explore/corridor/types";
import type { PortalDir } from "@/explore/dungeon/types";

export interface CorridorMovementView {
  x: number;
  facing: -1 | 1;
  walking: boolean;
  nearbyKey: string;
  portalDir: PortalDir | null;
  nearGate: boolean;
}

interface CorridorPosition {
  x: number;
  facing: -1 | 1;
  walking: boolean;
}

/** 只提取会影响场景 React 视图的离散信息。 */
export function deriveCorridorMovementView(
  corridor: CorridorState,
  position: CorridorPosition,
  blocked: boolean,
): CorridorMovementView {
  const nearbyKey = nearbyObjects(corridor, position.x).map((object) => object.id).join("|");
  const portalDir = blocked ? null : portalAt(corridor, position.x)?.dir ?? null;
  const nearGate = !blocked && bossGateNear(corridor, position.x);
  return { ...position, nearbyKey, portalDir, nearGate };
}

/** 位置连续变化时不提交 React；只有离散视图变化才需要一次提交。 */
export function hasCorridorMovementViewChanged(
  previous: CorridorMovementView,
  next: CorridorMovementView,
): boolean {
  return previous.facing !== next.facing
    || previous.walking !== next.walking
    || previous.nearbyKey !== next.nearbyKey
    || previous.portalDir !== next.portalDir
    || previous.nearGate !== next.nearGate;
}
