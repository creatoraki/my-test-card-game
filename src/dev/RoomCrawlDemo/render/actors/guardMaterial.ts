import * as THREE from "three";
import { FRAG_PRELUDE, QUAD_VERT } from "../glsl/prelude";
import type { RigUniforms } from "../lighting/lightRig";
import { quadMaterial } from "../core/quad";
import { ROOM_HEADER } from "../room/roomHeader";

/**
 * 黑影守卫本体: SDF 人形剪影(佝偻、长臂、下半身化烟), 内部流动烟雾, 边缘飘散触须,
 * 发光双眼会眨, 头顶警觉符号, 扑击姿态与溶解。面片本地坐标原点在脚底, 单位 px。
 */
const GUARD_FRAG = /* glsl */ `
uniform float uFacing;
uniform float uPhase;
uniform float uMove;
uniform float uLunge;
uniform float uAlert;
uniform float uBlink;
uniform float uDissolve;
uniform float uGSeed;
uniform vec3 uGuard;
varying vec2 vLocal;
varying vec2 vWorld;

/** 姿态空间: 前倾(扑击时加大)、拉长、行走起伏与待机漂浮。 */
vec2 guardSpace(vec2 p, float t) {
  p.x -= p.y * (0.1 + uLunge * 0.45);
  p.y /= 1.0 + uLunge * 0.08;
  p.y -= abs(sin(uPhase)) * 4.0 * uMove + sin(t * 1.6 + uGSeed) * 3.0;
  return p;
}

float guardSdf(vec2 p, float t) {
  float swing = sin(uPhase) * uMove;
  float head = sdEllipse(p - vec2(12.0 + uLunge * 10.0, 236.0), vec2(21.0, 26.0));
  float neck = sdSegment(p, vec2(2.0, 206.0), vec2(10.0, 226.0)) - 9.0;
  float torso = sdTrapezoid(p - vec2(0.0, 160.0), 18.0, 38.0, 44.0);
  float shoulders = sdEllipse(p - vec2(0.0, 200.0), vec2(40.0, 14.0));
  vec2 handN = mix(vec2(34.0 + swing * 22.0, 64.0), vec2(96.0, 176.0), uLunge);
  vec2 handF = mix(vec2(-30.0 - swing * 22.0, 70.0), vec2(84.0, 150.0), uLunge);
  float armN = sdSegment(p, vec2(26.0, 198.0), mix(vec2(40.0 + swing * 8.0, 128.0), vec2(64.0, 190.0), uLunge)) - 7.5;
  armN = smin(armN, sdSegment(p, mix(vec2(40.0 + swing * 8.0, 128.0), vec2(64.0, 190.0), uLunge), handN) - 5.5, 6.0);
  float armF = sdSegment(p, vec2(-24.0, 196.0), mix(vec2(-34.0 - swing * 8.0, 128.0), vec2(56.0, 176.0), uLunge)) - 7.0;
  armF = smin(armF, sdSegment(p, mix(vec2(-34.0 - swing * 8.0, 128.0), vec2(56.0, 176.0), uLunge), handF) - 5.0, 6.0);
  // 长爪
  float claws = min(sdSegment(p, handN, handN + vec2(10.0, -18.0)), sdSegment(p, handN, handN + vec2(2.0, -22.0))) - 2.2;
  float legs = min(sdSegment(p, vec2(8.0, 120.0), vec2(14.0 + swing * 26.0, 8.0)), sdSegment(p, vec2(-8.0, 120.0), vec2(-12.0 - swing * 26.0, 8.0))) - 10.0;
  float body = smin(head, neck, 8.0);
  body = smin(body, smin(torso, shoulders, 14.0), 10.0);
  body = smin(body, min(armN, armF), 8.0);
  body = min(body, claws);
  body = smin(body, legs, 14.0);
  // 下半身化作烟: 越往下边界越被噪声吃掉
  float low = 1.0 - smoothstep(20.0, 110.0, p.y);
  float n = flowNoise(p * 0.022 + uGSeed, t * 1.2) - 0.5;
  body += n * (8.0 + low * 34.0);
  return body;
}

void main() {
  float t = uTime;
  vec2 p = guardSpace(vec2(vLocal.x * uFacing, vLocal.y), t);
  float d = guardSdf(p, t);
  float body = fillSoft(d, 1.4);
  // 飘散触须: 身体外侧向上流动的细烟
  vec2 wq = vec2(p.x * 0.05 + sin(p.y * 0.03 + t) * 0.4, p.y * 0.02 - t * 0.9);
  float wisp = smoothstep(0.62, 0.9, ridged(wq + uGSeed)) * (1.0 - smoothstep(0.0, 46.0, d)) * step(0.0, d);
  float haze = (1.0 - smoothstep(0.0, 26.0, d)) * 0.35;
  // 内部: 深紫黑色烟雾缓慢翻涌, 夹杂暗红脉络
  float inner = flowNoise(p * 0.015 + uGSeed * 3.0, t * 0.8);
  vec3 col = mix(vec3(0.006, 0.004, 0.012), vec3(0.05, 0.02, 0.08), inner);
  col += vec3(0.25, 0.03, 0.12) * smoothstep(0.78, 0.9, ridged(p * 0.03 + t * 0.1)) * body * 0.6;
  // 边缘光: 按 SDF 梯度朝灯勾一圈冷光
  vec2 grad = vec2(dFdx(d), dFdy(d));
  vec2 nrm = normalize(grad + 1e-4);
  vec3 pos = vec3(vWorld.x, vLocal.y, uGuard.z + 4.0);
  float edge = 1.0 - smoothstep(0.0, 7.0, -d);
  col += spriteRim(pos, nrm) * edge * body * 0.45;
  // 眼睛: 两道横向发光细缝
  vec2 ep = p - vec2(24.0 + uLunge * 10.0, 240.0);
  float open = 1.0 - uBlink;
  float eye1 = sdEllipse(ep, vec2(7.0, 2.2 * open + 0.2));
  float eye2 = sdEllipse(ep - vec2(-12.0, 1.0), vec2(5.0, 1.8 * open + 0.2));
  float eyes = fillSoft(min(eye1, eye2), 0.8);
  vec3 eyeC = mix(vec3(0.7, 0.95, 1.0), vec3(1.0, 0.12, 0.06), uAlert);
  vec3 emit = eyeC * eyes * 5.0 + eyeC * exp(-min(eye1, eye2) / 6.0) * 0.5 * open;

  float a = max(body, max(wisp * 0.55, haze * (1.0 - body)));
  vec3 outC = col * body + vec3(0.02, 0.01, 0.03) * (1.0 - body);
  // 警觉符号「!」: 弹出时放大
  float pop = uAlert * (1.0 + 0.3 * exp(-uAlert * 4.0));
  vec2 ap = (vLocal - vec2(0.0, 300.0)) / max(pop, 0.01);
  float bang = min(sdSegment(ap, vec2(0.0, 6.0), vec2(0.0, 30.0)) - 5.0, length(ap + vec2(0.0, 6.0)) - 5.0);
  float bm = fillAA(bang) * step(0.05, uAlert);
  float bo = fillAA(bang - 3.0) * step(0.05, uAlert);
  emit += vec3(1.0, 0.25, 0.08) * bm * 3.0;
  outC = mix(outC, vec3(0.0), bo * (1.0 - bm));
  a = max(a, bo);

  // 溶解: 噪声阈值吃掉身体, 边缘冒淡紫色光
  if (uDissolve > 0.0) {
    float n = fbm(vLocal * 0.03 + uGSeed);
    float th = uDissolve * 1.2 - 0.1;
    float keepD = smoothstep(th, th + 0.05, n);
    float ember = (1.0 - smoothstep(0.0, 0.05, abs(n - th))) * body;
    emit = emit * keepD + vec3(0.7, 0.4, 1.0) * ember * 3.0;
    a = a * keepD + ember;
  }
  gl_FragColor = vec4(outC * a + emit * a, a);
}
`;

