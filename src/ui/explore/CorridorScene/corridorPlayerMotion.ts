// 站立只显示单张正面站姿，不播放呼吸动画。
export const CORRIDOR_PLAYER_STAND_FRAME = 0;
// 帧 1～12 为一个完整步态循环（左右各迈一步），逐帧播放后回到帧 1。
export const CORRIDOR_PLAYER_WALK_START_FRAME = 1;
export const CORRIDOR_PLAYER_WALK_LAST_FRAME = 12;
export const CORRIDOR_PLAYER_WALK_FRAME_STEP = 1;
// 每帧 100ms，一轮步态 1.2 秒，与素材截取时的原始节奏一致。
export const CORRIDOR_PLAYER_MOTION_FPS = 10;

export interface CorridorPlayerFrameOffset {
  x: number;
  y: number;
}

// 素材校准（画布 px）：行走帧重心偏左、站姿重心偏右且脚底离底边 4px，
// 绘制时统一移到画布中线并贴底，停步、起步与转身都不会横跳。
export const CORRIDOR_PLAYER_STAND_OFFSET: CorridorPlayerFrameOffset = { x: -20, y: 4 };
export const CORRIDOR_PLAYER_WALK_OFFSET: CorridorPlayerFrameOffset = { x: 15, y: 0 };

export function getCorridorPlayerFrameOffset(frame: number): CorridorPlayerFrameOffset {
  return frame === CORRIDOR_PLAYER_STAND_FRAME ? CORRIDOR_PLAYER_STAND_OFFSET : CORRIDOR_PLAYER_WALK_OFFSET;
}
