import type * as THREE from "three";
import { FLOOR_HEIGHT_RANGE, GBUF_READ_GLSL, GBUF_WRITE_GLSL } from "../bake/gbufferGlsl";
import { bakeMaterial } from "../bake/surfaceBaker";
import { MOTIFS_GLSL } from "../glsl/motifs";
import { FRAG_PRELUDE, QUAD_VERT } from "../glsl/prelude";
import type { RigUniforms } from "../lighting/lightRig";
import { quadMaterial } from "../core/quad";
import type { ZoneShaders } from "../zones";
import { ROOM_HEADER } from "./roomHeader";

/** 烘焙区覆盖到前沿之下多少 px(楼板断面的可见厚度)。 */
export const FLOOR_BAKE_LIP = 32;

const HEIGHT_RANGE = FLOOR_HEIGHT_RANGE.toFixed(1);

const FLOOR_BAKE_MAIN = /* glsl */ `
varying vec2 vWorld;
void main() {
  float x = vWorld.x;
  float z = WALL_BASE - vWorld.y;
  Surf s;
  if (z > FLOOR_DEPTH) {
    // 前沿之下: 楼板断面的混凝土底色
    float k = z - FLOOR_DEPTH;
    s = surfOf(C_CONCRETE_DARK * (0.6 + 0.5 * fbm3(vec2(x, k) * 0.06)));
  } else {
    s = zoneFloor(vec2(x, z));
  }
  // 地面的 anim.w 存高度, 供倒影扰动使用
  s.anim.w = s.height / ${HEIGHT_RANGE} * 0.5 + 0.5;
  writeSurf(s);
}
`;

const FLOOR_LIVE_MAIN = /* glsl */ `
varying vec2 vWorld;
void main() {
  float x = vWorld.x;
  float z = WALL_BASE - vWorld.y;
  vec2 grad;
  Surf s = readBaked(bakeUv(vWorld), grad);
  if (z > FLOOR_DEPTH) {
    // 前沿之下: 楼板断面, 再往下沉入黑暗
    float k = z - FLOOR_DEPTH;
    float face = 1.0 - smoothstep(24.0, 30.0, k);
    vec3 spec;
    vec3 lit = pointLights(vec3(x, -k, FLOOR_DEPTH + 20.0), vec3(0.0, -0.2, 0.98), 0.1, spec);
    vec3 col = s.albedo * (uAmbient * 0.7 + lit) * face;
    col += uFogColor * 0.08 * (1.0 - face) * exp(-(k - 30.0) / 120.0);
    // 前沿的亮边
    col += (uAmbientTop * 0.4 + lit * 0.3) * exp(-k * 0.6) * 0.5;
    gl_FragColor = vec4(col, 1.0);
    return;
  }
  float height = (s.anim.w * 2.0 - 1.0) * ${HEIGHT_RANGE};
  vec3 n = normalize(vec3(-grad.x, 1.0, grad.y));
  float ao = s.ao * mix(0.42, 1.0, smoothstep(0.0, 70.0, z));
  vec3 pos = vec3(x, 0.0, z);
  vec3 col = shade(s.albedo, pos, n, s.gloss, ao) + s.emit + zoneFloorLive(vec2(x, z), s.anim);
  col += floorReflect(pos, s.wet, height * 3.0) * (0.35 + s.gloss * 0.65);
  // 墙根的暗线, 让墙面与地面交接更扎实
  col *= 1.0 - exp(-z * 0.25) * 0.5;
  gl_FragColor = vec4(col, 1.0);
}
`;

/** 地面烘焙材质: 纵深 0 ~ 前沿 + FLOOR_BAKE_LIP 的区域写入 G-buffer。 */
export function floorBakeMaterial(zone: ZoneShaders, rig: RigUniforms, room: Record<string, THREE.IUniform>): THREE.ShaderMaterial {
  return bakeMaterial(
    QUAD_VERT,
    FRAG_PRELUDE + MOTIFS_GLSL + ROOM_HEADER + GBUF_WRITE_GLSL + zone.floor + FLOOR_BAKE_MAIN,
    { ...rig, ...room },
  );
}

/** 地面实时材质: 读烘焙结果打光, 叠动画发光与灯光倒影。gbuf 为 tG0~tG3 与 uBakeRect。 */
export function floorLiveMaterial(zone: ZoneShaders, rig: RigUniforms, room: Record<string, THREE.IUniform>, gbuf: Record<string, THREE.IUniform>): THREE.ShaderMaterial {
  return quadMaterial({
    vertexShader: QUAD_VERT,
    fragmentShader: FRAG_PRELUDE + MOTIFS_GLSL + ROOM_HEADER + GBUF_READ_GLSL + zone.floorLive + FLOOR_LIVE_MAIN,
    uniforms: { ...room, ...gbuf },
    rig,
  });
}
