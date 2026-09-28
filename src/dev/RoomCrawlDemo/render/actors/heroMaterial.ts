import * as THREE from "three";
import { FRAG_PRELUDE } from "../glsl/prelude";
import type { RigUniforms } from "../lighting/lightRig";
import { ROOM_HEADER } from "../room/roomHeader";
import { EYE, FRAME_H, FRAME_W, SEAM } from "./heroCalibration";
import { BONE_COUNT, type HeroRig } from "./heroRig";

const DEFINES = `
#define BONES ${BONE_COUNT}
#define FRAME_W ${FRAME_W.toFixed(1)}
#define FRAME_H ${FRAME_H.toFixed(1)}
`;

/** 2D 骨骼蒙皮; SHADOW 版本在蒙皮后把网格按主光方向错切压扁到地面。 */
const HERO_VERT = DEFINES + /* glsl */ `
uniform mat3 uBones[BONES];
uniform vec2 uShear;
attribute vec4 aBones;
attribute vec4 aWeights;
attribute float aKeep;
attribute vec3 aDebug;
varying vec2 vUv;
varying vec2 vWorld;
varying vec2 vRig;
varying float vKeep;
varying vec3 vDebug;
void main() {
  vec3 rest = vec3(position.xy, 1.0);
  vec2 p = vec2(0.0);
  for (int k = 0; k < 4; k++) {
    int b = int(aBones[k] + 0.5);
    p += aWeights[k] * (uBones[b] * rest).xy;
  }
  vRig = p;
#ifdef SHADOW
  p = vec2(p.x + p.y * uShear.x, p.y * uShear.y);
#endif
  vUv = uv;
  vKeep = aKeep;
  vDebug = aDebug;
  vec4 world = modelMatrix * vec4(p, 0.0, 1.0);
  vWorld = world.xy;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

/** 基准帧(上半身)与步态帧(下半身)的合成采样, 结果为预乘 alpha。 */
const HERO_SAMPLE = DEFINES + /* glsl */ `
uniform sampler2D uBase;
uniform sampler2D uGaitA;
uniform sampler2D uGaitB;
uniform float uGaitMix;
uniform vec2 uSeam;
varying vec2 vUv;
varying vec2 vWorld;
varying vec2 vRig;
varying float vKeep;
varying vec3 vDebug;

vec4 heroTex(vec2 uv) {
  float sy = (1.0 - uv.y) * FRAME_H;
  float leg = smoothstep(uSeam.x, uSeam.y, sy) * (1.0 - vKeep);
  vec4 up = texture2D(uBase, uv);
  if (leg < 0.002) return up;
  vec4 lo = mix(texture2D(uGaitA, uv), texture2D(uGaitB, uv), smoothstep(0.3, 0.7, uGaitMix));
  return mix(up, lo, leg);
}
`;

const HERO_FRAG = /* glsl */ `
uniform vec4 uEye;
uniform vec3 uSkin;
uniform vec3 uLash;
uniform float uBlink;
uniform vec3 uHero;
uniform float uFacing;
uniform float uFlash;
uniform float uDissolve;
uniform float uDebug;
uniform float uOpacity;
uniform vec2 uPivots[BONES];

