// 保持 160px 容器不变，通过缩小正交相机视野放大内部灯笼约 3 倍。
export const VIEW_SIZE = 1.85;
export const CAMERA_POS = { x: 5, y: 5.5, z: 5 } as const;
export const LOOK_AT = { x: 0, y: 0.8, z: 0 } as const;
export const GROUP_BASE_Y = 0.2;

export const INNER_COUNT = 280;
export const OUTER_COUNT = 150;

export const BLOOM = {
  threshold: 0.1,
  radius: 1.2,
  strengthBase: 0.3,
  strengthGain: 0.4,
} as const;

// 泛光转 alpha 的合成参数：gain 控制光晕浓度，cutoff 压掉大范围低强度的雾状染色。
export const GLOW_ALPHA = {
  gain: 1.2,
  cutoff: 0.12,
  max: 0.85,
} as const;

export const MATERIAL_HEX = {
  bright: 0xc0b0a0,
  dark: 0x4a3a2a,
  ring: 0xb89a7a,
  handle: 0x8b6b4d,
  joint: 0x5a4a3a,
  glass: 0xe0f0ff,
} as const;

// r128 的 legacy lights 会额外应用约 pi 的光照缩放；r185 已移除 useLegacyLights。
export const LIGHT_SCALE = Math.PI;
