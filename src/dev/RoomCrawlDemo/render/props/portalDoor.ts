import * as THREE from "three";
import { FLOOR_DEPTH, SIDE_DOOR_Z, worldY } from "../../data/layout";
import { doorAnchor } from "../../engine/doorTrigger";
import { damp } from "../../engine/springBone";
import type { DoorDef, RoomDef } from "../../types";
import { LAYER, orderForZ } from "../core/depthSort";
import { makeQuad, placeMesh, quadMaterial } from "../core/quad";
import { FRAG_PRELUDE, QUAD_VERT } from "../glsl/prelude";
import type { DynamicLight, LightRig } from "../lighting/lightRig";

/**
 * 传送门能量帘: 竖向流动的扫描光带 + 噪声涌动 + 上升光点。锁定时转红, 叠加斜向封锁条与锁形图标。
 * KIND 0 = 左右侧门(立在地面的门架), 1 = 后墙上门(只画能量帘), 2 = 前沿下门(地面光带 + 光柱)。
 */
const PORTAL_FRAG = /* glsl */ `
uniform float uLocked;
uniform vec3 uColor;
uniform float uDir;
varying vec2 vLocal;

vec3 curtain(vec2 q, vec2 size, out float a) {
  vec2 uv = q / size;
  float edge = sdBox(q, size);
  float inside = fillSoft(edge, 3.0);
  float flow = fbm(vec2(q.x * 0.03, q.y * 0.012 - uTime * 0.9));
  float scan = pow(0.5 + 0.5 * sin(q.y * 0.18 - uTime * 6.0), 6.0);
  float streak = pow(vnoise(vec2(q.x * 0.12, uTime * 0.5)), 3.0);
  vec2 dc = floor(vec2(q.x / 9.0, (q.y - uTime * 70.0) / 22.0));
  float dots = step(0.9, hash12(dc)) * fillAA(length(vec2(mod(q.x, 9.0) - 4.5, mod(q.y - uTime * 70.0, 22.0) - 11.0)) - 1.5);
  float rim = exp(-(-edge) / 7.0) * inside;
  vec3 lockC = vec3(1.0, 0.14, 0.08);
  vec3 c = mix(uColor, lockC, uLocked);
  float body = (0.18 + flow * 0.35 + scan * 0.25 + streak * 0.5) * inside;
  // 锁定: 斜向封锁条 + 锁形图标
  float bars = step(0.5, fract((q.x + q.y) / 36.0)) * uLocked * 0.35;
  vec2 lq = q - vec2(0.0, size.y * 0.1);
  float shackle = max(abs(length(lq - vec2(0.0, 10.0)) - 11.0) - 3.0, -(lq.y - 10.0));
  float lockBody = sdRoundBox(lq + vec2(0.0, 6.0), vec2(15.0, 12.0), 3.0);
  float icon = fillAA(min(shackle, lockBody)) * uLocked;
  a = clamp(body + rim * 0.8 + dots + bars * inside + icon, 0.0, 1.0) * 0.85;
  vec3 col = c * (body * 1.4 + rim * 2.2 + dots * 2.0 + bars * inside * 1.2) + vec3(1.0) * icon * 1.2;
  return col;
}

void main() {
  vec2 p = vLocal;
  vec3 col = vec3(0.0);
  float a = 0.0;
#if KIND == 0
  // 门架: 两根立柱 + 顶梁, 中间是能量帘
  float posts = min(sdRoundBox(vec2(abs(p.x) - 64.0, p.y - 130.0), vec2(10.0, 130.0), 3.0), sdRoundBox(p - vec2(0.0, 268.0), vec2(80.0, 12.0), 4.0));
  float ca;
  vec3 cc = curtain(p - vec2(0.0, 128.0), vec2(54.0, 126.0), ca);
  col = cc;
  a = ca;
  float pm = fillAA(posts);
  vec3 steel = vec3(0.06, 0.065, 0.075) * (0.8 + 0.4 * fbm3(p * 0.1));
  float light = fillAA(abs(abs(p.x) - 56.0) - 1.5) * step(8.0, p.y) * step(p.y, 256.0);
  col = mix(col, steel, pm) + mix(uColor, vec3(1.0, 0.14, 0.08), uLocked) * light * 2.5;
  a = max(a, pm);
  // 地面光环 + 朝外的箭头
  vec2 fq = vec2(p.x, p.y * 3.2);
  float ring = exp(-abs(length(fq) - 70.0) / 5.0) * step(p.y, 20.0);
  float arrow = 1.0 - smoothstep(0.0, 2.0, abs(abs(p.y * 1.6) - (p.x * uDir - 90.0 - mod(uTime * 40.0, 28.0)) ) - 3.0);
  arrow *= step(90.0, p.x * uDir) * step(p.x * uDir, 150.0) * step(abs(p.y), 18.0) * (1.0 - uLocked);
  vec3 gc = mix(uColor, vec3(1.0, 0.14, 0.08), uLocked);
  col += gc * (ring * 0.8 + arrow * 1.2);
  a = max(a, (ring * 0.5 + arrow * 0.6));
#elif KIND == 1
  float ca;
  col = curtain(p - vec2(0.0, 140.0), vec2(100.0, 138.0), ca);
  a = ca;
#else
  // 前沿下门: 地面光带 + 两侧光柱 + 向下的箭头
  vec3 gc = mix(uColor, vec3(1.0, 0.14, 0.08), uLocked);
  float band = exp(-abs(p.y) / 6.0) * (1.0 - smoothstep(90.0, 110.0, abs(p.x)));
  float pillars = exp(-abs(abs(p.x) - 100.0) / 5.0) * step(0.0, p.y) * exp(-p.y / 120.0);
  float flow = 0.6 + 0.4 * fbm(vec2(p.x * 0.05, p.y * 0.03 - uTime * 1.5));
  vec2 ap = vec2(abs(p.x), p.y - 20.0 - mod(-uTime * 30.0, 30.0));
  float chevron = (1.0 - smoothstep(0.0, 2.0, abs(ap.y + ap.x * 0.5 - 14.0) - 2.5)) * step(ap.x, 26.0) * step(0.0, p.y) * step(p.y, 70.0) * (1.0 - uLocked);
  float bars = step(0.5, fract((p.x + p.y) / 30.0)) * uLocked * step(abs(p.x), 96.0) * step(abs(p.y - 8.0), 10.0);
  col = gc * (band * 1.6 + pillars * flow * 1.3 + chevron * 1.4 + bars * 0.9);
  a = clamp(band + pillars * 0.6 + chevron + bars * 0.8, 0.0, 1.0) * 0.8;
#endif
  gl_FragColor = vec4(col * a, a);
}
`;