void main() {
  vec2 texel = vec2(1.0 / FRAME_W, 1.0 / FRAME_H);
  vec4 c = heroTex(vUv);
  float mx = 0.0;
  vec2 g = vec2(0.0);
  for (int i = 0; i < 8; i++) {
    float ang = float(i) * 0.7853982;
    vec2 dir = vec2(cos(ang), sin(ang));
    float s = heroTex(vUv + dir * texel * 1.7).a;
    mx = max(mx, s);
    g -= dir * s;
  }
  float alpha = c.a;
  vec3 albedo = alpha > 0.001 ? c.rgb / alpha : vec3(0.0);

  // 眨眼: 在眼睛区域从上往下画皮肤色眼睑, 下缘是一道睫毛线
  vec2 sp = vec2(vUv.x * FRAME_W, (1.0 - vUv.y) * FRAME_H);
  if (uBlink > 0.01 && sp.x > uEye.x && sp.x < uEye.z && sp.y > uEye.y - 1.5 && sp.y < uEye.w + 1.0) {
    float lid = uEye.y - 1.0 + uBlink * (uEye.w - uEye.y + 2.0);
    float edgeX = smoothstep(uEye.x, uEye.x + 2.0, sp.x) * smoothstep(uEye.z, uEye.z - 2.0, sp.x);
    float cover = smoothstep(lid + 0.5, lid - 0.5, sp.y);
    albedo = mix(albedo, uSkin * (0.9 + 0.1 * (sp.y - uEye.y) / 10.0), cover * edgeX);
    albedo = mix(albedo, uLash, (1.0 - smoothstep(0.4, 1.4, abs(sp.y - lid))) * edgeX * smoothstep(0.1, 0.3, uBlink));
  }

  float heroH = vWorld.y - (WALL_BASE - uHero.z);
  vec3 pos = vec3(vWorld.x, heroH, uHero.z + 8.0);
  vec3 spec;
  vec3 diff = pointLights(pos, normalize(vec3(0.0, 0.2, 1.0)), 0.2, spec);
  vec3 amb = mix(uAmbient, uAmbientTop, 0.6);
  vec3 col = albedo * (amb * 1.45 + diff * 0.85 + vec3(0.03));
  // 边缘光: alpha 梯度即屏幕平面外法线, 朝灯的一侧被勾亮
  vec2 gw = vec2(g.x * uFacing, g.y);
  float edge = clamp(length(g) * 0.45, 0.0, 1.0) * alpha;
  col += spriteRim(pos, normalize(gw + 1e-4)) * edge * (0.5 + albedo);
  col = lowFog(col, heroH, uHero.z);

  float outline = clamp(mx - alpha, 0.0, 1.0) * 0.85;
  vec3 pm = col * alpha + C_OUTLINE * outline;
  float a = alpha + outline * (1.0 - alpha);
  pm = mix(pm, vec3(1.7, 1.6, 1.5) * a, uFlash);

  if (uDissolve > 0.0) {
    float n = fbm(sp * 0.09);
    float th = uDissolve * 1.25 - 0.12;
    float keepD = smoothstep(th, th + 0.05, n);
    float ember = (1.0 - smoothstep(0.0, 0.05, abs(n - th))) * a;
    pm = pm * keepD + vec3(1.0, 0.35, 0.12) * ember * 2.5;
    a = a * keepD + ember * 0.8;
  }

  if (uDebug > 0.5) {
    float grid = step(0.94, fract(sp.x / 7.5)) + step(0.94, fract(sp.y / 7.5));
    vec3 dc = vDebug * (0.8 + 0.2 * grid);
    pm = mix(pm, dc * max(a, 0.3), 0.55);
    a = max(a, 0.22);
    for (int i = 0; i < BONES; i++) {
      float d = length(vRig - uPivots[i]);
      float pin = 1.0 - smoothstep(2.5, 3.5, d);
      float ring = 1.0 - smoothstep(0.6, 1.2, abs(d - 4.5));
      pm = mix(pm, vec3(1.0), pin);
      pm = mix(pm, vec3(0.0), ring);
      a = max(a, max(pin, ring));
    }
    float seamLine = (1.0 - smoothstep(0.3, 0.9, abs(sp.y - uSeam.x))) + (1.0 - smoothstep(0.3, 0.9, abs(sp.y - uSeam.y)));
    pm = mix(pm, vec3(1.0, 1.0, 0.2), seamLine * 0.8);
    a = max(a, seamLine * 0.8);
  }
  gl_FragColor = vec4(pm, a) * uOpacity;
}
`;

const SHADOW_FRAG = /* glsl */ `
uniform float uShadowAlpha;
void main() {
  vec2 texel = vec2(1.0 / FRAME_W, 1.0 / FRAME_H);
  float a = heroTex(vUv).a * 0.36;
  a += heroTex(vUv + vec2(texel.x * 2.5, 0.0)).a * 0.16;
  a += heroTex(vUv - vec2(texel.x * 2.5, 0.0)).a * 0.16;
  a += heroTex(vUv + vec2(0.0, texel.y * 2.5)).a * 0.16;
  a += heroTex(vUv - vec2(0.0, texel.y * 2.5)).a * 0.16;
  float fade = 1.0 - smoothstep(20.0, 250.0, vRig.y);
  float alpha = a * uShadowAlpha * fade;
  gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
}
`;

export interface HeroTextures {
  base: THREE.Texture;
  gaitA: THREE.Texture;
  gaitB: THREE.Texture;
}

export interface HeroMaterials {
  body: THREE.ShaderMaterial;
  shadow: THREE.ShaderMaterial;
  /** 两份材质共享的采样 / 骨骼 uniforms。 */
  shared: {
    uBase: THREE.IUniform<THREE.Texture | null>;
    uGaitA: THREE.IUniform<THREE.Texture | null>;
    uGaitB: THREE.IUniform<THREE.Texture | null>;
    uGaitMix: THREE.IUniform<number>;
  };
}

export function createHeroMaterials(rig: HeroRig, light: RigUniforms): HeroMaterials {
  const shared = {
    uBase: { value: null as THREE.Texture | null },
    uGaitA: { value: null as THREE.Texture | null },
    uGaitB: { value: null as THREE.Texture | null },
    uGaitMix: { value: 0 },
    uSeam: { value: new THREE.Vector2(SEAM[0], SEAM[1]) },
    uShear: { value: new THREE.Vector2(0.3, -0.4) },
    ...rig.uniforms,
  };
  // 投影在顶点着色器里被纵向翻转, 必须双面渲染, 否则会被背面剔除
  const common = {
    side: THREE.DoubleSide,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    premultipliedAlpha: true,
    blending: THREE.NormalBlending,
  };
  const body = new THREE.ShaderMaterial({
    ...common,
    vertexShader: HERO_VERT,
    fragmentShader: FRAG_PRELUDE + ROOM_HEADER + HERO_SAMPLE + HERO_FRAG,
    uniforms: {
      ...light,
      ...shared,
      uWidth: { value: 0 },
      uSeed: { value: 0 },
      uUpDoorX: { value: -1 },
      uDownDoorX: { value: -1 },
      uLocked: { value: 0 },
      uEye: { value: new THREE.Vector4(EYE.x0, EYE.y0, EYE.x1, EYE.y1) },
      uSkin: { value: new THREE.Vector3(...EYE.skin) },
      uLash: { value: new THREE.Vector3(...EYE.lash) },
      uBlink: { value: 0 },
      uHero: { value: new THREE.Vector3() },
      uFacing: { value: 1 },
      uFlash: { value: 0 },
      uDissolve: { value: 0 },
      uDebug: { value: 0 },
      uOpacity: { value: 1 },
    },
  });
  const shadow = new THREE.ShaderMaterial({
    ...common,
    defines: { SHADOW: "" },
    vertexShader: HERO_VERT,
    fragmentShader: HERO_SAMPLE + SHADOW_FRAG,
    uniforms: { ...shared, uShadowAlpha: { value: 0.42 } },
  });
  return { body, shadow, shared };
}
