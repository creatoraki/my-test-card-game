import * as THREE from "three";
import { LAYER } from "../core/depthSort";
import { makeQuad, placeMesh, quadMaterial } from "../core/quad";
import type { RetireMaterial } from "../core/disposer";
import { QUAD_VERT } from "../glsl/prelude";

/**
 * 获得物光效: 一颗光核从物体里升起, 拖着光尾, 到顶后炸成一圈光环与四角星芒, 随后淡出。
 * 与 DOM 的「获得」飘字同时出现。
 */
const FRAG = /* glsl */ `
uniform float uAge;
uniform vec3 uColor;
varying vec2 vLocal;
void main() {
  float k = uAge;
  float riseK = smoothstep(0.0, 0.45, k);
  vec2 core = vec2(sin(k * 9.0) * 6.0 * (1.0 - riseK), riseK * 150.0);
  vec2 d = vLocal - core;
  float orb = exp(-length(d) / 5.0) * 2.4 * (1.0 - smoothstep(0.45, 0.6, k));
  // 光尾
  float tail = exp(-abs(vLocal.x - core.x * 0.5) / 3.0) * step(vLocal.y, core.y) * step(0.0, vLocal.y) * exp(-(core.y - vLocal.y) / 40.0) * (1.0 - smoothstep(0.4, 0.55, k));
  // 爆开的光环与星芒
  float burstK = smoothstep(0.42, 1.0, k);
  float r = length(d);
  float ring = exp(-abs(r - burstK * 70.0) / 3.0) * (1.0 - burstK) * step(0.42, k);
  float star = (exp(-abs(d.x) / 1.4) * exp(-abs(d.y) / (26.0 * (1.0 - burstK) + 1.0)) + exp(-abs(d.y) / 1.4) * exp(-abs(d.x) / (26.0 * (1.0 - burstK) + 1.0))) * step(0.42, k) * (1.0 - burstK);
  vec3 c = uColor * (orb + tail * 0.7 + ring * 1.2 + star * 1.6) + vec3(1.0) * orb * 0.5;
  gl_FragColor = vec4(c, 0.0);
}
`;

interface Glint {
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
  age: number;
}

const DURATION = 1.4;

function glintMaterial(color: THREE.Color): THREE.ShaderMaterial {
  return quadMaterial({
    vertexShader: QUAD_VERT,
    fragmentShader: FRAG,
    uniforms: { uAge: { value: 0 }, uColor: { value: color.clone() } },
    blending: THREE.AdditiveBlending,
  });
}

export class LootGlints {
  readonly group = new THREE.Group();
  private items: Glint[] = [];

  /** retire: 材质回收方式(保留程序, 之后每次获得都不必重编)。 */
  constructor(private retire: RetireMaterial) {}

  /** 预编译用的占位网格(不加入场景), 编译后交给 retire 回收。 */
  warmMesh(): THREE.Mesh {
    return placeMesh(makeQuad(1, 1), glintMaterial(new THREE.Color()), 0, 0, 0);
  }

  spawn(x: number, y: number, color: THREE.Color): void {
    const material = glintMaterial(color);
    const mesh = placeMesh(makeQuad(200, 260, -100, -30), material, x, y, LAYER.air + 2);
    this.group.add(mesh);
    this.items.push({ mesh, material, age: 0 });
  }

  update(dt: number): void {
    this.items = this.items.filter((g) => {
      g.age += dt / DURATION;
      g.material.uniforms.uAge.value = g.age;
      if (g.age < 1) return true;
      this.group.remove(g.mesh);
      g.mesh.geometry.dispose();
      this.retire(g.material);
      return false;
    });
  }

  clear(): void {
    this.update(DURATION * 10);
  }
}
