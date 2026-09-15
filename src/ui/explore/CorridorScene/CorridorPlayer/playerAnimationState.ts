import {
  CORRIDOR_PLAYER_IDLE_FIRST_FRAME as IDLE_FIRST,
  CORRIDOR_PLAYER_IDLE_LAST_FRAME as IDLE_LAST,
  CORRIDOR_PLAYER_REST_FIRST_FRAME as REST_FIRST,
  CORRIDOR_PLAYER_REST_LAST_FRAME as REST_LAST,
  CORRIDOR_PLAYER_WALK_FRAME_STEP as WALK_STEP,
  CORRIDOR_PLAYER_WALK_LAST_FRAME as WALK_LAST,
  CORRIDOR_PLAYER_WALK_START_FRAME as WALK_FIRST,
} from "../corridorPlayerMotion";

type Phase = "standing" | "walking";
export interface PlayerAnimationState {
  phase: Phase;
  frame: number;
  elapsed: number;
  rested: boolean;
  idleDirection: -1 | 1;
  idleHold: number;
}

export function createPlayerAnimation(): PlayerAnimationState {
  return { phase: "standing", frame: IDLE_FIRST, elapsed: 0, rested: false, idleDirection: 1, idleHold: 60 };
}

/** 停止时立即回到站姿；开始移动时直接切入迈步帧。 */
export function advancePlayerAnimation(state: PlayerAnimationState, walking: boolean): void {
  if (!walking && state.phase === "walking") {
    state.phase = "standing";
    state.frame = REST_FIRST;
    state.rested = true;
    state.idleDirection = 1;
    state.idleHold = 60;
  } else if (walking && state.phase === "standing") {
    state.phase = "walking";
    state.frame = WALK_FIRST;
    return;
  }

  switch (state.phase) {
    case "standing": {
      const first = state.rested ? REST_FIRST : IDLE_FIRST;
      const last = state.rested ? REST_LAST : IDLE_LAST;
      if (state.idleHold > 0) {
        state.idleHold -= 1;
        break;
      }
      state.frame += state.idleDirection;
      if (state.frame >= last) {
        state.frame = last;
        state.idleDirection = -1;
      } else if (state.frame <= first) {
        state.frame = first;
        state.idleDirection = 1;
        state.idleHold = 90;
      }
      break;
    }
    case "walking":
      state.frame = state.frame + WALK_STEP <= WALK_LAST ? state.frame + WALK_STEP : WALK_FIRST;
      break;
  }
}
