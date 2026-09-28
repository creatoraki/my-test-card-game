// 统一光照: 所有材质共享同一份点光 uniforms(由 LightRig 每帧写入)。
// 世界坐标约定 pos = (x, 离地高 h, 纵深 z); 纵深在光照距离里按 Z_SCALE 放大。

export const MAX_LIGHTS = 16;

export const LIGHTING_GLSL = /* glsl */ `
#define MAX_LIGHTS ${MAX_LIGHTS}
uniform vec4 uLightPos[MAX_LIGHTS];
uniform vec4 uLightCol[MAX_LIGHTS];
uniform int uLightCount;
uniform int uStaticCount;
uniform vec3 uAmbient;
uniform vec3 uAmbientTop;
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform float uTime;
uniform float uCamX;

const float Z_SCALE = 1.7;
const vec3 VIEW_DIR = vec3(0.0, 0.28, 0.96);

float lightFalloff(float dist, float radius) {
  float x = dist / radius;
  float win = clamp(1.0 - x * x * x * x, 0.0, 1.0);
  return win * win / (1.0 + 9.0 * x * x);
}

/** 点光漫反射(半包裹)与高光。gloss 0~1。 */
vec3 pointLights(vec3 pos, vec3 n, float gloss, out vec3 spec) {
  vec3 diff = vec3(0.0);
  spec = vec3(0.0);
  float power = mix(6.0, 96.0, gloss);
  for (int i = 0; i < MAX_LIGHTS; i++) {
    if (i >= uLightCount) break;
    vec3 d = uLightPos[i].xyz - pos;
    d.z *= Z_SCALE;
    float dist = length(d) + 1e-3;
    // 超出半径时衰减恒为 0, 直接跳过
    if (dist >= uLightPos[i].w) continue;
    vec3 L = d / dist;
    float att = lightFalloff(dist, uLightPos[i].w);
    float ndl = dot(n, L);
    float wrap = max((ndl + 0.3) / 1.3, 0.0);
    vec3 c = uLightCol[i].rgb * att;
    diff += c * wrap;
    vec3 H = normalize(L + VIEW_DIR);
    spec += c * pow(max(dot(n, H), 0.0), power) * gloss * max(ndl, 0.0) * 1.6;
  }
  return diff;
}

/** 完整着色: 半球环境光 × AO + 点光 + 高光。 */
vec3 shade(vec3 albedo, vec3 pos, vec3 n, float gloss, float ao) {
  vec3 spec;
  vec3 diff = pointLights(pos, n, gloss, spec);
  vec3 amb = mix(uAmbient, uAmbientTop, clamp(n.y * 0.5 + 0.5, 0.0, 1.0));
  return albedo * (amb * ao + diff * mix(0.55, 1.0, ao)) + spec * ao;
}

/**
 * 湿地面的灯光倒影: 每盏灯在它前方的地面拉出一条竖向光带,
 * wet 为积水 / 光面程度, ripple 为水面扰动(px)。
 */
vec3 floorReflect(vec3 pos, float wet, float ripple) {
  vec3 sum = vec3(0.0);
  for (int i = 0; i < MAX_LIGHTS; i++) {
    if (i >= uLightCount) break;
    vec3 lp = uLightPos[i].xyz;
    float along = pos.z - lp.z;
    if (along < 0.0) continue;
    float dx = pos.x + ripple - lp.x;
    float w = 16.0 + lp.y * 0.05 + along * 0.18;
    if (abs(dx) > w * 3.0) continue;
    float peak = lp.y * 0.42;
    float body = exp(-abs(along - peak) / (lp.y * 0.55 + 40.0));
    float streak = exp(-dx * dx / (w * w)) * body * smoothstep(0.0, 30.0, along);
    sum += uLightCol[i].rgb * streak * min(1.0, uLightPos[i].w / 700.0);
  }
  return sum * wet * 0.55;
}

/** 精灵边缘光: edgeN 为屏幕平面内的外法线(x, h), 朝向灯的一侧被点亮。 */
vec3 spriteRim(vec3 pos, vec2 edgeN) {
  vec3 rim = vec3(0.0);
  for (int i = 0; i < MAX_LIGHTS; i++) {
    if (i >= uLightCount) break;
    vec3 d = uLightPos[i].xyz - pos;
    d.z *= Z_SCALE;
    float dist = length(d);
    if (dist >= uLightPos[i].w * 1.15) continue;
    float att = lightFalloff(dist, uLightPos[i].w * 1.15);
    vec2 L2 = normalize(d.xy + 1e-3);
    rim += uLightCol[i].rgb * att * max(dot(edgeN, L2), 0.0);
  }
  return rim;
}

/** 贴地雾: 越靠近地面、越靠前越浓(用于物体与角色的底部融合)。 */
vec3 lowFog(vec3 col, float h, float z) {
  float f = exp(-max(h, 0.0) / 90.0) * uFogDensity * (0.25 + z / 1200.0);
  return mix(col, uFogColor, clamp(f, 0.0, 0.5));
}

/** 此处受到的点光总亮度(用于光点、粒子按环境明暗自动调亮)。 */
float lightLevel(vec3 pos) {
  float s = 0.0;
  for (int i = 0; i < MAX_LIGHTS; i++) {
    if (i >= uLightCount) break;
    vec3 d = uLightPos[i].xyz - pos;
    d.z *= Z_SCALE;
    float dist = length(d);
    if (dist >= uLightPos[i].w) continue;
    s += luma(uLightCol[i].rgb) * lightFalloff(dist, uLightPos[i].w);
  }
  return s;
}
`;
