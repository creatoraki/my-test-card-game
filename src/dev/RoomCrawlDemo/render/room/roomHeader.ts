import { FLOOR_DEPTH, WALL_BASE_WY } from "../../data/layout";

/**
 * 房间级着色器公共头: 房间 uniforms 与表面结构 Surf。
 * 区域(zones/)的后墙、地面函数都返回 Surf, 由通用着色器统一打光。
 */
export const ROOM_HEADER = /* glsl */ `
#define WALL_BASE ${WALL_BASE_WY.toFixed(1)}
#define FLOOR_DEPTH ${FLOOR_DEPTH.toFixed(1)}
uniform float uWidth;
uniform float uSeed;
/** 上门 / 下门门洞中心 x, 没有时为 -1。 */
uniform float uUpDoorX;
uniform float uDownDoorX;
/** 房间门是否被守卫封锁(0 / 1, 带过渡)。 */
uniform float uLocked;

struct Surf {
  vec3 albedo;
  /** 高度(px), 由屏幕导数求法线, 做倒角、凹凸。 */
  float height;
  float gloss;
  vec3 emit;
  /** 0 = 开口(透出背景层)。 */
  float alpha;
  /** 积水 / 光面程度, 仅地面使用。 */
  float wet;
  float ao;
  /** 四个动画发光遮罩(0~1): 烘焙时写入, 每帧由 zoneWallLive / zoneFloorLive 按时间调制成发光。 */
  vec4 anim;
};

Surf surfOf(vec3 albedo) {
  Surf s;
  s.albedo = albedo;
  s.height = 0.0;
  s.gloss = 0.08;
  s.emit = vec3(0.0);
  s.alpha = 1.0;
  s.wet = 0.0;
  s.ao = 1.0;
  s.anim = vec4(0.0);
  return s;
}

/** 在已有表面上叠一个形体: mask 为覆盖度, 其余属性按覆盖度混合。 */
void layerSurf(inout Surf s, float mask, vec3 albedo, float height, float gloss) {
  s.albedo = mix(s.albedo, albedo, mask);
  s.height = mix(s.height, height, mask);
  s.gloss = mix(s.gloss, gloss, mask);
}

/** 按房间种子与分段序号取稳定随机数。 */
float roomRand(float segment, float salt) {
  return hash12(vec2(segment * 1.37 + salt, uSeed + salt * 0.71));
}
`;