export class PortalDoor {
  readonly mesh: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private light: DynamicLight;

  constructor(readonly door: DoorDef, room: RoomDef, rig: LightRig, accent: number) {
    const a = doorAnchor(room, door);
    const kind = door.side === "up" ? 1 : door.side === "down" ? 2 : 0;
    this.material = quadMaterial({
      vertexShader: QUAD_VERT,
      fragmentShader: FRAG_PRELUDE + PORTAL_FRAG,
      defines: { KIND: kind },
      uniforms: {
        uLocked: { value: 0 },
        uColor: { value: new THREE.Color(accent) },
        uDir: { value: door.side === "left" ? -1 : 1 },
      },
      rig: rig.uniforms,
      blending: THREE.NormalBlending,
    });
    if (kind === 0) {
      const x = door.side === "left" ? a.x - 40 : a.x + 40;
      this.mesh = placeMesh(makeQuad(340, 320, -170, -40), this.material, x, worldY(SIDE_DOOR_Z), orderForZ(SIDE_DOOR_Z, 0));
      this.light = rig.addDynamic({ x, h: 120, z: SIDE_DOOR_Z + 20, color: new THREE.Color(accent), intensity: 0.9, radius: 360 });
    } else if (kind === 1) {
      this.mesh = placeMesh(makeQuad(220, 290, -110, -4), this.material, a.x, worldY(0), LAYER.wallAttach);
      this.light = rig.addDynamic({ x: a.x, h: 120, z: 30, color: new THREE.Color(accent), intensity: 1.0, radius: 380 });
    } else {
      this.mesh = placeMesh(makeQuad(280, 260, -140, -40), this.material, a.x, worldY(FLOOR_DEPTH), orderForZ(FLOOR_DEPTH, 9));
      this.light = rig.addDynamic({ x: a.x, h: 40, z: FLOOR_DEPTH - 10, color: new THREE.Color(accent), intensity: 0.9, radius: 340 });
    }
    this.light.color = new THREE.Color(accent);
    this.accent.set(accent);
  }

  private accent = new THREE.Color();
  private lockColor = new THREE.Color(1, 0.16, 0.08);

  update(locked: boolean, dt: number): void {
    const u = this.material.uniforms;
    u.uLocked.value = damp(u.uLocked.value, locked ? 1 : 0, 5, dt);
    this.light.color.copy(this.accent).lerp(this.lockColor, u.uLocked.value);
  }

  /** 撤掉门光; 网格与材质随房间场景树统一回收。 */
  release(rig: LightRig): void {
    rig.removeDynamic(this.light);
  }
}
