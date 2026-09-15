import { useExploreStore } from "./exploreStore";
import { challengeBoss, engageRoomThreat } from "../explore/session";
import {
  canWalkCorridor, clampCorridorX,
  closeBossGate, dismissCorridorObject, openBossGate, openCorridorObject,
} from "../explore/corridor/session";
import { rollCorridorAmbush } from "../explore/corridor/ambush";
import { standOnPortal, travelPortal } from "../explore/dungeon/session";
import type { PortalDir } from "../explore/dungeon/types";
import type { ExploreState } from "../explore/types";

function mutateCorridor(action: (session: ExploreState) => boolean): boolean {
  const current = useExploreStore.getState().session;
  if (!current?.corridor) return false;
  const draft = structuredClone(current);
  if (!action(draft)) return false;
  useExploreStore.setState({ session: draft });
  return true;
}

/** 行走逐帧留在场景内，只在停步、失焦和交互前提交，避免整套背包逐帧渲染。 */
export function saveCorridorPosition(x: number, facing: -1 | 1, roomId: string): void {
  const session = useExploreStore.getState().session;
  if (!session?.corridor || session.corridor.roomId !== roomId) return;
  if (!canWalkCorridor(session) || !Number.isFinite(x)) return;
  const playerX = clampCorridorX(session.corridor, x);
  if (session.corridor.playerX === playerX && session.corridor.facing === facing) return;
  useExploreStore.setState({ session: {
    ...session,
    corridor: { ...session.corridor, playerX, facing },
  } });
}

/** 站上/离开传送门：点亮目标房间在小地图上的位置，不消耗资源，故可以逐次提交。 */
export function markStandingPortal(x: number): boolean {
  return mutateCorridor((s) => standOnPortal(s, x));
}

/** 每累计一段行走时间检查一次暗雷；未命中也必须提交 RNG 的推进。 */
export function checkCorridorAmbush(x: number, facing: -1 | 1): boolean {
  const current = useExploreStore.getState().session;
  if (!current?.corridor) return false;
  const draft = structuredClone(current);
  const result = rollCorridorAmbush(draft, x, facing);
  if (result === "skip") return false;
  useExploreStore.setState({ session: draft });
  return result === "hit";
}

/** 确认传送：扣 5 点净化粒子并换房间。 */
export function travelThroughPortal(dir: PortalDir): boolean {
  return mutateCorridor((s) => travelPortal(s, dir));
}

export const inspectCorridorObject = (id: string) => mutateCorridor((s) => openCorridorObject(s, id));
export const closeCorridorObject = () => mutateCorridor(dismissCorridorObject);
export const openBossGateAt = () => mutateCorridor(openBossGate);
export const closeBossGatePanel = () => mutateCorridor(closeBossGate);
export const challengeBossGate = () => mutateCorridor(challengeBoss);

/** 演出完成后才建立遭遇战。与开始动画分开，StrictMode 或重复回调不会重复建局。 */
export function finishCorridorEncounter(): boolean {
  return mutateCorridor(engageRoomThreat);
}