export function guardMaterial(rig: RigUniforms, seed: number): THREE.ShaderMaterial {
  return quadMaterial({
    vertexShader: QUAD_VERT,
    fragmentShader: FRAG_PRELUDE + ROOM_HEADER + GUARD_FRAG,
    uniforms: {
      uWidth: { value: 0 },
      uSeed: { value: 0 },
      uUpDoorX: { value: -1 },
      uDownDoorX: { value: -1 },
      uLocked: { value: 0 },
      uFacing: { value: 1 },
      uPhase: { value: 0 },
      uMove: { value: 0 },
      uLunge: { value: 0 },
      uAlert: { value: 0 },
      uBlink: { value: 0 },
      uDissolve: { value: 0 },
      uGSeed: { value: seed },
      uGuard: { value: new THREE.Vector3() },
    },
    rig,
  });
}

/** 守卫脚下扩散的暗影斑(带向外爬的细触须)。 */
const BLOT_FRAG = /* glsl */ `
uniform float uStrength;
uniform float uGSeed;
varying vec2 vLocal;
void main() {
  vec2 q = vLocal / vec2(90.0, 26.0);
  float r = length(q);
  float ang = atan(q.y, q.x);
  float tend = ridged(vec2(ang * 2.0 + uGSeed, r * 2.0 - uTime * 0.4));
  float reach = 0.7 + tend * 0.5 + sin(uTime * 1.3 + ang * 3.0) * 0.05;
  float a = (1.0 - smoothstep(reach * 0.5, reach, r)) * uStrength;
  a = max(a, (1.0 - smoothstep(0.0, 0.6, r)) * uStrength);
  gl_FragColor = vec4(vec3(0.02, 0.0, 0.03) * a, a * 0.85);
}
`;

export function blotMaterial(rig: RigUniforms, seed: number): THREE.ShaderMaterial {
  return quadMaterial({
    vertexShader: QUAD_VERT,
    fragmentShader: FRAG_PRELUDE + BLOT_FRAG,
    uniforms: { uStrength: { value: 0.8 }, uGSeed: { value: seed } },
    rig,
  });
}
