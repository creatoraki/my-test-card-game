import {
  CORRIDOR_PLAYER_STAND_FRAME as STAND,
  CORRIDOR_PLAYER_WALK_FRAME_STEP as WALK_STEP,
  CORRIDOR_PLAYER_WALK_LAST_FRAME as WALK_LAST,
  CORRIDOR_PLAYER_WALK_START_FRAME as WALK_FIRST,
} from "../corridorPlayerMotion";

export interface PlayerAnimationState {
  frame: number;
  elapsed: number;
}

export function createPlayerAnimation(): PlayerAnimationState {
  return { frame: STAND, elapsed: 0 };
}

/** 停止时立即回到站姿；开始移动时直接切入迈步帧。 */
export function advancePlayerAnimation(state: PlayerAnimationState, walking: boolean): void {
  if (!walking) {
    state.frame = STAND;
  } else if (state.frame === STAND) {
    state.frame = WALK_FIRST;
  } else {
    state.frame = state.frame + WALK_STEP <= WALK_LAST ? state.frame + WALK_STEP : WALK_FIRST;
  }
}
