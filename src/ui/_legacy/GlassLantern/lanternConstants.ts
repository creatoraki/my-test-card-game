// 保持 160px 容器不变，通过缩小正交相机视野放大内部灯笼约 3 倍。
export const VIEW_SIZE = 1.85;
export const CAMERA_POS = { x: 5, y: 5.5, z: 5 } as const;
export const LOOK_AT = { x: 0, y: 0.8, z: 0 } as const;
export const GROUP_BASE_Y = 0.2;

export const INNER_COUNT = 280;
export const OUTER_COUNT = 150;

// 与原版 HTML 保持一致：strength = 0.9 + intensity * 0.35，radius 0.8，threshold 0.1。
export const BLOOM = {
  threshold: 0.1,
  radius: 0.8, // 原版值；此前的 1.2 会把灯色大范围糊到金属外壳上
  strengthBase: 0.9,
  strengthGain: 0.35,
  // 216px 画布下最宽的两级 mip 会退化成全帧平均，避免灯色无视深度染到金属外壳。
  mipTint: [1, 1, 1, 0.45, 0.2],
} as const;

// 泛光转 alpha 的合成参数：gain 控制光晕浓度，cutoff 压掉大范围低强度的雾状染色。
export const GLOW_ALPHA = {
  gain: 1.2,
  cutoff: 0.25, // 泛光回归原版后强度约 +45%，抬高门槛压掉外扩的雾状染色
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
// 注意：r128 的缩放对**所有**灯型（ambient / directional / point / spot / hemi）一律生效，
// 因此新增任何灯光时都必须乘上本系数；在保留相对照明平衡的前提下整体压低 30%。
export const LIGHT_SCALE = Math.PI * 0.7;
