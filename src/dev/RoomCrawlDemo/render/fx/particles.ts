import * as THREE from "three";
import { MAX_LIGHTS } from "../glsl/lighting";
import { LAYER } from "../core/depthSort";
import type { RigUniforms } from "../lighting/lightRig";
import { WALL_BASE_WY } from "../../data/layout";

/** 环境漂浮粒子的运动方式: 浮尘(原地漂) / 上升(孢子、余烬)。 */
export interface AmbientConfig {
  count: number;
  color: THREE.Color;
  size: number;
  alpha: number;
  /** 上升速度(px/s); 0 = 原地漂浮。 */
  rise: number;
  drift: number;
  h0: number;
  h1: number;
  /** 横向范围; 为 null 时铺满整个房间(绕相机窗口循环, 省粒子)。 */
  range: [number, number] | null;
  /** 余烬式闪烁。 */
  flicker: boolean;
}

/**
 * 无状态 GPU 粒子: 位置完全由种子与时间在顶点着色器里算出, 不占 CPU。
 * 靠近灯的粒子会被照亮(浮尘在光里才看得见)。
 */
const VERT = /* glsl */ `
#define MAX_LIGHTS ${MAX_LIGHTS}
attribute vec4 aSeed;
uniform float uTime;
uniform float uCamX;
uniform float uPixelScale;
uniform vec2 uRange;
uniform float uWrap;
uniform vec2 uH;
uniform float uRise;
uniform float uDrift;
uniform float uSize;
uniform float uAlpha;
uniform float uFlicker;
uniform vec4 uLightPos[MAX_LIGHTS];
uniform vec4 uLightCol[MAX_LIGHTS];
uniform int uLightCount;
varying float vAlpha;
varying vec3 vTint;
void main() {
  float t = uTime;
  float speed = 0.5 + aSeed.w;
  float x;
  if (uWrap > 0.5) {
    float win = 2240.0;
    float base = uCamX - 160.0;
    x = base + mod(aSeed.x * 7919.0 + t * uDrift * speed - base, win);
  } else {
    float span = uRange.y - uRange.x;
    x = uRange.x + fract(aSeed.x + t * uDrift * speed / span) * span;
  }
  float life = fract(aSeed.y + t * uRise * speed / (uH.y - uH.x + 1.0));
  float h = uRise > 0.0 ? mix(uH.x, uH.y, life) : mix(uH.x, uH.y, aSeed.y) + sin(t * 0.45 + aSeed.z * 20.0) * 14.0;
  float z = aSeed.z * 300.0;
  x += sin(t * 0.6 + aSeed.w * 30.0) * 18.0;
  vec3 tint = vec3(0.0);
  float lit = 0.0;
  for (int i = 0; i < MAX_LIGHTS; i++) {
    if (i >= uLightCount) break;
    vec3 d = uLightPos[i].xyz - vec3(x, h, z);
    d.z *= 1.7;
    float r = clamp(1.0 - length(d) / uLightPos[i].w, 0.0, 1.0);
    tint += uLightCol[i].rgb * r * r;
    lit += r * r;
  }
  float fade = uRise > 0.0 ? sin(life * 3.14159) : 1.0;
  float flick = uFlicker > 0.5 ? 0.45 + 0.55 * step(0.3, fract(sin(floor(t * 12.0 + aSeed.x * 50.0)) * 43758.5)) : 1.0;
  vAlpha = uAlpha * fade * flick * (uFlicker > 0.5 ? 1.0 : 0.25 + min(lit * 1.6, 1.4));
  vTint = tint;
  gl_PointSize = uSize * (0.5 + aSeed.w) * uPixelScale;
  gl_Position = projectionMatrix * viewMatrix * vec4(x, ${WALL_BASE_WY.toFixed(1)} - z + h, 0.0, 1.0);
}
`;

const FRAG = /* glsl */ `
uniform vec3 uColor;
varying float vAlpha;
varying vec3 vTint;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = exp(-d * d * 4.0) * vAlpha;
  vec3 c = uColor + vTint * 0.35;
  gl_FragColor = vec4(c * a, 0.0);
}
`;

export interface AmbientPoints {
  points: THREE.Points;
  uniforms: Record<string, THREE.IUniform>;
}

export function createAmbientPoints(cfg: AmbientConfig, rig: RigUniforms, pixelScale: THREE.IUniform<number>): AmbientPoints {
  const seeds = new Float32Array(cfg.count * 4);
  for (let i = 0; i < seeds.length; i++) seeds[i] = Math.random();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(cfg.count * 3), 3));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
  const [r0, r1] = cfg.range ?? [0, 1];
  const uniforms: Record<string, THREE.IUniform> = {
    uTime: rig.uTime,
    uCamX: rig.uCamX,
    uLightPos: rig.uLightPos,
    uLightCol: rig.uLightCol,
    uLightCount: rig.uLightCount,
    uPixelScale: pixelScale,
    uRange: { value: new THREE.Vector2(r0, r1) },
    uWrap: { value: cfg.range ? 0 : 1 },
    uH: { value: new THREE.Vector2(cfg.h0, cfg.h1) },
    uRise: { value: cfg.rise },
    uDrift: { value: cfg.drift },
    uSize: { value: cfg.size },
    uAlpha: { value: cfg.alpha },
    uFlicker: { value: cfg.flicker ? 1 : 0 },
    uColor: { value: cfg.color },
  };
  const material = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    premultipliedAlpha: true,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;
  points.renderOrder = LAYER.air + 1;
  return { points, uniforms };
}
