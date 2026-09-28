import type * as THREE from "three";
import { GBUF_READ_GLSL, GBUF_WRITE_GLSL } from "../bake/gbufferGlsl";
import { bakeMaterial } from "../bake/surfaceBaker";
import { MOTIFS_GLSL } from "../glsl/motifs";
import { FRAG_PRELUDE, QUAD_VERT } from "../glsl/prelude";
import type { RigUniforms } from "../lighting/lightRig";
import { quadMaterial } from "../core/quad";
import type { ZoneShaders } from "../zones";
import { ROOM_HEADER } from "./roomHeader";

/** 上门门框(通用, 烘焙): 厚钢门框 + 黄黑门楣。 */
const DOOR_FRAME = /* glsl */ `
void doorFrame(vec2 d, inout Surf s) {
  float open = sdBox(d - vec2(0.0, 140.0), vec2(104.0, 140.0));
  float frame = sdBox(d - vec2(0.0, 152.0), vec2(132.0, 152.0));
  if (frame > 2.0) return;
  if (open < 0.0) {
    float depth = clamp(d.y / 280.0, 0.0, 1.0);
    layerSurf(s, 1.0, vec3(0.012, 0.014, 0.018) * (1.0 + depth), -24.0, 0.05);
    s.ao = 0.3;
    s.alpha = 1.0;
  }
  float fm = fillAA(frame) * (1.0 - fillAA(open));
  float edge = clamp(-frame / 28.0, 0.0, 1.0);
  vec3 steel = weather(C_STEEL_DARK * 1.7, d + 300.0, 1.0, 0.5, edge, 3.0);
  layerSurf(s, fm, steel, 12.0 + bevelH(frame, 6.0) * 6.0 - bevelH(-open, 4.0) * 4.0, 0.45);
  s.alpha = max(s.alpha, fillAA(frame));
  float lintel = fillAA(sdBox(d - vec2(0.0, 290.0), vec2(132.0, 14.0)));
  layerSurf(s, lintel, hazard(d, 30.0, 1.0), 16.0, 0.3);
}
`;

/** 上门状态灯(实时): 左右两盏, 锁定时红闪, 开启时常亮绿。 */
const DOOR_LAMP = /* glsl */ `
void doorLamp(vec2 d, inout Surf s) {
  vec2 lp = vec2(abs(d.x) - 118.0, d.y - 290.0);
  float lamp = fillAA(length(lp) - 6.0);
  vec3 lc = mix(vec3(0.2, 1.0, 0.5), vec3(1.0, 0.1, 0.05), uLocked);
  float blink = mix(1.0, step(0.5, fract(uTime * 1.5)), uLocked);
  s.emit += lc * lamp * (1.0 + blink * 3.0);
  s.emit += lc * exp(-length(lp) / 14.0) * blink * 0.5;
}
`;

const WALL_BAKE_MAIN = /* glsl */ `
varying vec2 vWorld;
void main() {
  vec2 p = vec2(vWorld.x, vWorld.y - WALL_BASE);
  Surf s = zoneWall(p);
  if (uUpDoorX >= 0.0 && abs(p.x - uUpDoorX) < 160.0) doorFrame(p - vec2(uUpDoorX, 0.0), s);
  writeSurf(s);
}
`;

const WALL_LIVE_MAIN = /* glsl */ `
varying vec2 vWorld;
void main() {
  vec2 p = vec2(vWorld.x, vWorld.y - WALL_BASE);
  vec2 grad;
  Surf s = readBaked(bakeUv(vWorld), grad);
  // 灯具随灯光闪烁, 每帧叠在烘焙结果上。循环里只挑最近的贴墙灯(不含梯度指令),
  // 灯具外形在循环外画一次: 梯度函数留在循环里会迫使 D3D 编译器把循环整个展开, 编译极慢。
  // 取最近灯而非设距离阈值, 使 d 在屏幕上连续, fwidth 不会在阈值边界跳变。
  vec2 fd = vec2(1e4);
  float fLevel = 0.0;
  vec3 fCol = vec3(0.0);
  float fBest = 1e8;
  for (int i = 0; i < MAX_LIGHTS; i++) {
    if (i >= uStaticCount) break;
    vec4 lp = uLightPos[i];
    if (lp.z > 40.0) continue;
    vec2 d = p - lp.xy;
    float dist = dot(d, d);
    if (dist < fBest) {
      fBest = dist;
      fd = d;
      fLevel = uLightCol[i].w;
      fCol = uLightCol[i].rgb;
    }
  }
  zoneFixture(fd, fLevel, fCol, s);
  if (uUpDoorX >= 0.0 && abs(p.x - uUpDoorX) < 160.0 && abs(p.y - 290.0) < 80.0) doorLamp(p - vec2(uUpDoorX, 0.0), s);
  vec2 g = grad + vec2(dFdx(s.height), dFdy(s.height));
  if (s.alpha < 0.002) {
    gl_FragColor = vec4(0.0);
    return;
  }
  float ao = s.ao * mix(0.4, 1.0, smoothstep(0.0, 90.0, p.y)) * mix(1.0, 0.6, smoothstep(300.0, 440.0, p.y));
  vec3 n = normalize(vec3(-g, 1.0));
  vec3 col = shade(s.albedo, vec3(p.x, p.y, 0.0), n, s.gloss, ao) + s.emit + zoneWallLive(p, s.anim);
  col = mix(col, uFogColor * 0.5, uFogDensity * 0.16);
  gl_FragColor = vec4(col * s.alpha, s.alpha);
}
`;

/** 后墙烘焙材质: 区域墙面 + 门框的静态部分写入 G-buffer。 */
export function wallBakeMaterial(zone: ZoneShaders, rig: RigUniforms, room: Record<string, THREE.IUniform>): THREE.ShaderMaterial {
  return bakeMaterial(
    QUAD_VERT,
    FRAG_PRELUDE + MOTIFS_GLSL + ROOM_HEADER + GBUF_WRITE_GLSL + zone.wall + DOOR_FRAME + WALL_BAKE_MAIN,
    { ...rig, ...room },
  );
}

/** 后墙实时材质: 读烘焙结果, 叠灯具 / 门灯 / 动画发光后统一打光。gbuf 为 tG0~tG3 与 uBakeRect。 */
export function wallLiveMaterial(zone: ZoneShaders, rig: RigUniforms, room: Record<string, THREE.IUniform>, gbuf: Record<string, THREE.IUniform>): THREE.ShaderMaterial {
  return quadMaterial({
    vertexShader: QUAD_VERT,
    fragmentShader: FRAG_PRELUDE + MOTIFS_GLSL + ROOM_HEADER + GBUF_READ_GLSL + zone.wallLive + DOOR_LAMP + WALL_LIVE_MAIN,
    uniforms: { ...room, ...gbuf },
    rig,
  });
}
