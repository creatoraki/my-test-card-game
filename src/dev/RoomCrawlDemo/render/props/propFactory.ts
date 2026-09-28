import * as THREE from "three";
import { worldY } from "../../data/layout";
import { damp } from "../../engine/springBone";
import type { PropDef, PropKind } from "../../types";
import { orderForZ } from "../core/depthSort";
import { makeQuad, placeMesh, quadMaterial } from "../core/quad";
import { FRAG_PRELUDE, QUAD_VERT } from "../glsl/prelude";
import type { DynamicLight, LightRig } from "../lighting/lightRig";
import { createContactShadow, type ContactShadow } from "../actors/contactShadow";
import { INCUBATOR_SPEC } from "../arkProps/incubatorProp";
import { SEED_VAULT_SPEC } from "../arkProps/seedVaultProp";
import { TERMINAL_SPEC } from "../arkProps/terminalProp";
import type { BurstFx } from "../fx/sparks";
import { MOTIFS_GLSL } from "../glsl/motifs";
import { PROP_COMMON, PROP_MAIN } from "./propHighlight";
import { REMAINS_SPEC } from "./remainsProp";
import { SAFE_SPEC } from "./safeProp";
import { VENDING_SPEC } from "./vendingProp";

export interface PropContext {
  fx: BurstFx;
  lights: LightRig;
}

/** 一种交互物的外观与调查编排。GLSL 须定义 propShade 与 propSdf(见 propHighlight)。 */
export interface PropSpec {
  bounds: { w: number; h: number; x0: number; y0: number };
  glsl: string;
  shadow: readonly [number, number];
  /** 提示条锚点离地高度。 */
  promptH: number;
  /** 调查进度从 prev 推进到 cur 时的附加表现(灯光、粒子)。 */
  choreo?(view: PropView, ctx: PropContext, prev: number, cur: number): void;
}

const SPECS: Record<PropKind, PropSpec> = {
  safe: SAFE_SPEC,
  vending: VENDING_SPEC,
  remains: REMAINS_SPEC,
  seedVault: SEED_VAULT_SPEC,
  terminal: TERMINAL_SPEC,
  incubator: INCUBATOR_SPEC,
};

/** 一个交互物的渲染体。 */
export class PropView {
  readonly group = new THREE.Group();
  readonly material: THREE.ShaderMaterial;
  readonly spec: PropSpec;
  /** 编排中挂上的动态光(提灯、箱内溢光)。 */
  light: DynamicLight | null = null;
  private mesh: THREE.Mesh;
  private shadow: ContactShadow;
  private focusTarget = 0;
  private searchedTarget = 0;
  private anim = 0;

  constructor(readonly def: PropDef, rig: LightRig, accent: number, private ctx: PropContext) {
    this.spec = SPECS[def.kind];
    const b = this.spec.bounds;
    this.material = quadMaterial({
      vertexShader: QUAD_VERT,
      fragmentShader: FRAG_PRELUDE + MOTIFS_GLSL + PROP_COMMON + this.spec.glsl + PROP_MAIN,
      uniforms: {
        uAnim: { value: 0 },
        uSearched: { value: 0 },
        uFocus: { value: 0 },
        uFlip: { value: def.flip ? -1 : 1 },
        uPSeed: { value: (def.x * 0.013 + def.z * 0.07) % 17 },
        uProp: { value: new THREE.Vector3(def.x, 0, def.z) },
        uAccent: { value: new THREE.Color(accent) },
      },
      rig: rig.uniforms,
    });
    const y = worldY(def.z);
    this.mesh = placeMesh(makeQuad(b.w, b.h, b.x0, b.y0), this.material, def.x, y, orderForZ(def.z, 1));
    this.shadow = createContactShadow(this.spec.shadow[0], this.spec.shadow[1], 0.7);
    this.shadow.mesh.position.set(def.x, y + 4, 0);
    this.group.add(this.shadow.mesh, this.mesh);
  }

  setFocus(on: boolean): void {
    this.focusTarget = on ? 1 : 0;
  }

  /** 调查进度 0~1。 */
  setAnim(v: number): void {
    const prev = this.anim;
    this.anim = v;
    this.material.uniforms.uAnim.value = v;
    this.spec.choreo?.(this, this.ctx, prev, v);
  }

  /** 已搜索: 直接置为动画终态并去饱和。 */
  markSearched(instant: boolean): void {
    if (instant) {
      // 重进房间: 直接落到终态, 编排按「已越过所有节点」处理, 不再重放粒子
      this.anim = 1;
      this.material.uniforms.uAnim.value = 1;
      this.spec.choreo?.(this, this.ctx, 1, 1);
      this.material.uniforms.uSearched.value = 1;
    } else {
      this.setAnim(1);
    }
    this.searchedTarget = 1;
  }

  update(dt: number): void {
    const u = this.material.uniforms;
    u.uFocus.value = damp(u.uFocus.value, this.focusTarget, 10, dt);
    u.uSearched.value = damp(u.uSearched.value, this.searchedTarget, 2.5, dt);
  }

  /** 撤掉编排挂上的动态光; 网格与材质随房间场景树统一回收。 */
  release(): void {
    if (this.light) this.ctx.lights.removeDynamic(this.light);
  }
}
