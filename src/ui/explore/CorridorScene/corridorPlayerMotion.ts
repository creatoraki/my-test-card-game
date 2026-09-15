// 站立只显示单张正面站姿，不播放呼吸动画。
export const CORRIDOR_PLAYER_STAND_FRAME = 0;
export const CORRIDOR_PLAYER_WALK_START_FRAME = 30;
// 原始步态为 30～61；隔帧播放 30、32……60，避开后续回身帧。
export const CORRIDOR_PLAYER_WALK_LAST_FRAME = 60;
export const CORRIDOR_PLAYER_WALK_FRAME_STEP = 2;
// 翻页频率减半、每次跨两帧，保持完整步态循环时长不变。
export const CORRIDOR_PLAYER_MOTION_FPS = 15;
