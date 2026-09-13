import { useExploreStore } from "./exploreStore";
import { chooseOption, engageRoundBattle, leaveRegion } from "../explore/session";
import {
  beginCorridorEncounter, canWalkCorridor, clampCorridorX,
  dismissCorridorObject, openCorridorObject,
} from "../explore/corridor/session";
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
export function saveCorridorPosition(x: number, facing: -1 | 1, round: number): void {
  const session = useExploreStore.getState().session;
  if (!session?.corridor || session.round !== round || !canWalkCorridor(session) || !Number.isFinite(x)) return;
  const playerX = clampCorridorX(session.corridor, x);
  if (session.corridor.playerX === playerX && session.corridor.facing === facing) return;
  useExploreStore.setState({ session: {
    ...session,
    corridor: { ...session.corridor, playerX, facing, exploredX: Math.max(session.corridor.exploredX, playerX) },
  } });
}

export const inspectCorridorObject = (id: string) => mutateCorridor((s) => openCorridorObject(s, id));
export const closeCorridorObject = () => mutateCorridor(dismissCorridorObject);
export const encounterCorridorThreat = (id: string) => mutateCorridor((s) => beginCorridorEncounter(s, id));

/** 演出完成后才建立遭遇战。与开始动画分开，StrictMode 或重复回调不会重复建局。 */
export function finishCorridorEncounter(): boolean {
  return mutateCorridor((s) => {
    if (s.phase !== "encounter" || !s.corridor?.encounterId) return false;
    const threat = s.corridor.threats.find((candidate) => candidate.id === s.corridor?.encounterId);
    if (!threat) return false;
    if (threat.final) {
      s.phase = "atNode";
      s.entryLane = null;
      return leaveRegion(s) && engageRoundBattle(s);
    }
    s.currentLane = 0;
    s.currentSegment = threat.nodeIndex + 1;
    s.pendingNotes = [];
    s.pendingStory = [];
    s.phase = "landed";
    return chooseOption(s, 0);
  });
}
